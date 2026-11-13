import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { ENDPOINTS, FALLBACK_RESTAURANT_ID, FALLBACK_MENU_ITEM_ID, FALLBACK_CART_ID, FALLBACK_CART_ITEM_ID } from '../config.js';
import { getAuthHeaders, generateUuid } from '../helpers/auth.js';

/**
 * Tests all Cart Management APIs: batch sync, single item add, get, update quantity, remove item, clear cart
 */
export function runCartSuite(token, seedData = {}) {
  const headers = getAuthHeaders(token);
  const restaurantId = seedData.restaurantId || FALLBACK_RESTAURANT_ID;
  const menuItemId = seedData.menuItemId || FALLBACK_MENU_ITEM_ID;

  let activeCartId = null;
  let activeCartItemId = null;

  group('05_Cart_Management_APIs', () => {
    // 1. Batch Add Items to Cart
    const batchPayload = JSON.stringify({
      restaurantId,
      items: [
        {
          menuItemId,
          quantity: 2,
          addonIds: [],
          specialInstructions: 'Extra napkins please',
        },
      ],
    });

    const batchRes = http.post(ENDPOINTS.CART_BATCH, batchPayload, {
      ...headers,
      tags: { endpoint: 'cart_batch_add' },
    });

    const batchOk = check(batchRes, {
      'cart batch add responded (200, 201, 400)': (r) =>
        [200, 201, 400].includes(r.status),
    });

    if (batchOk && (batchRes.status === 200 || batchRes.status === 201)) {
      try {
        const body = JSON.parse(batchRes.body);
        activeCartId = body.data?.cartId || body.data?.id;
        if (body.data?.items && body.data.items[0]) {
          activeCartItemId = body.data.items[0].id || body.data.items[0].cartItemId;
        }
      } catch (_) {}
    }

    const testCartId = activeCartId || FALLBACK_CART_ID;
    const testItemId = activeCartItemId || FALLBACK_CART_ITEM_ID;
    sleep(0.3);

    // 2. Add Single Item to Cart
    const singlePayload = JSON.stringify({
      restaurantId,
      menuItemId,
      quantity: 1,
      addonIds: [],
      specialInstructions: 'Spicy',
    });

    const singleRes = http.post(ENDPOINTS.CART_ITEMS, singlePayload, {
      ...headers,
      tags: { endpoint: 'cart_single_item_add' },
    });

    check(singleRes, {
      'cart single item add responded (200, 201, 400)': (r) =>
        [200, 201, 400].includes(r.status),
    });

    sleep(0.3);

    // 3. Fetch Cart by ID
    const getCartRes = http.get(ENDPOINTS.CART_BY_ID(testCartId), {
      ...headers,
      tags: { endpoint: 'cart_get_by_id' },
    });

    check(getCartRes, {
      'get cart by ID responded (200, 404)': (r) => [200, 404].includes(r.status),
    });

    sleep(0.3);

    // 4. Update Cart Item Quantity
    const updateQtyPayload = JSON.stringify({
      quantity: 3,
    });
    const updateQtyRes = http.patch(
      ENDPOINTS.CART_ITEM_BY_ID(testCartId, testItemId),
      updateQtyPayload,
      {
        ...headers,
        tags: { endpoint: 'cart_item_update_qty' },
      }
    );

    check(updateQtyRes, {
      'update cart item quantity responded (200, 400, 404)': (r) =>
        [200, 400, 404].includes(r.status),
    });

    sleep(0.3);

    // 5. Remove Item from Cart
    const removeItemRes = http.del(
      ENDPOINTS.CART_ITEM_BY_ID(testCartId, testItemId),
      null,
      {
        ...headers,
        tags: { endpoint: 'cart_item_delete' },
      }
    );

    check(removeItemRes, {
      'remove item from cart responded (200, 204, 400, 404)': (r) =>
        [200, 204, 400, 404].includes(r.status),
    });

    sleep(0.3);

    // 6. Clear Entire Cart
    const clearCartRes = http.del(ENDPOINTS.CART_BY_ID(testCartId), null, {
      ...headers,
      tags: { endpoint: 'cart_clear' },
    });

    check(clearCartRes, {
      'clear cart responded (200, 204, 400, 404)': (r) =>
        [200, 204, 400, 404].includes(r.status),
    });

    sleep(0.5);
  });
}
