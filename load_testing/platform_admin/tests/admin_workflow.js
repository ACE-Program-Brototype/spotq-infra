import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { ENDPOINTS } from '../config.js';
import { getAuthHeaders } from '../helpers/auth.js';
import { diagnoseResponse } from '../helpers/request-diagnostics.js';

/**
 * Simulates a realistic Platform Administrator session journey across SpotQ.
 * Mimics human pacing and realistic navigation flows.
 */
export function runAdminWorkflow(token) {
  const headers = getAuthHeaders(token);

  group('01_Platform_Executive_Dashboard', () => {
    // 1. Load consolidated analytics dashboard (fan-out across payment & user services)
    const url = `${ENDPOINTS.DASHBOARD_ANALYTICS}?period=MONTH&billingCycle=ALL`;
    const res = http.get(url, {
      ...headers,
      tags: { endpoint: 'dashboard_analytics' },
    });
    diagnoseResponse('dashboard_analytics', res);

    check(res, {
      'dashboard analytics returned 200': (r) => r.status === 200,
      'dashboard payload has overview': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && body.data !== undefined;
        } catch (_) {
          return false;
        }
      },
    });

    sleep(Math.random() * 2 + 1); // 1-3s human think time
  });

  group('02_Platform_Finance_Management', () => {
    // 2. Load financial summary metrics
    const summaryRes = http.get(ENDPOINTS.FINANCE_SUMMARY, {
      ...headers,
      tags: { endpoint: 'finance_summary' },
    });
    diagnoseResponse('finance_summary', summaryRes);

    check(summaryRes, {
      'finance summary returned 200': (r) => r.status === 200,
    });
    sleep(0.5);

    // 3. Browse financial master ledger entries with pagination
    const ledgerUrl = `${ENDPOINTS.FINANCE_LEDGER}?page=1&limit=10`;
    const ledgerRes = http.get(ledgerUrl, {
      ...headers,
      tags: { endpoint: 'finance_ledger' },
    });
    diagnoseResponse('finance_ledger', ledgerRes);

    check(ledgerRes, {
      'finance ledger returned 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);
  });

  group('03_Global_Orders_Monitor', () => {
    // 4. Query system-wide orders with sorting and status filters
    const orderStatuses = ['', 'PLACED', 'CONFIRMED', 'COMPLETED'];
    const randomStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    let ordersUrl = `${ENDPOINTS.ORDERS_LIST}?page=1&limit=25&sortBy=createdAt&sortOrder=desc`;
    if (randomStatus) {
      ordersUrl += `&status=${randomStatus}`;
    }

    const ordersRes = http.get(ordersUrl, {
      ...headers,
      tags: { endpoint: 'orders_list' },
    });
    diagnoseResponse('orders_list', ordersRes);

    check(ordersRes, {
      'orders list returned 200': (r) => r.status === 200,
      'orders list has pagination': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && Array.isArray(body.data.orders);
        } catch (_) {
          return false;
        }
      },
    });
    sleep(Math.random() * 2 + 1);
  });

  group('04_SaaS_Subscribers_Inspection', () => {
    // 5. Inspect restaurant subscription accounts (triggers inter-service batch resolution)
    const subscribersUrl = `${ENDPOINTS.SUBSCRIBERS_LIST}?page=1&limit=10&sortBy=createdAt&sortOrder=desc`;
    const subsRes = http.get(subscribersUrl, {
      ...headers,
      tags: { endpoint: 'subscribers_list' },
    });
    diagnoseResponse('subscribers_list', subsRes);

    check(subsRes, {
      'subscribers list returned 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 1.5 + 0.5);
  });

  group('05_Directories_Directory_Search', () => {
    // 6. View registered restaurants directory
    const restUrl = `${ENDPOINTS.RESTAURANTS_LIST}?page=1&limit=10`;
    const restRes = http.get(restUrl, {
      ...headers,
      tags: { endpoint: 'restaurants_list' },
    });
    diagnoseResponse('restaurants_list', restRes);

    check(restRes, {
      'restaurants directory returned 200': (r) => r.status === 200,
    });

    sleep(0.5);

    // 7. Query customer users directory
    const custUrl = `${ENDPOINTS.CUSTOMERS_LIST}?page=1&limit=20`;
    const custRes = http.get(custUrl, {
      ...headers,
      tags: { endpoint: 'customers_list' },
    });
    diagnoseResponse('customers_list', custRes);

    check(custRes, {
      'customers directory returned 200': (r) => r.status === 200,
    });

    sleep(Math.random() * 2 + 1);
  });
}
