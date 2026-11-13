import http from 'k6/http';
import { check } from 'k6';
import { ENDPOINTS, CUSTOMER_EMAIL, CUSTOMER_PASSWORD } from '../config.js';

/**
 * Authenticates as a Customer and returns the JWT Bearer access token and user info.
 * Typically invoked once in k6 setup() to eliminate repetitive authentication overhead during load runs.
 */
export function loginCustomer(email = CUSTOMER_EMAIL, password = CUSTOMER_PASSWORD) {
  const payload = JSON.stringify({
    email,
    password,
    device: {
      deviceName: 'k6-load-runner',
      platform: 'WEB',
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    tags: { endpoint: 'customer_login' },
    timeout: '10s',
  };

  const response = http.post(ENDPOINTS.LOGIN, payload, params);

  const isSuccess = check(response, {
    'customer login status is 200': (r) => r.status === 200,
    'customer login returned access_token': (r) => {
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
    console.warn(`Customer login failed for ${email}! HTTP ${response.status}: ${response.body}`);
    // If login failed, return null so setup can attempt registration or fallback
    return null;
  }

  const json = JSON.parse(response.body);
  const token = json.data.access_token || json.data.accessToken;
  const user = json.data.user || {};

  return { token, user };
}

/**
 * Quick helper to register a synthetic customer during setup if primary account is missing
 */
export function registerTestCustomer(email = CUSTOMER_EMAIL, password = CUSTOMER_PASSWORD) {
  const payload = JSON.stringify({
    fullName: 'Test Load Customer',
    email,
    phoneNumber: '+919876543210',
    password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    tags: { endpoint: 'customer_register' },
    timeout: '10s',
  };

  const response = http.post(ENDPOINTS.REGISTER, payload, params);
  return response.status === 200 || response.status === 201;
}

/**
 * Generates standardized headers with Bearer token authentication
 */
export function getAuthHeaders(token, extraHeaders = {}) {
  const baseHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  return {
    headers: Object.assign(baseHeaders, extraHeaders),
  };
}

/**
 * Lightweight UUID v4 generator for k6 execution environments
 */
export function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
