import http from 'k6/http';
import { check } from 'k6';
import { ENV, API_ENDPOINTS } from '../config/environments.js';
import { getActiveStages } from '../config/stages.js';
import { GRANULAR_THRESHOLDS } from '../config/thresholds.js';
import { authenticateStaffPool } from '../lib/auth.js';
import { buildHeaders } from '../lib/headers.js';
import { thinkTime, getVuSession, randomElement } from '../lib/helpers.js';
import { metrics } from '../lib/metrics.js';

const credentialsConfig = JSON.parse(open('../data/staff-credentials.json'));

export const options = {
  stages: getActiveStages(),
  thresholds: GRANULAR_THRESHOLDS,
};

export function setup() {
  return authenticateStaffPool(credentialsConfig);
}

/**
 * Kitchen Display System (KDS) & Order Fulfillment:
 * Simulates kitchen staff receiving orders and advancing order statuses.
 */
export default function (data) {
  const session = getVuSession(data.sessions);
  const restaurantId = session.restaurantId;
  const token = session.token;
  const headers = buildHeaders(token);

  // ── Step 1: Poll Active Kitchen Orders (Read Load) ──────────────────────────
  const ordersUrl = `${ENV.BASE_URL}${API_ENDPOINTS.ORDERS.LIST(restaurantId)}?status=PLACED,CONFIRMED,PREPARING&limit=20`;
  const listStart = Date.now();
  const listRes = http.get(ordersUrl, { headers });
  metrics.ordersListDuration.add(Date.now() - listStart);

  const isListOk = check(listRes, {
    'Kitchen orders feed status is 200': (r) => r.status === 200,
  });

  metrics.operationSuccessRate.add(isListOk);

  let orders = [];
  try {
    const body = listRes.json();
    orders = body.data?.orders || (Array.isArray(body.data) ? body.data : []);
  } catch (e) {
    // ignore parse error if response failed
  }

  thinkTime(1, 2);

  // ── Step 2: Fetch Order Details & Progress Status ───────────────────────────
  if (orders.length > 0) {
    const targetOrder = randomElement(orders);
    const orderId = targetOrder.id || targetOrder.orderId;

    if (orderId) {
      // Action 2a: View full order details (cook checks recipe/special instructions)
      const detailsUrl = `${ENV.BASE_URL}${API_ENDPOINTS.ORDERS.DETAILS(restaurantId, orderId)}`;
      const detailsRes = http.get(detailsUrl, { headers });

      check(detailsRes, {
        'Get order details status is 200': (r) => r.status === 200,
      });

      thinkTime(1, 2);

      // Action 2b: Progress order status (e.g. PREPARING -> READY, or CONFIRMED -> PREPARING)
      let nextStatus = 'PREPARING';
      if (targetOrder.status === 'PREPARING') {
        nextStatus = 'READY';
      } else if (targetOrder.status === 'READY') {
        nextStatus = 'SERVED';
      }

      const statusUrl = `${ENV.BASE_URL}${API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId)}`;
      const payload = JSON.stringify({
        status: nextStatus,
        notes: `Load test status update by VU ${__VU}`,
      });

      const updateStart = Date.now();
      const statusRes = http.patch(statusUrl, payload, { headers });
      metrics.orderStatusDuration.add(Date.now() - updateStart);

      const isStatusOk = check(statusRes, {
        'Update order status is 200 or 409 (conflict)': (r) => r.status === 200 || r.status === 409,
      });

      metrics.operationSuccessRate.add(isStatusOk);

      if (statusRes.status === 409) {
        metrics.conflictRate.add(1);
      }
    }
  }

  thinkTime(1, 3);
}

