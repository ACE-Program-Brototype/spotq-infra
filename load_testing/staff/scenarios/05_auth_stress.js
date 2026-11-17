import http from 'k6/http';
import { check, sleep } from 'k6';
import { ENV, API_ENDPOINTS } from '../config/environments.js';
import { buildHeaders } from '../lib/headers.js';
import { DEFAULT_THRESHOLDS } from '../config/thresholds.js';

const credentialsConfig = JSON.parse(open('../data/staff-credentials.json'));

/**
 * Auth Stress Options:
 * Note: Keep concurrency low or configure RATE_LIMIT_LOGIN_MAX_ATTEMPTS in spotq-restaurant-service
 * because Redis rate limits login attempts by email:ip (default 5 attempts / 15 mins).
 */
export const options = {
  stages: [
    { duration: '30s', target: 5 },  // 5 concurrent logins
    { duration: '1m', target: 10 },  // 10 concurrent logins
    { duration: '15s', target: 0 },
  ],
  thresholds: DEFAULT_THRESHOLDS,
};

export default function () {
  const staffList = credentialsConfig.staff || [];
  if (staffList.length === 0) {
    throw new Error('Please configure at least one staff account in data/staff-credentials.json');
  }

  // Select staff account round-robin
  const cred = staffList[(__VU - 1) % staffList.length];
  const url = `${ENV.BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`;
  const payload = JSON.stringify({
    email: cred.email,
    password: cred.password,
    restaurantId: credentialsConfig.restaurantId,
  });

  const res = http.post(url, payload, { headers: buildHeaders() });

  check(res, {
    'Login returns 200 (Success)': (r) => r.status === 200,
    'Login is rate limited 429 (Expected if threshold exceeded)': (r) => r.status === 429 || r.status === 200,
  });

  sleep(2);
}

