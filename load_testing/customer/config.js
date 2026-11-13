/**
 * Comprehensive Centralized Configuration for SpotQ Customer Load Tests
 * Covers all customer-facing endpoints across all SpotQ microservices.
 * Configurable via environment variables (e.g. -e BASE_URL=http://... -e TEST_PROFILE=stress)
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:10000';
export const CUSTOMER_EMAIL = __ENV.CUSTOMER_EMAIL || 'customer@spotq.com';
export const CUSTOMER_PASSWORD = __ENV.CUSTOMER_PASSWORD || 'Customer@12345';
export const TEST_PROFILE = __ENV.TEST_PROFILE || 'load'; // smoke | load | stress | spike | soak
export const TEST_TYPE = __ENV.TEST_TYPE || 'all'; // all | journey | auth | discovery | queue | cart | orders | payments

// Safe fallback entity identifiers for standalone or mock testing
export const FALLBACK_RESTAURANT_ID = __ENV.RESTAURANT_ID || '11111111-1111-4111-8111-111111111111';
export const FALLBACK_MENU_ITEM_ID = __ENV.MENU_ITEM_ID || '22222222-2222-4222-8222-222222222222';
export const FALLBACK_CART_ID = __ENV.CART_ID || '33333333-3333-4333-8333-333333333333';
export const FALLBACK_CART_ITEM_ID = __ENV.CART_ITEM_ID || '33333333-3333-4333-8333-333333333334';
export const FALLBACK_ORDER_ID = __ENV.ORDER_ID || '44444444-4444-4444-8444-444444444444';
export const FALLBACK_TRANSACTION_ID = __ENV.TRANSACTION_ID || '55555555-5555-4555-8555-555555555555';

// All Customer-Facing API Gateway Endpoints
export const ENDPOINTS = {
  // 1. Authentication & Account Lifecycle
  LOGIN: `${BASE_URL}/api/v1/auth/users/login`,
  REFRESH_TOKEN: `${BASE_URL}/api/v1/auth/users/refresh-token`,
  LOGOUT: `${BASE_URL}/api/v1/auth/users/logout`,
  REGISTER: `${BASE_URL}/api/v1/auth/users/register`,
  VERIFY_EMAIL: `${BASE_URL}/api/v1/auth/users/verify-email`,
  RESEND_EMAIL_OTP: `${BASE_URL}/api/v1/auth/users/resend-email-otp`,
  FORGOT_PASSWORD: `${BASE_URL}/api/v1/auth/users/forgot-password`,
  FORGOT_PASSWORD_VERIFY: `${BASE_URL}/api/v1/auth/users/forgot-password/verify`,
  FORGOT_PASSWORD_RESEND_OTP: `${BASE_URL}/api/v1/auth/users/forgot-password/resend-otp`,
  RESET_PASSWORD: `${BASE_URL}/api/v1/auth/users/reset-password`,

  // 2. Customer Profile & Devices
  PROFILE: `${BASE_URL}/api/v1/users/profile`,
  ME: `${BASE_URL}/api/v1/users/me`,
  DEVICES: `${BASE_URL}/api/v1/users/me/devices`,
  DEVICE_BY_ID: (deviceId) => `${BASE_URL}/api/v1/users/me/devices/${encodeURIComponent(deviceId)}`,

  // 3. Restaurants Directory & Menu Catalog
  RESTAURANTS_LIST: `${BASE_URL}/api/v1/restaurants/customers`,
  RESTAURANT_DETAILS: (id) => `${BASE_URL}/api/v1/restaurants/customers/${id}`,
  CUSTOMER_MENU_ITEM: (restId, itemId) =>
    `${BASE_URL}/api/v1/restaurants/customers/${restId}/menu/items/${itemId}`,
  MENU_CATEGORIES: (restId) => `${BASE_URL}/api/v1/restaurants/${restId}/menu/categories`,
  MENU_ITEMS: (restId) => `${BASE_URL}/api/v1/restaurants/${restId}/menu/items`,

  // 4. Virtual Queue (Customer Facing)
  ACTIVE_QUEUE: `${BASE_URL}/api/v1/queues/customer/active`,
  GET_ETA: (restId) => `${BASE_URL}/api/v1/queues/customer/${restId}/eta`,
  JOIN_QUEUE: (restId) => `${BASE_URL}/api/v1/queues/customer/restaurants/${restId}/queue/join`,
  QUEUE_STATUS: (restId, queueEntryId) =>
    `${BASE_URL}/api/v1/queues/customer/restaurants/${restId}/queue/status?queueEntryId=${queueEntryId}`,
  LEAVE_QUEUE: (restId) => `${BASE_URL}/api/v1/queues/customer/restaurants/${restId}/queue/leave`,

  // 5. Cart Operations
  CART_BATCH: `${BASE_URL}/api/v1/carts/items/batch`,
  CART_ITEMS: `${BASE_URL}/api/v1/carts/items`,
  CART_BY_ID: (cartId) => `${BASE_URL}/api/v1/carts/${cartId}`,
  CART_ITEM_BY_ID: (cartId, cartItemId) => `${BASE_URL}/api/v1/carts/${cartId}/items/${cartItemId}`,

  // 6. Orders & Checkout
  CHECKOUT: `${BASE_URL}/api/v1/orders/checkout`,
  PLACE_ORDER: `${BASE_URL}/api/v1/orders`,
  ORDERS_HISTORY: `${BASE_URL}/api/v1/orders/history`,
  ORDER_DETAILS: (orderId) => `${BASE_URL}/api/v1/orders/${orderId}`,
  CANCEL_ORDER: (orderId) => `${BASE_URL}/api/v1/orders/${orderId}/cancel`,

  // 7. Payments & Invoices
  PAYMENT_HISTORY: `${BASE_URL}/api/v1/payments/history`,
  VERIFY_PAYMENT: `${BASE_URL}/api/v1/payments/orders/verify`,
  PAYMENT_STATUS: (orderId) => `${BASE_URL}/api/v1/payments/orders/${orderId}/status`,
  PAYMENT_RETRY: (id) => `${BASE_URL}/api/v1/payments/transactions/${id}/retry`,
  PAYMENT_INVOICE: (id) => `${BASE_URL}/api/v1/payments/transactions/${id}/invoice`,
  PAYMENT_REFUND_STATUS: (orderId) => `${BASE_URL}/api/v1/payments/${orderId}/refund-status`,
  PLANS_CATALOG: `${BASE_URL}/api/v1/payments/plans`,

  // 8. Service Health Checks
  HEALTH_USERS: `${BASE_URL}/api/v1/users/health`,
  HEALTH_RESTAURANTS: `${BASE_URL}/api/v1/restaurants/health`,
  HEALTH_QUEUES: `${BASE_URL}/api/v1/queues/health`,
  HEALTH_ORDERS: `${BASE_URL}/api/v1/orders/health`,
  HEALTH_PAYMENTS: `${BASE_URL}/api/v1/payments/health`,
};

// Profile Scenarios (calibrated for SpotQ high-volume diner traffic)
export const PROFILES = {
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '30s',
  },
  load: {
    executor: 'ramping-vus',
    startVUs: 2,
    stages: [
      { duration: '15s', target: 10 },
      { duration: '45s', target: 30 },
      { duration: '30s', target: 50 },
      { duration: '15s', target: 0 },
    ],
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 5,
    stages: [
      { duration: '20s', target: 50 },
      { duration: '45s', target: 120 },
      { duration: '30s', target: 180 },
      { duration: '15s', target: 0 },
    ],
  },
  spike: {
    executor: 'ramping-vus',
    startVUs: 2,
    stages: [
      { duration: '5s', target: 5 },
      { duration: '10s', target: 100 },
      { duration: '30s', target: 100 },
      { duration: '10s', target: 0 },
    ],
  },
  soak: {
    executor: 'constant-vus',
    vus: 20,
    duration: '10m',
  },
};

// Industry Standard Performance Thresholds (SLOs)
export const THRESHOLDS = {
  // Global constraints
  http_req_failed: ['rate<0.05'], // Allow up to 5% failure for high-concurrency race condition scenarios (e.g. queue conflict, cancel already cancelled)
  http_req_duration: ['p(95)<1500'], // Global 95th percentile < 1.5s

  // Auth & Account
  'http_req_duration{endpoint:customer_login}': ['p(95)<400'],
  'http_req_duration{endpoint:customer_refresh_token}': ['p(95)<400'],
  'http_req_duration{endpoint:customer_register}': ['p(95)<600'],
  'http_req_duration{endpoint:customer_resend_email_otp}': ['p(95)<500'],
  'http_req_duration{endpoint:customer_forgot_password}': ['p(95)<500'],
  'http_req_duration{endpoint:customer_profile_get}': ['p(95)<350'],
  'http_req_duration{endpoint:customer_profile_update}': ['p(95)<400'],
  'http_req_duration{endpoint:customer_me}': ['p(95)<350'],
  'http_req_duration{endpoint:customer_devices_get}': ['p(95)<350'],
  'http_req_duration{endpoint:customer_devices_register}': ['p(95)<450'],
  'http_req_duration{endpoint:customer_device_delete}': ['p(95)<400'],

  // Discovery & Menus
  'http_req_duration{endpoint:restaurants_list}': ['p(95)<400', 'p(99)<800'],
  'http_req_duration{endpoint:restaurant_details}': ['p(95)<500', 'p(99)<1000'],
  'http_req_duration{endpoint:customer_menu_item_detail}': ['p(95)<350'],
  'http_req_duration{endpoint:menu_categories_list}': ['p(95)<350'],
  'http_req_duration{endpoint:menu_items_list}': ['p(95)<400'],

  // Virtual Queues
  'http_req_duration{endpoint:queue_active}': ['p(95)<350'],
  'http_req_duration{endpoint:queue_eta}': ['p(95)<500', 'p(99)<1200'],
  'http_req_duration{endpoint:queue_join}': ['p(95)<600', 'p(99)<1500'],
  'http_req_duration{endpoint:queue_status}': ['p(95)<350'],
  'http_req_duration{endpoint:queue_leave}': ['p(95)<500'],

  // Cart Management
  'http_req_duration{endpoint:cart_batch_add}': ['p(95)<600'],
  'http_req_duration{endpoint:cart_single_item_add}': ['p(95)<500'],
  'http_req_duration{endpoint:cart_get_by_id}': ['p(95)<350'],
  'http_req_duration{endpoint:cart_item_update_qty}': ['p(95)<450'],
  'http_req_duration{endpoint:cart_item_delete}': ['p(95)<450'],
  'http_req_duration{endpoint:cart_clear}': ['p(95)<450'],

  // Orders & Checkout
  'http_req_duration{endpoint:orders_checkout}': ['p(95)<700', 'p(99)<1500'],
  'http_req_duration{endpoint:orders_place}': ['p(95)<1200', 'p(99)<2500'],
  'http_req_duration{endpoint:orders_history}': ['p(95)<450'],
  'http_req_duration{endpoint:order_details}': ['p(95)<400'],
  'http_req_duration{endpoint:orders_cancel}': ['p(95)<600'],

  // Payments & Invoices
  'http_req_duration{endpoint:payment_history}': ['p(95)<500'],
  'http_req_duration{endpoint:payment_order_status}': ['p(95)<400'],
  'http_req_duration{endpoint:payment_verify}': ['p(95)<600'],
  'http_req_duration{endpoint:payment_retry}': ['p(95)<600'],
  'http_req_duration{endpoint:payment_invoice}': ['p(95)<600'],
  'http_req_duration{endpoint:payment_refund_status}': ['p(95)<450'],
  'http_req_duration{endpoint:payment_plans_catalog}': ['p(95)<350'],

  // Health Checks
  'http_req_duration{endpoint:health_users}': ['p(95)<200'],
  'http_req_duration{endpoint:health_restaurants}': ['p(95)<200'],
  'http_req_duration{endpoint:health_queues}': ['p(95)<200'],
  'http_req_duration{endpoint:health_orders}': ['p(95)<200'],
  'http_req_duration{endpoint:health_payments}': ['p(95)<200'],
};
