import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { ENDPOINTS, FALLBACK_RESTAURANT_ID, FALLBACK_MENU_ITEM_ID } from '../config.js';
import { getAuthHeaders, generateUuid } from '../helpers/auth.js';

/**
 * Simulates a comprehensive, realistic end-to-end customer persona journey:
 * Discovery -> Queue ETA -> Queue Registration -> Cart Batch -> Checkout -> Order Placement -> Orders & Payments History -> Profile
 */
export function runCustomerJourney(token, seedData = {}) {
  const headers = getAuthHeaders(token);
  const restaurantId = seedData.restaurantId || FALLBACK_RESTAURANT_ID;
  const menuItemId = seedData.menuItemId || FALLBACK_MENU_ITEM_ID;

  let activeCartId = null;
  let activeOrderId = null;
  let activeQueueEntryId = null;

  // ── 01. Restaurant Discovery & Catalog Exploration ────────────────────────
  group('01_Customer_Discovery', () => {
    // 1. Browse restaurants directory with sorting and pagination
    const listUrl = `${ENDPOINTS.RESTAURANTS_LIST}?page=1&limit=8&sortBy=createdAt&sortOrder=desc`;
    const listRes = http.get(listUrl, {
      ...headers,
      tags: { endpoint: 'restaurants_list' },
    });

    check(listRes, {
      'restaurants directory returned 200': (r) => r.status === 200,
      'restaurants directory has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && Array.isArray(body.data);
        } catch (_) {
          return false;
        }
      },
    });

    sleep(Math.random() * 1.5 + 0.5); // Human browsing pause

    // 2. Open selected restaurant to view menu categories & items
    const detailsUrl = `${ENDPOINTS.RESTAURANT_DETAILS(restaurantId)}?includeMenu=true`;
    const detailsRes = http.get(detailsUrl, {
      ...headers,
      tags: { endpoint: 'restaurant_details' },
    });

    check(detailsRes, {
      'restaurant details returned 200': (r) => r.status === 200,
      'restaurant payload has details': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && body.data !== undefined;
        } catch (_) {
          return false;
        }
      },
    });

    sleep(Math.random() * 2 + 1);
  });

  // ── 02. Virtual Queue Wait-Time Estimation & Queuing ───────────────────────
  group('02_Virtual_Queue_Operations', () => {
    // 1. Check if customer already has an active queue entry
    const activeRes = http.get(ENDPOINTS.ACTIVE_QUEUE, {
      ...headers,
      tags: { endpoint: 'queue_active' },
    });

    check(activeRes, {
      'active queue check responded with 200': (r) => r.status === 200,
    });

    sleep(0.5);

    // 2. Query ML-driven queue wait time ETA for party size of 2
    const etaUrl = `${ENDPOINTS.GET_ETA(restaurantId)}?partySize=2`;
    const etaRes = http.get(etaUrl, {
      ...headers,
      tags: { endpoint: 'queue_eta' },
    });

    check(etaRes, {
      'queue ETA responded successfully': (r) => [200, 404, 409].includes(r.status),
    });

    sleep(1);

    // 3. Join the restaurant virtual queue
    const joinPayload = JSON.stringify({
      guestName: 'Load Test Guest',
      guestPhone: '+919876543210',
      partySize: 2,
      specialNotes: 'Table near window if possible',
    });

    const joinRes = http.post(ENDPOINTS.JOIN_QUEUE(restaurantId), joinPayload, {
      ...headers,
      tags: { endpoint: 'queue_join' },
    });

    const joined = check(joinRes, {
      'join queue responded (200, 201, or 409)': (r) =>
        r.status === 200 || r.status === 201 || r.status === 409,
    });

    if (joined && (joinRes.status === 200 || joinRes.status === 201)) {
      try {
        const body = JSON.parse(joinRes.body);
        activeQueueEntryId =
          body.data?.id || body.data?.queueEntryId || body.data?.entry?.id;
      } catch (_) {}
    }

    sleep(1);

    // 4. Poll queue status if an entry was confirmed
    if (activeQueueEntryId) {
      const statusRes = http.get(
        ENDPOINTS.QUEUE_STATUS(restaurantId, activeQueueEntryId),
        {
          ...headers,
          tags: { endpoint: 'queue_status' },
        }
      );

      check(statusRes, {
        'queue status check returned 200': (r) => r.status === 200,
      });

      sleep(1);

      // 5. Leave queue to maintain clean state for subsequent VUs
      const leavePayload = JSON.stringify({
        queueEntryId: activeQueueEntryId,
      });

      const leaveRes = http.post(
        ENDPOINTS.LEAVE_QUEUE(restaurantId),
        leavePayload,
        {
          ...headers,
          tags: { endpoint: 'queue_leave' },
        }
      );

      check(leaveRes, {
        'leave queue responded successfully': (r) =>
          r.status === 200 || r.status === 204,
      });
    }

    sleep(Math.random() * 2 + 1);
  });

  // ── 03. Takeaway Cart Synchronization ─────────────────────────────────────
  group('03_Cart_Management', () => {
    // 1. Batch add selected items to cart
    const batchPayload = JSON.stringify({
      restaurantId,
      items: [
        {
          menuItemId,
          quantity: 2,
          addonIds: [],
          specialInstructions: 'Less spicy',
        },
      ],
    });

    const batchRes = http.post(ENDPOINTS.CART_BATCH, batchPayload, {
      ...headers,
      tags: { endpoint: 'cart_batch' },
    });

    const isCartCreated = check(batchRes, {
      'cart batch items added successfully (200 or 201)': (r) =>
        r.status === 200 || r.status === 201,
    });

    if (isCartCreated) {
      try {
        const body = JSON.parse(batchRes.body);
        activeCartId = body.data?.cartId || body.data?.id;
      } catch (_) {}
    }

    sleep(1);

    // 2. Fetch active cart contents
    if (activeCartId) {
      const cartRes = http.get(ENDPOINTS.CART_BY_ID(activeCartId), {
        ...headers,
        tags: { endpoint: 'cart_get' },
      });

      check(cartRes, {
        'get cart returned 200': (r) => r.status === 200,
      });
    }

    sleep(Math.random() * 1.5 + 0.5);
  });

  // ── 04. Checkout & Order Placement ─────────────────────────────────────────
  group('04_Checkout_And_Ordering', () => {
    const targetCartId = activeCartId || generateUuid();

    // 1. Inspect validated checkout calculation (pricing, taxes, packaging)
    const checkoutUrl = `${ENDPOINTS.CHECKOUT}?restaurantId=${restaurantId}&cartId=${targetCartId}`;
    const checkoutRes = http.get(checkoutUrl, {
      ...headers,
      tags: { endpoint: 'orders_checkout' },
    });

    check(checkoutRes, {
      'checkout query responded': (r) =>
        r.status === 200 || r.status === 400 || r.status === 404,
    });

    sleep(1);

    // 2. Place takeaway order
    const orderPayload = JSON.stringify({
      restaurantId,
      cartId: targetCartId,
      paymentMode: 'ONLINE',
      userName: 'Load Test Customer',
      userPhone: '+919876543210',
      specialInstructions: 'Contactless takeaway pickup',
    });

    const idempotencyKey = generateUuid();
    const orderRes = http.post(ENDPOINTS.PLACE_ORDER, orderPayload, {
      headers: Object.assign({}, headers.headers, {
        'x-idempotency-key': idempotencyKey,
      }),
      tags: { endpoint: 'place_order' },
    });

    const orderPlaced = check(orderRes, {
      'order placement responded': (r) =>
        r.status === 200 || r.status === 201 || r.status === 400,
    });

    if (orderPlaced && (orderRes.status === 200 || orderRes.status === 201)) {
      try {
        const body = JSON.parse(orderRes.body);
        activeOrderId = body.data?.orderId || body.data?.id || body.data?.order?.id;
      } catch (_) {}
    }

    sleep(1);

    // 3. Query placed order details or track status
    if (activeOrderId) {
      const orderDetailRes = http.get(ENDPOINTS.ORDER_DETAILS(activeOrderId), {
        ...headers,
        tags: { endpoint: 'order_details' },
      });

      check(orderDetailRes, {
        'order details query returned 200': (r) => r.status === 200,
      });

      sleep(0.5);

      // Check order payment status
      const payStatusRes = http.get(ENDPOINTS.PAYMENT_STATUS(activeOrderId), {
        ...headers,
        tags: { endpoint: 'payment_status' },
      });

      check(payStatusRes, {
        'order payment status returned 200': (r) => r.status === 200,
      });
    }

    sleep(1);

    // 4. View customer past orders history
    const historyUrl = `${ENDPOINTS.ORDERS_HISTORY}?page=1&limit=10`;
    const historyRes = http.get(historyUrl, {
      ...headers,
      tags: { endpoint: 'orders_history' },
    });

    check(historyRes, {
      'orders history returned 200': (r) => r.status === 200,
      'orders history payload contains array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && Array.isArray(body.data.orders || body.data);
        } catch (_) {
          return false;
        }
      },
    });

    sleep(Math.random() * 2 + 1);
  });

  // ── 05. Payments & Customer Account Management ────────────────────────────
  group('05_Payments_And_Profile', () => {
    // 1. Query dining payments ledger
    const payHistoryUrl = `${ENDPOINTS.PAYMENT_HISTORY}?page=1&limit=10&status=ALL`;
    const payHistoryRes = http.get(payHistoryUrl, {
      ...headers,
      tags: { endpoint: 'payment_history' },
    });

    check(payHistoryRes, {
      'payment history returned 200': (r) => r.status === 200,
    });

    sleep(0.5);

    // 2. Fetch authenticated customer profile
    const profileRes = http.get(ENDPOINTS.PROFILE, {
      ...headers,
      tags: { endpoint: 'customer_profile' },
    });

    check(profileRes, {
      'customer profile returned 200': (r) => r.status === 200,
    });

    sleep(0.5);

    // 3. Inspect registered push notification & session devices
    const devicesRes = http.get(ENDPOINTS.DEVICES, {
      ...headers,
      tags: { endpoint: 'customer_devices' },
    });

    check(devicesRes, {
      'customer devices returned 200': (r) => r.status === 200,
    });

    sleep(Math.random() * 1.5 + 0.5);
  });
}
