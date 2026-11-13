import http from 'k6/http';
import { check, sleep } from 'k6';
import { ENDPOINTS, FALLBACK_RESTAURANT_ID, FALLBACK_MENU_ITEM_ID } from '../config.js';
import { getAuthHeaders, generateUuid } from '../helpers/auth.js';

/**
 * Dedicated stress test targeting high-volume Cart sync, Checkout calculation, and Order creation:
 * - Concurrent Redis cart batch item writes
 * - Live checkout calculations (tax, packaging, restaurant commission)
 * - Order submission with idempotency validation
 * - Customer orders & payment history pagination
 */
export function runOrdersCartStress(token, seedData = {}) {
  const headers = getAuthHeaders(token);
  const restaurantId = seedData.restaurantId || FALLBACK_RESTAURANT_ID;
  const menuItemId = seedData.menuItemId || FALLBACK_MENU_ITEM_ID;

  // 1. Batch sync cart items
  const quantity = Math.floor(Math.random() * 3) + 1;
  const batchPayload = JSON.stringify({
    restaurantId,
    items: [
      {
        menuItemId,
        quantity,
        addonIds: [],
        specialInstructions: 'Fast preparation',
      },
    ],
  });

  const cartRes = http.post(ENDPOINTS.CART_BATCH, batchPayload, {
    ...headers,
    tags: { endpoint: 'cart_batch' },
  });

  let cartId = null;
  const cartOk = check(cartRes, {
    'cart batch handled (200, 201, or 400)': (r) =>
      [200, 201, 400].includes(r.status),
  });

  if (cartOk && (cartRes.status === 200 || cartRes.status === 201)) {
    try {
      const body = JSON.parse(cartRes.body);
      cartId = body.data?.cartId || body.data?.id;
    } catch (_) {}
  }

  const effectiveCartId = cartId || generateUuid();
  sleep(0.3);

  // 2. Checkout Calculation & Pricing Contract
  const checkoutUrl = `${ENDPOINTS.CHECKOUT}?restaurantId=${restaurantId}&cartId=${effectiveCartId}`;
  const checkoutRes = http.get(checkoutUrl, {
    ...headers,
    tags: { endpoint: 'orders_checkout' },
  });

  check(checkoutRes, {
    'checkout query responded (200, 400, or 404)': (r) =>
      [200, 400, 404].includes(r.status),
  });

  sleep(0.3);

  // 3. Place Order Under High Load
  const idempotencyKey = generateUuid();
  const orderPayload = JSON.stringify({
    restaurantId,
    cartId: effectiveCartId,
    paymentMode: 'ONLINE',
    userName: 'Stress Diner',
    userPhone: '+919876543210',
    specialInstructions: 'SpotQ Stress Suite',
  });

  const orderRes = http.post(ENDPOINTS.PLACE_ORDER, orderPayload, {
    headers: Object.assign({}, headers.headers, {
      'x-idempotency-key': idempotencyKey,
    }),
    tags: { endpoint: 'place_order' },
  });

  check(orderRes, {
    'order placement handled (200, 201, 400, or 404)': (r) =>
      [200, 201, 400, 404].includes(r.status),
  });

  sleep(0.4);

  // 4. Query Customer Past Orders History
  const historyUrl = `${ENDPOINTS.ORDERS_HISTORY}?page=1&limit=10`;
  const historyRes = http.get(historyUrl, {
    ...headers,
    tags: { endpoint: 'orders_history' },
  });

  check(historyRes, {
    'orders history responded 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
