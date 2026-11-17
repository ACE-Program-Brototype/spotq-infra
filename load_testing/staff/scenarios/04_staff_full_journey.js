import http from 'k6/http';
import { check } from 'k6';
import { ENV, API_ENDPOINTS } from '../config/environments.js';
import { getActiveStages } from '../config/stages.js';
import { GRANULAR_THRESHOLDS } from '../config/thresholds.js';
import { authenticateStaffPool } from '../lib/auth.js';
import { buildHeaders } from '../lib/headers.js';
import { thinkTime, getVuSession, generateE164Phone, randomElement } from '../lib/helpers.js';
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
 * End-to-End Restaurant Staff Shift Simulation:
 * Distributes VUs into 3 real-world roles:
 * - 40% Hostess (Queue management & Walk-ins)
 * - 30% Kitchen (KDS order preparation & updates)
 * - 30% Floor Staff (Table management & Turnover)
 */
export default function (data) {
  const session = getVuSession(data.sessions);
  const restaurantId = session.restaurantId;
  const token = session.token;
  const headers = buildHeaders(token);

  // Distribute role based on VU ID to ensure stable persona per virtual user
  const roleBucket = __VU % 10;

  if (roleBucket < 4) {
    // ── Persona A: Hostess (Queue Tablet) ───────────────────────────────────
    const queueUrl = `${ENV.BASE_URL}${API_ENDPOINTS.QUEUE.LIVE_QUEUE(restaurantId)}`;
    const qStart = Date.now();
    const qRes = http.get(queueUrl, { headers });
    metrics.liveQueueDuration.add(Date.now() - qStart);

    check(qRes, { 'Hostess: Live queue 200': (r) => r.status === 200 });

    thinkTime(1, 2);

    // Register walk-in with 25% chance
    if (Math.random() < 0.25) {
      const walkInUrl = `${ENV.BASE_URL}${API_ENDPOINTS.QUEUE.WALK_IN(restaurantId)}`;
      const payload = JSON.stringify({
        guestName: `Walkin Guest ${Date.now().toString().slice(-4)}`,
        guestPhone: generateE164Phone(),
        partySize: Math.floor(Math.random() * 4) + 1,
      });

      const wStart = Date.now();
      const wRes = http.post(walkInUrl, payload, { headers });
      metrics.walkInDuration.add(Date.now() - wStart);

      check(wRes, {
        'Hostess: Walk-in registered or rejected by business rule (201/200/400)': (r) =>
          r.status === 201 || r.status === 200 || r.status === 400,
      });
    }
  } else if (roleBucket < 7) {
    // ── Persona B: Kitchen Display System (KDS) ─────────────────────────────
    const ordersUrl = `${ENV.BASE_URL}${API_ENDPOINTS.ORDERS.LIST(restaurantId)}?status=PLACED,CONFIRMED,PREPARING&limit=20`;
    const oStart = Date.now();
    const oRes = http.get(ordersUrl, { headers });
    metrics.ordersListDuration.add(Date.now() - oStart);

    check(oRes, { 'Kitchen: Orders feed 200': (r) => r.status === 200 });

    let orders = [];
    try {
      orders = oRes.json().data?.orders || [];
    } catch (e) {}

    thinkTime(1, 2);

    if (orders.length > 0) {
      const order = randomElement(orders);
      const orderId = order.id || order.orderId;

      if (orderId) {
        const nextStatus = order.status === 'PREPARING' ? 'READY' : 'PREPARING';
        const statusUrl = `${ENV.BASE_URL}${API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId)}`;
        const sStart = Date.now();
        const sRes = http.patch(statusUrl, JSON.stringify({ status: nextStatus }), { headers });
        metrics.orderStatusDuration.add(Date.now() - sStart);

        check(sRes, { 'Kitchen: Order status progressed': (r) => r.status === 200 || r.status === 409 });
      }
    }
  } else {
    // ── Persona C: Floor Staff (Table Turnover) ─────────────────────────────
    const tablesUrl = `${ENV.BASE_URL}${API_ENDPOINTS.TABLES.LIST(restaurantId)}`;
    const tRes = http.get(tablesUrl, { headers });
    check(tRes, { 'Floor: Tables fetched 200': (r) => r.status === 200 });

    let tables = [];
    try {
      tables = tRes.json().data?.tables || [];
    } catch (e) {}

    thinkTime(1, 2);

    if (tables.length > 0) {
      const table = randomElement(tables);
      const tableId = table.id || table.tableId;

      if (tableId) {
        const updateUrl = `${ENV.BASE_URL}${API_ENDPOINTS.TABLES.UPDATE_STATUS(restaurantId, tableId)}`;
        const newStatus = table.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
        const uStart = Date.now();
        const uRes = http.patch(updateUrl, JSON.stringify({ status: newStatus }), { headers });
        metrics.tableStatusDuration.add(Date.now() - uStart);

        check(uRes, { 'Floor: Table status updated': (r) => r.status === 200 });
      }
    }
  }

  thinkTime(1, 3);
}

