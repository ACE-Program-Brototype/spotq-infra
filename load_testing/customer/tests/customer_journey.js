import http from 'k6/http';
import crypto from 'k6/crypto';
import { check, group, sleep } from 'k6';
import { ENDPOINTS, FALLBACK_RESTAURANT_ID, FALLBACK_MENU_ITEM_ID, RAZORPAY_KEY_SECRET } from '../config.js';
import { getAuthHeaders, generateUuid } from '../helpers/auth.js';

/**
 * Simulates the must-tested, mission-critical end-to-end customer persona journey:
 * 1. Discovery: Restaurant Directory & Full Menu Catalog
 * 2. Virtual Queue: Wait-Time ETA & Queue Join / Position Polling
 * 3. Cart Management: Fast Redis Cart Synchronization
 * 4. Checkout & Ordering: Live Checkout Calculation & Order Placement (Queue active)
 * 5. Payments: Headless S2S Payment Verification & Ledger Audit
 * 6. Teardown: Leave Queue cleanup
 */
export function runCustomerJourney(token, seedData = {}) {
  const headers = getAuthHeaders(token);
  const restaurantId = seedData.restaurantId || FALLBACK_RESTAURANT_ID;
  const menuItemId = seedData.menuItemId || FALLBACK_MENU_ITEM_ID;

  let activeCartId = null;
  let activeOrderId = null;
  let razorpayOrderId = null;
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

    sleep(Math.random() * 1.5 + 0.5);
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

    sleep(0.3);

    // 2. Query ML-driven queue wait time ETA for party size of 2
    const etaUrl = `${ENDPOINTS.GET_ETA(restaurantId)}?partySize=2`;
    const etaRes = http.get(etaUrl, {
      ...headers,
      tags: { endpoint: 'queue_eta' },
    });

    check(etaRes, {
      'queue ETA responded successfully': (r) => [200, 404, 409].includes(r.status),
    });

    sleep(0.5);

    // 3. Join the target restaurant virtual queue
    const randomGuestId = Math.floor(100000 + Math.random() * 900000);
    const joinPayload = JSON.stringify({
      guestName: `Diner VU-${__VU || 1}-${randomGuestId}`,
      guestPhone: `+9198${randomGuestId}12`,
      partySize: Math.floor(Math.random() * 4) + 1,
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

    sleep(0.5);

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
    }

    // Note: Do NOT leave queue yet! SpotQ requires an ACTIVE queue entry to place a queue pre-order.
    // The diner leaves the queue at the end of the journey after order and payment completion.
    sleep(Math.random() * 1.5 + 0.5);
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

    sleep(0.5);

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

    sleep(Math.random() * 1.0 + 0.5);
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

    sleep(0.5);

    // 2. Place takeaway order (Diner has active queue ticket from step 02)
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
        activeOrderId = body.data?.id || body.data?.orderId || body.data?.order?.id;
        // Extract real Razorpay Order ID created by payment-service in paymentDraft
        razorpayOrderId =
          body.data?.paymentDraft?.razorpayOrderId ||
          body.data?.paymentDraft?.orderId ||
          body.data?.razorpayOrderId ||
          body.data?.razorpay?.id ||
          body.data?.payment?.razorpayOrderId ||
          body.data?.order?.razorpayOrderId;
      } catch (_) {}
    }

    sleep(0.5);

    // 3. Query placed order details or track status
    if (activeOrderId) {
      const orderDetailRes = http.get(ENDPOINTS.ORDER_DETAILS(activeOrderId), {
        ...headers,
        tags: { endpoint: 'order_details' },
      });

      check(orderDetailRes, {
        'order details query returned 200': (r) => r.status === 200,
      });
    }

    sleep(0.5);

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

    sleep(Math.random() * 1.5 + 0.5);
  });

  // ── 05. Payments & S2S Settlement ─────────────────────────────────────────
  group('05_Payments_And_Settlement', () => {
    // 1. Direct Server-to-Server Payment Verification (Headless Test Mode)
    if (activeOrderId && razorpayOrderId) {
      const rzpPaymentId = `pay_test_${Math.floor(100000000 + Math.random() * 900000000)}`;

      let signature = 'simulated_k6_test_signature_hash';
      if (RAZORPAY_KEY_SECRET) {
        const signaturePayload = `${razorpayOrderId}|${rzpPaymentId}`;
        signature = crypto.hmac('sha256', RAZORPAY_KEY_SECRET, signaturePayload, 'hex');
      }

      const verifyPayload = JSON.stringify({
        orderId: activeOrderId,
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: rzpPaymentId,
        razorpaySignature: signature,
      });

      const verifyRes = http.post(ENDPOINTS.VERIFY_PAYMENT, verifyPayload, {
        ...headers,
        tags: { endpoint: 'payment_verify' },
      });

      check(verifyRes, {
        'payment verification returned 200': (r) => r.status === 200 || r.status === 201,
      });

      sleep(0.5);

      // 2. Check order payment status
      const payStatusRes = http.get(ENDPOINTS.PAYMENT_STATUS(activeOrderId), {
        ...headers,
        tags: { endpoint: 'payment_status' },
      });

      check(payStatusRes, {
        'order payment status returned 200': (r) => r.status === 200,
      });

      sleep(0.5);
    }

    // 3. Query customer dining payment history ledger
    const payHistoryUrl = `${ENDPOINTS.PAYMENT_HISTORY}?page=1&limit=10&status=ALL`;
    const payHistoryRes = http.get(payHistoryUrl, {
      ...headers,
      tags: { endpoint: 'payment_history' },
    });

    check(payHistoryRes, {
      'payment history returned 200': (r) => r.status === 200,
    });

    sleep(0.5);

    // 4. Clean State: Leave virtual queue at the end of the iteration
    if (activeQueueEntryId) {
      const leavePayload = JSON.stringify({
        queueEntryId: activeQueueEntryId,
      });

      http.post(ENDPOINTS.LEAVE_QUEUE(restaurantId), leavePayload, {
        ...headers,
        tags: { endpoint: 'queue_leave' },
      });
    }

    sleep(Math.random() * 1.5 + 0.5);
  });
}
