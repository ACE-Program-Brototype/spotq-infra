import { PROFILES, THRESHOLDS, TEST_PROFILE } from './config.js';
import { loginAdmin } from './helpers/auth.js';
import { generateHtmlReport } from './helpers/summary-reporter.js';
import { getRecordedResponses } from './helpers/response-recorder.js';
import { runAdminWorkflow } from './tests/admin_workflow.js';
import { runDashboardStress } from './tests/dashboard_stress.js';
// import { runCsvExportStress } from './tests/csv_export_stress.js'; // Temporarily disabled
import { runOrdersSearchStress } from './tests/orders_search_stress.js';

// Select active scenario profile (smoke, load, stress, spike, soak)
const activeProfile = PROFILES[TEST_PROFILE] || PROFILES.load;
const testType = __ENV.TEST_TYPE || 'workflow'; // workflow | dashboard | export | orders | all

export const options = {
  scenarios: {
    admin_load_scenario: activeProfile,
  },
  thresholds: THRESHOLDS,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

/**
 * Global Setup: Runs once before all Virtual Users are launched.
 * Authenticates as Platform Admin and passes the JWT token to all VUs.
 */
export function setup() {
  console.log('====================================================');
  console.log(`Starting SpotQ Platform Admin Load Test`);
  console.log(`Profile: [${TEST_PROFILE}] | Target Suite: [${testType}]`);
  console.log('====================================================');

  const token = loginAdmin();
  if (!token) {
    throw new Error('Failed to obtain Platform Admin access token in setup stage.');
  }

  return { token };
}

/**
 * Main VU Loop: Executed repeatedly by every active Virtual User.
 */
export default function (data) {
  const token = data.token;

  switch (testType) {
    case 'dashboard':
      runDashboardStress(token);
      break;
    // case 'export':
    //   runCsvExportStress(token);
    //   break;
    case 'orders':
      runOrdersSearchStress(token);
      break;
    case 'all':
      // Executes workflow alongside dedicated high-pressure endpoints
      runAdminWorkflow(token);
      runDashboardStress(token);
      break;
    case 'workflow':
    default:
      runAdminWorkflow(token);
      break;
  }
}

/**
 * Global Teardown: Executes once after all VUs terminate.
 */
export function teardown(data) {
  console.log('====================================================');
  console.log('SpotQ Platform Admin Load Test execution finished.');
  console.log('====================================================');
}

/**
 * Generates structured HTML and JSON reports upon completion.
 */
export function handleSummary(data) {
  data.requestResponses = getRecordedResponses();
  return {
    'load-test-report.html': generateHtmlReport(data),
    'load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

// Fallback plain-text summary formatter
function textSummary(data, options) {
  const httpReqs = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
  const p95 = data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'].toFixed(2) : 0;
  const failRate = data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : 0;

  return `
--------------------------------------------------------------------------------
SpotQ Platform Admin Load Test Results
--------------------------------------------------------------------------------
Total Requests:     ${httpReqs}
Global p95 Latency: ${p95} ms
Error Rate:         ${failRate} %
HTML Report:        load-test-report.html
JSON Summary:       load-test-summary.json
--------------------------------------------------------------------------------
`;
}
