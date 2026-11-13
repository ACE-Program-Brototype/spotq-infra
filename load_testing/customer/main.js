import http from 'k6/http';
import {
  PROFILES,
  THRESHOLDS,
  TEST_PROFILE,
  TEST_TYPE,
  ENDPOINTS,
  FALLBACK_RESTAURANT_ID,
  FALLBACK_MENU_ITEM_ID,
} from './config.js';
import { loginCustomer, registerTestCustomer, getAuthHeaders } from './helpers/auth.js';
import { generateHtmlReport } from './helpers/summary-reporter.js';
import { runAuthProfileSuite } from './tests/auth_profile_suite.js';
import { runDiscoveryMenuSuite } from './tests/discovery_menu_suite.js';
import { runQueueSuite } from './tests/queue_suite.js';
import { runCartSuite } from './tests/cart_suite.js';
import { runOrdersSuite } from './tests/orders_suite.js';
import { runPaymentsSuite } from './tests/payments_suite.js';
import { runHealthSuite } from './tests/health_suite.js';
import { runCustomerJourney } from './tests/customer_journey.js';

// Configure expected application statuses (including client rejections like 400, 401, 403, 404, 409)
// so http_req_failed strictly tracks server errors (5xx) and connection timeouts
try {
  http.setResponseCallback(http.expectedStatuses(200, 201, 204, 400, 401, 403, 404, 409));
} catch (_) {}

// Select active scenario profile (smoke, load, stress, spike, soak)
const activeProfile = PROFILES[TEST_PROFILE] || PROFILES.load;
const testType = __ENV.TEST_TYPE || TEST_TYPE || 'all'; // all | journey | auth | discovery | queue | cart | orders | payments

export const options = {
  scenarios: {
    customer_load_scenario: activeProfile,
  },
  thresholds: THRESHOLDS,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

/**
 * Global Setup: Executes once before all Virtual Users are launched.
 * 1. Authenticates customer and obtains JWT access token.
 * 2. Dynamically queries live restaurants and menu items to seed realistic IDs.
 */
export function setup() {
  console.log('====================================================');
  console.log(`Starting SpotQ Comprehensive Customer API Load Test`);
  console.log(`Profile: [${TEST_PROFILE}] | Target Suite: [${testType}]`);
  console.log('====================================================');

  let authResult = loginCustomer();

  // If customer account not found, attempt registration
  if (!authResult) {
    console.log('Attempting automatic test customer registration...');
    registerTestCustomer();
    authResult = loginCustomer();
  }

  const token = authResult ? authResult.token : null;
  if (!token) {
    console.warn(
      'Notice: Could not acquire Customer JWT token in setup. Protected endpoints may return 401. Public discovery endpoints will proceed.'
    );
  }

  // Dynamic discovery of real live restaurant and menu item IDs
  let restaurantId = FALLBACK_RESTAURANT_ID;
  let menuItemId = FALLBACK_MENU_ITEM_ID;

  try {
    const headers = getAuthHeaders(token);
    const discoveryRes = http.get(`${ENDPOINTS.RESTAURANTS_LIST}?page=1&limit=5`, {
      ...headers,
      tags: { endpoint: 'setup_discovery' },
      timeout: '8s',
    });

    if (discoveryRes.status === 200) {
      const body = JSON.parse(discoveryRes.body);
      const restaurants = Array.isArray(body.data) ? body.data : (body.data?.restaurants || []);
      if (restaurants.length > 0 && restaurants[0].id) {
        restaurantId = restaurants[0].id;
        console.log(`Discovered active restaurant: [${restaurantId}] (${restaurants[0].restaurantName || 'Unknown'})`);

        // Discover menu items for this restaurant
        const menuRes = http.get(`${ENDPOINTS.RESTAURANT_DETAILS(restaurantId)}?includeMenu=true`, {
          ...headers,
          tags: { endpoint: 'setup_menu' },
          timeout: '8s',
        });

        if (menuRes.status === 200) {
          const menuBody = JSON.parse(menuRes.body);
          const menuData = menuBody.data || {};
          const items =
            menuData.menuItems ||
            menuData.items ||
            (menuData.categories && menuData.categories[0]?.menuItems) ||
            [];

          if (items.length > 0 && items[0].id) {
            menuItemId = items[0].id;
            console.log(`Discovered active menu item: [${menuItemId}] (${items[0].name || 'Dish'})`);
          }
        }
      }
    }
  } catch (err) {
    console.warn(`Dynamic entity discovery encountered: ${err.message}. Using fallback IDs.`);
  }

  return {
    token,
    seedData: {
      restaurantId,
      menuItemId,
    },
  };
}

/**
 * Main VU Loop: Executed repeatedly by every active Virtual User.
 * Tests ALL customer APIs when testType='all' or targets specific domains.
 */
export default function (data) {
  const token = data.token;
  const seedData = data.seedData || {};

  switch (testType) {
    case 'auth':
      runAuthProfileSuite(token);
      break;

    case 'discovery':
      runDiscoveryMenuSuite(token, seedData);
      break;

    case 'queue':
      runQueueSuite(token, seedData);
      break;

    case 'cart':
      runCartSuite(token, seedData);
      break;

    case 'orders':
      runOrdersSuite(token, seedData);
      break;

    case 'payments':
      runPaymentsSuite(token);
      break;

    case 'journey':
      runCustomerJourney(token, seedData);
      break;

    case 'all':
    default:
      // Exhaustive test of all 46 customer APIs across the platform
      runHealthSuite();
      runAuthProfileSuite(token);
      runDiscoveryMenuSuite(token, seedData);
      runQueueSuite(token, seedData);
      runCartSuite(token, seedData);
      runOrdersSuite(token, seedData);
      runPaymentsSuite(token);
      break;
  }
}

/**
 * Global Teardown: Executes once after all VUs terminate.
 */
export function teardown(data) {
  console.log('====================================================');
  console.log('SpotQ Customer Load Test execution completed.');
  console.log('====================================================');
}

/**
 * Generates structured HTML and JSON reports upon completion.
 */
export function handleSummary(data) {
  return {
    'load-test-report.html': generateHtmlReport(data),
    'load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

// Plain-text console summary formatter
function textSummary(data) {
  const httpReqs = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
  const p95 = data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'].toFixed(2) : 0;
  const failRate = data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : 0;

  return `
--------------------------------------------------------------------------------
SpotQ Customer API Comprehensive Load Test Results
--------------------------------------------------------------------------------
Total Requests:     ${httpReqs}
Global p95 Latency: ${p95} ms
Failure Rate:       ${failRate} %
HTML Dashboard:     load-test-report.html
JSON Summary:       load-test-summary.json
--------------------------------------------------------------------------------
`;
}
