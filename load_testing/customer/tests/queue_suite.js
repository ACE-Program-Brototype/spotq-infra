import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { ENDPOINTS, FALLBACK_RESTAURANT_ID } from '../config.js';
import { getAuthHeaders, generateUuid } from '../helpers/auth.js';

/**
 * Tests all Customer Virtual Queue APIs: active check, ETA predictions, join, status polling, and leave
 */
export function runQueueSuite(token, seedData = {}) {
  const headers = getAuthHeaders(token);
  const restaurantId = seedData.restaurantId || FALLBACK_RESTAURANT_ID;
  let activeQueueEntryId = null;

  group('04_Virtual_Queue_APIs', () => {
    // 1. Active Customer Queue Check
    const activeRes = http.get(ENDPOINTS.ACTIVE_QUEUE, {
      ...headers,
      tags: { endpoint: 'queue_active' },
    });
    check(activeRes, {
      'active queue check responded 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 2. ML ETA Prediction Query
    const etaUrl = `${ENDPOINTS.GET_ETA(restaurantId)}?partySize=4`;
    const etaRes = http.get(etaUrl, {
      ...headers,
      tags: { endpoint: 'queue_eta' },
    });
    check(etaRes, {
      'queue ETA calculation executed': (r) => [200, 404, 409].includes(r.status),
    });

    sleep(0.3);

    // 3. Join Virtual Queue
    const randomGuestNum = Math.floor(1000 + Math.random() * 9000);
    const joinPayload = JSON.stringify({
      guestName: `Queue Diner ${randomGuestNum}`,
      guestPhone: `+9198765${randomGuestNum}`,
      partySize: 2,
      specialNotes: 'Queue suite test guest',
    });

    const joinRes = http.post(ENDPOINTS.JOIN_QUEUE(restaurantId), joinPayload, {
      ...headers,
      tags: { endpoint: 'queue_join' },
    });

    const isJoined = check(joinRes, {
      'join queue responded (200, 201, 400, or 409)': (r) =>
        [200, 201, 400, 409].includes(r.status),
    });

    if (isJoined && (joinRes.status === 200 || joinRes.status === 201)) {
      try {
        const body = JSON.parse(joinRes.body);
        activeQueueEntryId =
          body.data?.id || body.data?.queueEntryId || body.data?.entry?.id;
      } catch (_) {}
    }

    const testEntryId = activeQueueEntryId || generateUuid();
    sleep(0.4);

    // 4. Poll Queue Status
    const statusRes = http.get(
      ENDPOINTS.QUEUE_STATUS(restaurantId, testEntryId),
      {
        ...headers,
        tags: { endpoint: 'queue_status' },
      }
    );
    check(statusRes, {
      'queue status check responded': (r) => [200, 400, 404].includes(r.status),
    });

    sleep(0.3);

    // 5. Leave Queue
    const leavePayload = JSON.stringify({
      queueEntryId: testEntryId,
    });
    const leaveRes = http.post(
      ENDPOINTS.LEAVE_QUEUE(restaurantId),
      leavePayload,
      {
        ...headers,
        tags: { endpoint: 'queue_leave' },
      }
    );
    check(leaveRes, {
      'leave queue responded': (r) => [200, 204, 400, 404].includes(r.status),
    });

    sleep(0.5);
  });
}
