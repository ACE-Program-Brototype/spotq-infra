import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { ENDPOINTS } from '../config.js';

/**
 * Health verification across all downstream services via API Gateway ingress
 */
export function runHealthSuite() {
  const params = {
    headers: { Accept: 'application/json' },
  };

  group('08_Service_Health_APIs', () => {
    // 1. User Service
    const usersRes = http.get(ENDPOINTS.HEALTH_USERS, Object.assign({}, params, {
      tags: { endpoint: 'health_users' },
    }));
    check(usersRes, { 'users health returned 200': (r) => r.status === 200 });

    // 2. Restaurant Service
    const restRes = http.get(ENDPOINTS.HEALTH_RESTAURANTS, Object.assign({}, params, {
      tags: { endpoint: 'health_restaurants' },
    }));
    check(restRes, { 'restaurants health returned 200': (r) => r.status === 200 });

    // 3. Queue Service
    const queueRes = http.get(ENDPOINTS.HEALTH_QUEUES, Object.assign({}, params, {
      tags: { endpoint: 'health_queues' },
    }));
    check(queueRes, { 'queues health returned 200': (r) => r.status === 200 });

    // 4. Order Service
    const orderRes = http.get(ENDPOINTS.HEALTH_ORDERS, Object.assign({}, params, {
      tags: { endpoint: 'health_orders' },
    }));
    check(orderRes, { 'orders health returned 200': (r) => r.status === 200 });

    // 5. Payment Service
    const payRes = http.get(ENDPOINTS.HEALTH_PAYMENTS, Object.assign({}, params, {
      tags: { endpoint: 'health_payments' },
    }));
    check(payRes, { 'payments health returned 200': (r) => r.status === 200 });

    sleep(0.3);
  });
}
