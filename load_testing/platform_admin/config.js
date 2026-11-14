/**
 * Centralized Configuration for SpotQ Platform Admin Load Tests
 * Configurable via environment variables (e.g. -e BASE_URL=http://... -e TEST_PROFILE=stress)
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:10000';
export const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@spotq.com';
export const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin@12345';
export const TEST_PROFILE = __ENV.TEST_PROFILE || 'load'; // smoke | load | stress | spike | soak

// API Gateway Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: `${BASE_URL}/api/v1/auth/admin/login`,
  REFRESH_TOKEN: `${BASE_URL}/api/v1/auth/admin/refresh`,

  // Analytics & Dashboard (Fan-Out Aggregator)
  DASHBOARD_ANALYTICS: `${BASE_URL}/api/v1/restaurants/admin/analytics/dashboard`,

  // Platform Finance & Master Ledger
  FINANCE_SUMMARY: `${BASE_URL}/api/v1/payments/admin/finance/summary`,
  FINANCE_LEDGER: `${BASE_URL}/api/v1/payments/admin/finance/ledger`,
  // FINANCE_EXPORT_CSV: `${BASE_URL}/api/v1/payments/admin/finance/ledger/export.csv`, // Temporarily disabled

  // Global Orders Monitor
  ORDERS_LIST: `${BASE_URL}/api/v1/orders/admin`,

  // SaaS Subscribers Management
  SUBSCRIBERS_LIST: `${BASE_URL}/api/v1/subscribers`,

  // Restaurants Directory & Applications
  RESTAURANTS_LIST: `${BASE_URL}/api/v1/restaurants/admin/restaurants`,
  RESTAURANTS_APPLICATIONS: `${BASE_URL}/api/v1/restaurants/admin/restaurants/applications`,

  // Customers Directory
  CUSTOMERS_LIST: `${BASE_URL}/api/v1/users`,
};

// Profile Scenarios (calibrated for SpotQ single/small-team platform admin reality)
export const PROFILES = {
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '30s',
  },
  load: {
    executor: 'ramping-vus',
    startVUs: 1,
    stages: [
      { duration: '15s', target: 2 }, // 1 admin with multiple tabs
      { duration: '45s', target: 3 }, // Active navigation, filtering & dashboard queries
      { duration: '15s', target: 0 }, // Graceful wind down
    ],
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 1,
    stages: [
      { duration: '15s', target: 10 },
      { duration: '45s', target: 30 }, // Peak concurrency for stress testing
      { duration: '15s', target: 0 },
    ],
  },
  spike: {
    executor: 'ramping-vus',
    startVUs: 1,
    stages: [
      { duration: '5s', target: 1 },
      { duration: '10s', target: 6 }, // Sudden burst of concurrent actions
      { duration: '30s', target: 6 },
      { duration: '10s', target: 0 },
    ],
  },
  soak: {
    executor: 'constant-vus',
    vus: 2, // 1-2 steady continuous admin sessions
    duration: '10m', // Memory leak & GC thrashing detection
  },
};

// Industry Standard Performance Thresholds (SLOs)
// Calibrated using SRE empirical baseline + load factor formula for multi-service Docker
export const THRESHOLDS = {
  // Global constraints
  http_req_failed: ['rate<0.01'], // Global HTTP failure rate < 1%
  http_req_duration: ['p(95)<1500'], // Global 95th percentile < 1.5s

  // Specific Endpoint SLOs
  'http_req_duration{endpoint:admin_login}': ['p(95)<400'],
  'http_req_duration{endpoint:dashboard_analytics}': ['p(95)<1300', 'p(99)<2000'],
  'http_req_duration{endpoint:finance_summary}': ['p(95)<600'],
  'http_req_duration{endpoint:finance_ledger}': ['p(95)<700'],
  // 'http_req_duration{endpoint:finance_export_csv}': ['p(95)<3000'], // Temporarily disabled
  'http_req_duration{endpoint:orders_list}': ['p(95)<1200', 'p(99)<1800'],
  'http_req_duration{endpoint:subscribers_list}': ['p(95)<800'],
  'http_req_duration{endpoint:restaurants_list}': ['p(95)<400'],
  'http_req_duration{endpoint:customers_list}': ['p(95)<700'],
};
