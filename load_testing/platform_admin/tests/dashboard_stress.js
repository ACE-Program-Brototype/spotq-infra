import http from 'k6/http';
import { check, sleep } from 'k6';
import { ENDPOINTS } from '../config.js';
import { getAuthHeaders } from '../helpers/auth.js';

/**
 * Dedicated Stress Test on Platform Dashboard Analytics Aggregator
 * Target: GET /api/v1/restaurants/admin/analytics/dashboard
 * Evaluates fan-out to Payment Service and User Service under heavy load.
 */
export function runDashboardStress(token) {
  const headers = getAuthHeaders(token);
  const periods = ['day', 'week', 'month', 'year'];
  const cycles = ['ALL', 'MONTHLY', 'YEARLY'];

  const period = periods[Math.floor(Math.random() * periods.length)];
  const cycle = cycles[Math.floor(Math.random() * cycles.length)];
  const url = `${ENDPOINTS.DASHBOARD_ANALYTICS}?period=${period}&billingCycle=${cycle}`;

  const res = http.get(url, {
    ...headers,
    tags: { endpoint: 'dashboard_analytics' },
    timeout: '15s',
  });

  check(res, {
    'dashboard returned 200': (r) => r.status === 200,
    'dashboard has valid structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && body.data && body.data.overview !== undefined;
      } catch (_) {
        return false;
      }
    },
    'dashboard circuit breaker not broken (status != 503)': (r) => r.status !== 503,
  });

  sleep(Math.random() * 0.5 + 0.2); // Aggressive pacing for stress test
}
