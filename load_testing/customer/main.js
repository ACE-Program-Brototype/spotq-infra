import http from 'k6/http';
import {
  PROFILES,
  THRESHOLDS,
  TEST_PROFILE,
  TEST_TYPE,
  ENDPOINTS,
  TARGET_RESTAURANT_ID,
  FALLBACK_MENU_ITEM_ID,
  CUSTOMER_TOKEN,
} from './config.js';
import { loginCustomer, registerTestCustomer, getAuthHeaders } from './helpers/auth.js';
import { generateHtmlReport } from './helpers/summary-reporter.js';

// Must-tested suite runners
import { runCustomerJourney } from './tests/customer_journey.js';
import { runDiscoveryStress } from './tests/discovery_stress.js';
import { runQueueStress } from './tests/queue_stress.js';
import { runOrdersCartStress } from './tests/orders_cart_stress.js';

// Configure expected application statuses (including client rejections like 400, 401, 403, 404, 409)
// so http_req_failed strictly tracks server errors (5xx) and connection drops
try {
  http.setResponseCallback(http.expectedStatuses(200, 201, 204, 400, 401, 403, 404, 409));
} catch (_) {}

// Select active scenario profile (min100 | constant100 | stress | smoke)
const activeProfile = PROFILES[TEST_PROFILE] || PROFILES.min100;
const testType = __ENV.TEST_TYPE || TEST_TYPE || 'core_funnel'; // core_funnel | queue | orders | discovery

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
  console.log(`Starting SpotQ Core Customer Funnel Load Test`);
  console.log(`Target Restaurant: [${TARGET_RESTAURANT_ID}]`);
  console.log(`Profile: [${TEST_PROFILE}] | Mode: [${testType}]`);
  console.log('====================================================');

  let token = CUSTOMER_TOKEN;

  if (!token) {
    let authResult = loginCustomer();

    // If customer account not found, attempt registration
    if (!authResult) {
      console.log('Attempting automatic test customer registration...');
      registerTestCustomer();
      authResult = loginCustomer();
    }

    token = authResult ? authResult.token : null;
  }

  // Enforce mandatory access token: All Customer APIs require valid authentication
  if (!token) {
    throw new Error(
      'FATAL: Could not obtain a valid Customer accessToken. All Customer APIs require authentication. Please verify CUSTOMER_EMAIL/CUSTOMER_PASSWORD or pass -e CUSTOMER_TOKEN="<jwt>".'
    );
  }

  console.log('Successfully authenticated customer with valid accessToken.');

  // Target specific restaurant: 5dc5f92c-03b9-4eb1-85f5-88bf4159f0c8
  let restaurantId = TARGET_RESTAURANT_ID;
  let menuItemId = FALLBACK_MENU_ITEM_ID;

  try {
    const headers = getAuthHeaders(token);
    // Discover active menu items specifically for this target restaurant
    const menuRes = http.get(`${ENDPOINTS.RESTAURANT_DETAILS(restaurantId)}?includeMenu=true`, {
      ...headers,
      tags: { endpoint: 'setup_menu' },
      timeout: '8s',
    });

    if (menuRes.status === 200) {
      const menuBody = JSON.parse(menuRes.body);
      const menuData = menuBody.data || {};
      let items = [];
      if (Array.isArray(menuData.menu)) {
        for (const cat of menuData.menu) {
          if (Array.isArray(cat.items) && cat.items.length > 0) {
            items.push(...cat.items);
          }
        }
      }
      if (items.length === 0) {
        items =
          menuData.menuItems ||
          menuData.items ||
          (menuData.categories && menuData.categories[0]?.menuItems) ||
          [];
      }

      if (items.length > 0 && items[0].id) {
        menuItemId = items[0].id;
        console.log(`Active target restaurant [${restaurantId}] loaded with menu item [${menuItemId}]`);
      } else {
        console.log(`Target restaurant [${restaurantId}] confirmed active with fallback item [${menuItemId}].`);
      }
    } else {
      console.warn(`Target restaurant profile check responded with HTTP ${menuRes.status}. Using ID directly.`);
    }
  } catch (err) {
    console.warn(`Entity check for ${restaurantId}: ${err.message}.`);
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
 */
export default function (data) {
  const token = data.token;
  const seedData = data.seedData || {};

  switch (testType) {
    case 'queue':
      runQueueStress(token, seedData);
      break;

    case 'orders':
      runOrdersCartStress(token, seedData);
      break;

    case 'discovery':
      runDiscoveryStress(token, seedData);
      break;

    case 'core_funnel':
    case 'journey':
    default:
      // Industry Standard: Discovery -> Virtual Queue -> Cart Sync -> Checkout -> Order -> Payment
      runCustomerJourney(token, seedData);
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
SpotQ Customer API Mission-Critical Load Test Results
--------------------------------------------------------------------------------
Total Requests:     ${httpReqs}
Global p95 Latency: ${p95} ms
Failure Rate:       ${failRate} %
HTML Dashboard:     load-test-report.html
JSON Summary:       load-test-summary.json
--------------------------------------------------------------------------------
`;
}
