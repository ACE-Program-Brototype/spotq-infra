import http from 'k6/http';
import { check } from 'k6';
import { ENV, API_ENDPOINTS } from '../config/environments.js';
import { getActiveStages } from '../config/stages.js';
import { GRANULAR_THRESHOLDS } from '../config/thresholds.js';
import { authenticateStaffPool } from '../lib/auth.js';
import { buildHeaders } from '../lib/headers.js';
import { thinkTime, getVuSession, randomElement } from '../lib/helpers.js';
import { metrics } from '../lib/metrics.js';

const credentialsConfig = JSON.parse(open('../data/staff-credentials.json'));

export const options = {
  stages: getActiveStages(),
  thresholds: GRANULAR_THRESHOLDS,
};

export function setup() {
  return authenticateStaffPool(credentialsConfig);
}

/**
 * Floor Staff Scenario:
 * Simulates busser / floor staff checking tables and marking them available or maintenance.
 */
export default function (data) {
  const session = getVuSession(data.sessions);
  const restaurantId = session.restaurantId;
  const token = session.token;
  const headers = buildHeaders(token);

  // ── Step 1: Fetch All Restaurant Tables (Read Load) ─────────────────────────
  const tablesUrl = `${ENV.BASE_URL}${API_ENDPOINTS.TABLES.LIST(restaurantId)}`;
  const listRes = http.get(tablesUrl, { headers });

  const isListOk = check(listRes, {
    'Get tables list status is 200': (r) => r.status === 200,
    'Tables list has data': (r) => {
      try {
        const body = r.json();
        return body && (body.data !== undefined || Array.isArray(body));
      } catch (e) {
        return false;
      }
    },
  });

  metrics.operationSuccessRate.add(isListOk);

  let tables = [];
  try {
    const body = listRes.json();
    tables = body.data?.tables || (Array.isArray(body.data) ? body.data : []);
  } catch (e) {
    // ignore parse error if response failed
  }

  thinkTime(1, 2);

  // ── Step 2: Update Table Status (Write / Mutation Load) ─────────────────────
  // Select a table and update its status
  if (tables.length > 0) {
    const targetTable = randomElement(tables);
    const tableId = targetTable.id || targetTable.tableId;

    if (tableId) {
      const updateUrl = `${ENV.BASE_URL}${API_ENDPOINTS.TABLES.UPDATE_STATUS(restaurantId, tableId)}`;
      
      // Cycle status between AVAILABLE and MAINTENANCE
      const newStatus = targetTable.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
      const payload = JSON.stringify({ status: newStatus });

      const updateStart = Date.now();
      const updateRes = http.patch(updateUrl, payload, { headers });
      metrics.tableStatusDuration.add(Date.now() - updateStart);

      const isUpdateOk = check(updateRes, {
        'Update table status returns 200': (r) => r.status === 200,
      });

      metrics.operationSuccessRate.add(isUpdateOk);

      if (updateRes.status === 409) {
        metrics.conflictRate.add(1);
      }
    }
  }

  thinkTime(1, 3);
}

