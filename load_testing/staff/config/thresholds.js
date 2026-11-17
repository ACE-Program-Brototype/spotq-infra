/**
 * Performance Thresholds (SLAs) for SpotQ Staff APIs.
 * If any metric exceeds these thresholds, k6 will exit with a non-zero code.
 */
export const DEFAULT_THRESHOLDS = {
  // 95% of all requests must complete within 400ms; 99% within 800ms
  http_req_duration: ['p(95)<400', 'p(99)<800'],

  // Total HTTP error rate must be below 1%
  http_req_failed: ['rate<0.01'],
};

/**
 * Granular thresholds for specific critical actions
 */
export const GRANULAR_THRESHOLDS = {
  ...DEFAULT_THRESHOLDS,
  'live_queue_fetch_duration': ['p(95)<300'],
  'table_status_update_duration': ['p(95)<350'],
  'order_status_update_duration': ['p(95)<400'],
};

