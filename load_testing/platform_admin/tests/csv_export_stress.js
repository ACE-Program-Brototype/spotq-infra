import http from 'k6/http';
import { check, sleep } from 'k6';
import { ENDPOINTS } from '../config.js';
import { getAuthHeaders } from '../helpers/auth.js';
import { diagnoseResponse } from '../helpers/request-diagnostics.js';

/**
 * Dedicated Stress Test on Master Financial Ledger CSV Export
 * Target: GET /api/v1/payments/admin/finance/ledger/export.csv
 * Tests V8 heap memory usage, buffer allocation, and streaming resilience under concurrency.
 */
export function runCsvExportStress(token) {
  const headers = getAuthHeaders(token, {
    Accept: 'text/csv, application/json',
  });

  const res = http.get(ENDPOINTS.FINANCE_EXPORT_CSV, {
    ...headers,
    tags: { endpoint: 'finance_export_csv' },
    timeout: '30s', // Export queries may take longer under heavy concurrent table scans
  });
  diagnoseResponse('finance_export_csv', res);

  check(res, {
    'csv export returned 200': (r) => r.status === 200,
    'content-type header contains text/csv': (r) => {
      const ct = r.headers['Content-Type'] || r.headers['content-type'] || '';
      return ct.includes('text/csv');
    },
    'csv body has valid size (> 0 bytes)': (r) => r.body && r.body.length > 0,
  });

  sleep(Math.random() * 2 + 1); // Pacing between large file downloads
}
