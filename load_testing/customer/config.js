/**
 * Centralized Configuration for SpotQ Customer Load Tests (Industry Standard)
 * Focuses strictly on the must-tested, mission-critical Core Dining Funnel:
 * Discovery -> Menu -> Virtual Queue -> Cart Sync -> Checkout -> Order Placement -> Payment Verification
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:10000';
export const CUSTOMER_EMAIL = __ENV.CUSTOMER_EMAIL || 'customer@spotq.com';
export const CUSTOMER_PASSWORD = __ENV.CUSTOMER_PASSWORD || 'Customer@12345';
export const CUSTOMER_TOKEN = __ENV.CUSTOMER_TOKEN || null;
export const RAZORPAY_KEY_SECRET = __ENV.RAZORPAY_KEY_SECRET || '';
export const TEST_PROFILE = __ENV.TEST_PROFILE || 'min100'; // min100 | constant100 | stress | smoke
export const TEST_TYPE = __ENV.TEST_TYPE || 'core_funnel'; // core_funnel | queue | orders | discovery

// Primary Target Entities (Target Restaurant: 5dc5f92c-03b9-4eb1-85f5-88bf4159f0c8)
export const TARGET_RESTAURANT_ID = __ENV.RESTAURANT_ID || '5dc5f92c-03b9-4eb1-85f5-88bf4159f0c8';
export const FALLBACK_RESTAURANT_ID = TARGET_RESTAURANT_ID;
export const FALLBACK_MENU_ITEM_ID = __ENV.MENU_ITEM_ID || 'f2c3ea28-12ff-424c-9bf2-e567f65d34cd';

// Must-Tested Mission-Critical Customer API Endpoints
export const ENDPOINTS = {
  // 1. Session & Authentication Setup
  LOGIN: `${BASE_URL}/api/v1/auth/users/login`,
  REGISTER: `${BASE_URL}/api/v1/auth/users/register`,

  // 2. Restaurant Discovery & Menu Catalog (High-Throughput Read)
  RESTAURANTS_LIST: `${BASE_URL}/api/v1/restaurants/customers`,
  RESTAURANT_DETAILS: (id) => `${BASE_URL}/api/v1/restaurants/customers/${id}`,
  CUSTOMER_MENU_ITEM: (restId, itemId) =>
    `${BASE_URL}/api/v1/restaurants/customers/${restId}/menu/items/${itemId}`,

  // 3. Virtual Queue (High-Concurrency Contention & Race-Condition Bottleneck)
  ACTIVE_QUEUE: `${BASE_URL}/api/v1/queues/customer/active`,
  GET_ETA: (restId) => `${BASE_URL}/api/v1/queues/customer/${restId}/eta`,
  JOIN_QUEUE: (restId) => `${BASE_URL}/api/v1/queues/customer/restaurants/${restId}/queue/join`,
  QUEUE_STATUS: (restId, queueEntryId) =>
    `${BASE_URL}/api/v1/queues/customer/restaurants/${restId}/queue/status?queueEntryId=${queueEntryId}`,
  LEAVE_QUEUE: (restId) => `${BASE_URL}/api/v1/queues/customer/restaurants/${restId}/queue/leave`,

  // 4. Cart Operations (Redis Distributed State)
  CART_BATCH: `${BASE_URL}/api/v1/carts/items/batch`,
  CART_BY_ID: (cartId) => `${BASE_URL}/api/v1/carts/${cartId}`,

  // 5. Checkout & Order Placement (Direct Revenue & ACID DB Transactions)
  CHECKOUT: `${BASE_URL}/api/v1/orders/checkout`,
  PLACE_ORDER: `${BASE_URL}/api/v1/orders`,
  ORDER_DETAILS: (orderId) => `${BASE_URL}/api/v1/orders/${orderId}`,
  ORDERS_HISTORY: `${BASE_URL}/api/v1/orders/history`,

  // 6. Payments & Invoicing (Direct Server-to-Server Verification)
  VERIFY_PAYMENT: `${BASE_URL}/api/v1/payments/orders/verify`,
  PAYMENT_STATUS: (orderId) => `${BASE_URL}/api/v1/payments/orders/${orderId}/status`,
  PAYMENT_HISTORY: `${BASE_URL}/api/v1/payments/history`,
};

// Calibrated Industry Standard Load Testing Profiles (Min 100 VUs benchmark)
export const PROFILES = {
  // Quick pre-flight validation
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '30s',
  },
  // Constant flat 100 Virtual Users benchmark
  constant100: {
    executor: 'constant-vus',
    vus: 100,
    duration: '2m',
  },
  // Minimum 100 Virtual Users profile ramping to 150 peak
  min100: {
    executor: 'ramping-vus',
    startVUs: 100,
    stages: [
      { duration: '30s', target: 100 }, // Sustain 100 concurrent customers
      { duration: '1m', target: 150 },  // Scale to 150 peak customers
      { duration: '30s', target: 100 }, // Settle back to 100 customers
      { duration: '15s', target: 0 },   // Graceful wind-down
    ],
  },
  // Stress profile pushing through 100 -> 150 -> 200 VUs to determine breaking point
  stress: {
    executor: 'ramping-vus',
    startVUs: 100,
    stages: [
      { duration: '20s', target: 100 },
      { duration: '45s', target: 150 },
      { duration: '30s', target: 200 },
      { duration: '15s', target: 0 },
    ],
  },
};

// Industry Standard Service Level Objectives (SLOs)
export const THRESHOLDS = {
  // Global constraints
  http_req_failed: ['rate<0.05'], // Max 5% failure tolerance for high-concurrency contention (e.g. queue duplicate join)
  http_req_duration: ['p(95)<1500'], // Global 95th percentile < 1.5s

  // Discovery & Menus
  'http_req_duration{endpoint:restaurants_list}': ['p(95)<800', 'p(99)<1500'],
  'http_req_duration{endpoint:restaurant_details}': ['p(95)<800', 'p(99)<1500'],

  // Virtual Queues
  'http_req_duration{endpoint:queue_active}': ['p(95)<500'],
  'http_req_duration{endpoint:queue_eta}': ['p(95)<800', 'p(99)<1500'],
  'http_req_duration{endpoint:queue_join}': ['p(95)<800', 'p(99)<1500'],
  'http_req_duration{endpoint:queue_status}': ['p(95)<500'],
  'http_req_duration{endpoint:queue_leave}': ['p(95)<600'],

  // Cart Management
  'http_req_duration{endpoint:cart_batch}': ['p(95)<800'],
  'http_req_duration{endpoint:cart_get}': ['p(95)<500'],

  // Orders & Checkout
  'http_req_duration{endpoint:orders_checkout}': ['p(95)<900', 'p(99)<1800'],
  'http_req_duration{endpoint:place_order}': ['p(95)<1500', 'p(99)<3000'],
  'http_req_duration{endpoint:order_details}': ['p(95)<600'],
  'http_req_duration{endpoint:orders_history}': ['p(95)<600'],

  // Payments
  'http_req_duration{endpoint:payment_verify}': ['p(95)<800'],
  'http_req_duration{endpoint:payment_status}': ['p(95)<600'],
  'http_req_duration{endpoint:payment_history}': ['p(95)<600'],
};
