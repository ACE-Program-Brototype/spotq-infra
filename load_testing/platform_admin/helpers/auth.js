import http from 'k6/http';
import { check } from 'k6';
import { ENDPOINTS, ADMIN_EMAIL, ADMIN_PASSWORD } from '../config.js';

/**
 * Authenticates as Platform Admin and returns the JWT Bearer access token.
 * Typically invoked in k6 setup() to avoid skewing test runs with constant authentication overhead.
 */
export function loginAdmin(email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  const payload = JSON.stringify({
    email,
    password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    tags: { endpoint: 'admin_login' },
    timeout: '10s',
  };

  const response = http.post(ENDPOINTS.LOGIN, payload, params);

  const isSuccess = check(response, {
    'admin login status is 200': (r) => r.status === 200,
    'admin login returned access_token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (
          body &&
          body.data &&
          (typeof body.data.access_token === 'string' || typeof body.data.accessToken === 'string')
        );
      } catch (_) {
        return false;
      }
    },
  });

  if (!isSuccess) {
    console.error(`Admin login failed! HTTP ${response.status}: ${response.body}`);
    throw new Error(`Platform Admin login failed with status ${response.status}`);
  }

  const json = JSON.parse(response.body);
  const token = json.data.access_token || json.data.accessToken;
  return token;
}

/**
 * Generates standardized headers with Bearer token authentication
 */
export function getAuthHeaders(token, extraHeaders = {}) {
  return {
    headers: Object.assign(
      {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      extraHeaders
    ),
  };
}
