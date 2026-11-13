import http from 'k6/http';
import { check, sleep } from 'k6';
import { ENDPOINTS, FALLBACK_RESTAURANT_ID } from '../config.js';
import { getAuthHeaders } from '../helpers/auth.js';

/**
 * Dedicated high-concurrency stress test targeting SpotQ Virtual Queue Service:
 * - Real-time ML ETA predictions
 * - Concurrent queue join locking & race condition handling
 * - Polling of customer position and live wait status
 * - Queue release / cancellation
 */
export function runQueueStress(token, seedData = {}) {
  const headers = getAuthHeaders(token);
  const restaurantId = seedData.restaurantId || FALLBACK_RESTAURANT_ID;

  // 1. Check customer active queue
  const activeRes = http.get(ENDPOINTS.ACTIVE_QUEUE, {
    ...headers,
    tags: { endpoint: 'queue_active' },
  });

  check(activeRes, {
    'active queue returned 200': (r) => r.status === 200,
  });

  sleep(0.2);

  // 2. High-frequency ETA calculations
  const partySize = (Math.floor(Math.random() * 5) + 1) * 2; // 2, 4, 6, 8, 10
  const etaUrl = `${ENDPOINTS.GET_ETA(restaurantId)}?partySize=${partySize}`;
  const etaRes = http.get(etaUrl, {
    ...headers,
    tags: { endpoint: 'queue_eta' },
  });

  check(etaRes, {
    'queue ETA calculation executed': (r) => r.status === 200 || r.status === 404,
  });

  sleep(0.3);

  // 3. Concurrent Queue Join
  const joinPayload = JSON.stringify({
    guestName: `Stress Guest ${Math.floor(Math.random() * 1000)}`,
    guestPhone: `+91987${Math.floor(1000000 + Math.random() * 9000000)}`,
    partySize: partySize,
    specialNotes: 'Queue stress simulation',
  });

  const joinRes = http.post(ENDPOINTS.JOIN_QUEUE(restaurantId), joinPayload, {
    ...headers,
    tags: { endpoint: 'queue_join' },
  });

  let queueEntryId = null;
  const isJoined = check(joinRes, {
    'queue join handled properly (200, 201, 400, or 409)': (r) =>
      [200, 201, 400, 409].includes(r.status),
  });

  if (isJoined && (joinRes.status === 200 || joinRes.status === 201)) {
    try {
      const body = JSON.parse(joinRes.body);
      queueEntryId = body.data?.id || body.data?.queueEntryId || body.data?.entry?.id;
    } catch (_) {}
  }

  // 4. Status poll and cleanup leave
  if (queueEntryId) {
    sleep(0.5);

    const statusRes = http.get(ENDPOINTS.QUEUE_STATUS(restaurantId, queueEntryId), {
      ...headers,
      tags: { endpoint: 'queue_status' },
    });

    check(statusRes, {
      'queue status returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    const leavePayload = JSON.stringify({ queueEntryId });
    http.post(ENDPOINTS.LEAVE_QUEUE(restaurantId), leavePayload, {
      ...headers,
      tags: { endpoint: 'queue_leave' },
    });
  }

  sleep(0.5);
}
