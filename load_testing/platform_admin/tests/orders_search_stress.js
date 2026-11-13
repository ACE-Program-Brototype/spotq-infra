import http from 'k6/http';
import { check, sleep } from 'k6';
import { ENDPOINTS } from '../config.js';
import { getAuthHeaders } from '../helpers/auth.js';

/**
 * Dedicated Stress Test on Multi-Tenant Orders Search & Filtering
 * Target: GET /api/v1/orders/admin
 * Exercises dynamic multi-column filtering, search terms, and deep pagination on the largest table.
 */
export function runOrdersSearchStress(token) {
  const headers = getAuthHeaders(token);

  const statuses = ['ALL', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
  const paymentStatuses = ['ALL', 'PAID', 'PENDING', 'REFUNDED', 'FAILED'];
  const sortFields = ['createdAt', 'updatedAt', 'totalAmount', 'status'];
  const sortOrders = ['asc', 'desc'];

  const page = Math.floor(Math.random() * 5) + 1;
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
  const sortBy = sortFields[Math.floor(Math.random() * sortFields.length)];
  const sortOrder = sortOrders[Math.floor(Math.random() * sortOrders.length)];

  let query = `page=${page}&limit=25&sortBy=${sortBy}&sortOrder=${sortOrder}`;
  if (status !== 'ALL') query += `&status=${status}`;
  if (paymentStatus !== 'ALL') query += `&paymentStatus=${paymentStatus}`;

  const res = http.get(`${ENDPOINTS.ORDERS_LIST}?${query}`, {
    ...headers,
    tags: { endpoint: 'orders_list' },
    timeout: '15s',
  });

  check(res, {
    'orders search returned 200': (r) => r.status === 200,
    'orders returned valid array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && body.data && Array.isArray(body.data.orders);
      } catch (_) {
        return false;
      }
    },
  });

  sleep(Math.random() * 0.5 + 0.3);
}
