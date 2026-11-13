import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { ENDPOINTS, FALLBACK_RESTAURANT_ID, FALLBACK_CART_ID, FALLBACK_ORDER_ID } from '../config.js';
import { getAuthHeaders, generateUuid } from '../helpers/auth.js';

/**
 * Tests all Takeaway Orders & Checkout APIs: checkout calculation, order placement, details, history, cancellation
 */
export function runOrdersSuite(token, seedData = {}) {
  const headers = getAuthHeaders(token);
  const restaurantId = seedData.restaurantId || FALLBACK_RESTAURANT_ID;
  const testCartId = generateUuid();
  let createdOrderId = null;

  group('06_Takeaway_Orders_And_Checkout_APIs', () => {
    // 1. Validated Checkout Details (Pricing, Taxes, Packaging)
    const checkoutUrl = `${ENDPOINTS.CHECKOUT}?restaurantId=${restaurantId}&cartId=${testCartId}`;
    const checkoutRes = http.get(checkoutUrl, {
      ...headers,
      tags: { endpoint: 'orders_checkout' },
    });

    check(checkoutRes, {
      'checkout query responded': (r) => [200, 400, 404].includes(r.status),
    });

    sleep(0.3);

    // 2. Place Takeaway Order
    const idempotencyKey = generateUuid();
    const orderPayload = JSON.stringify({
      restaurantId,
      cartId: testCartId,
      paymentMode: 'ONLINE',
      userName: 'Orders Suite Diner',
      userPhone: '+919876543210',
      specialInstructions: 'Customer load test takeaway order',
    });

    const orderRes = http.post(ENDPOINTS.PLACE_ORDER, orderPayload, {
      headers: Object.assign({}, headers.headers, {
        'x-idempotency-key': idempotencyKey,
      }),
      tags: { endpoint: 'orders_place' },
    });

    const orderPlaced = check(orderRes, {
      'order placement responded': (r) => [200, 201, 400, 404].includes(r.status),
    });

    if (orderPlaced && (orderRes.status === 200 || orderRes.status === 201)) {
      try {
        const body = JSON.parse(orderRes.body);
        createdOrderId = body.data?.orderId || body.data?.id || body.data?.order?.id;
      } catch (_) {}
    }

    const testOrderId = createdOrderId || FALLBACK_ORDER_ID;
    sleep(0.4);

    // 3. Query Customer Past Orders History
    const historyUrl = `${ENDPOINTS.ORDERS_HISTORY}?page=1&limit=10&status=PLACED`;
    const historyRes = http.get(historyUrl, {
      ...headers,
      tags: { endpoint: 'orders_history' },
    });

    check(historyRes, {
      'orders history returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 4. Query Order Details & Live Tracking
    const detailRes = http.get(ENDPOINTS.ORDER_DETAILS(testOrderId), {
      ...headers,
      tags: { endpoint: 'order_details' },
    });

    check(detailRes, {
      'order details query responded': (r) => [200, 404].includes(r.status),
    });

    sleep(0.3);

    // 5. Cancel Takeaway Order
    const cancelPayload = JSON.stringify({
      cancellation_reason: 'Changed pickup schedule',
    });
    const cancelRes = http.post(ENDPOINTS.CANCEL_ORDER(testOrderId), cancelPayload, {
      ...headers,
      tags: { endpoint: 'orders_cancel' },
    });

    check(cancelRes, {
      'order cancel request responded': (r) =>
        [200, 400, 404, 409].includes(r.status),
    });

    sleep(0.5);
  });
}
