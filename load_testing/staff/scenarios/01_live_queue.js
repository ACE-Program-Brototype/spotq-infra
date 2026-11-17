import http from 'k6/http';
import { check } from 'k6';
import { ENV, API_ENDPOINTS } from '../config/environments.js';
import { getActiveStages } from '../config/stages.js';
import { GRANULAR_THRESHOLDS } from '../config/thresholds.js';
import { authenticateStaffPool } from '../lib/auth.js';
import { buildHeaders } from '../lib/headers.js';
import { thinkTime, getVuSession, generateE164Phone, randomElement } from '../lib/helpers.js';
import { metrics } from '../lib/metrics.js';

// Load staff credentials from JSON
const credentialsConfig = JSON.parse(open('../data/staff-credentials.json'));

export const options = {
  stages: getActiveStages(),
  thresholds: GRANULAR_THRESHOLDS,
};

/**
 * Setup lifecycle:
 * Runs once before VUs spawn. Authenticates staff accounts and passes tokens to all VUs.
 */
export function setup() {
  return authenticateStaffPool(credentialsConfig);
}

/**
 * Main VU execution loop:
 * Simulates a hostess tablet at the restaurant entrance.
 */
export default function (data) {
  const session = getVuSession(data.sessions);
  const restaurantId = session.restaurantId;
  const token = session.token;
  const headers = buildHeaders(token);

  // ── Step 1: Poll Live Queue (High Frequency Read) ──────────────────────────
  const queueUrl = `${ENV.BASE_URL}${API_ENDPOINTS.QUEUE.LIVE_QUEUE(restaurantId)}`;
  const queueStart = Date.now();
  const queueRes = http.get(queueUrl, { headers });
  metrics.liveQueueDuration.add(Date.now() - queueStart);

  const isQueueOk = check(queueRes, {
    'Live queue status is 200': (r) => r.status === 200,
    'Live queue has response body': (r) => {
      try {
        return r.json() !== null;
      } catch (e) {
        return false;
      }
    },
  });

  metrics.operationSuccessRate.add(isQueueOk);

  // Parse queue entries for subsequent actions
  let queueEntries = [];
  try {
    const body = queueRes.json();
    queueEntries = body.data?.entries || body.data?.queue || (Array.isArray(body.data) ? body.data : []);
  } catch (e) {
    // ignore parse error if response failed
  }

  // Realistic hostess pause
  thinkTime(1, 2);

  // ── Step 2: Probabilistic Walk-in Registration (Write Load) ────────────────
  // Hostess registers a walk-in guest in ~30% of iterations
  if (Math.random() < 0.3) {
    const walkInUrl = `${ENV.BASE_URL}${API_ENDPOINTS.QUEUE.WALK_IN(restaurantId)}`;
    const walkInPayload = JSON.stringify({
      guestName: `LoadTest Guest ${__VU}-${Date.now().toString().slice(-4)}`,
      guestPhone: generateE164Phone(),
      partySize: Math.floor(Math.random() * 4) + 1, // 1 to 4 guests
      specialNotes: 'k6 automated load test',
    });

    const walkInStart = Date.now();
    const walkInRes = http.post(walkInUrl, walkInPayload, { headers });
    metrics.walkInDuration.add(Date.now() - walkInStart);

    const isWalkInOk = check(walkInRes, {
      'Walk-in registered (201/200) or rejected by business rule (400 table available)': (r) =>
        r.status === 201 || r.status === 200 || r.status === 400,
    });

    if (!isWalkInOk) {
      console.log(`[DEBUG Walk-in Failed] HTTP ${walkInRes.status}: ${walkInRes.body}`);
    }

    metrics.operationSuccessRate.add(isWalkInOk);
  }

  // ── Step 3: Ring / Notify Waiting Customer (Action Load) ────────────────────
  // If there are customers in the queue, notify one ~20% of the time
  if (queueEntries.length > 0 && Math.random() < 0.2) {
    const targetEntry = randomElement(queueEntries);
    const entryId = targetEntry.id || targetEntry.queueEntryId;

    if (entryId) {
      const ringUrl = `${ENV.BASE_URL}${API_ENDPOINTS.QUEUE.RING_CUSTOMER(entryId)}`;
      const ringRes = http.post(ringUrl, null, { headers });

      check(ringRes, {
        'Ring customer returns 200 or 400 (already notified)': (r) => r.status === 200 || r.status === 400,
      });
    }
  }

  // Pacing before next loop
  thinkTime(1, 3);
}

