import http from 'k6/http';
import { check, sleep } from 'k6';
import { ENDPOINTS, FALLBACK_RESTAURANT_ID } from '../config.js';
import { getAuthHeaders } from '../helpers/auth.js';

const CUISINES = ['All', 'Mandi', 'Chinese', 'Multi-Cuisine', 'South Indian', 'Biryani'];
const SORT_MODES = ['newest', 'name_asc', 'price_asc', 'price_desc'];

/**
 * Dedicated high-throughput stress test targeting restaurant discovery and catalog queries:
 * - Search keyword queries
 * - Cuisine filtering
 * - Dynamic price & rating filtering
 * - Restaurant menu catalog serialization
 * - ML ETA calculations
 */
export function runDiscoveryStress(token, seedData = {}) {
  const headers = getAuthHeaders(token);
  const restaurantId = seedData.restaurantId || FALLBACK_RESTAURANT_ID;

  // 1. Filtered restaurant search query
  const randomCuisine = CUISINES[Math.floor(Math.random() * CUISINES.length)];
  const randomSort = SORT_MODES[Math.floor(Math.random() * SORT_MODES.length)];
  const randomPage = Math.floor(Math.random() * 3) + 1;

  let queryUrl = `${ENDPOINTS.RESTAURANTS_LIST}?page=${randomPage}&limit=10&sort=${randomSort}`;
  if (randomCuisine !== 'All') {
    queryUrl += `&cuisine=${encodeURIComponent(randomCuisine)}`;
  }

  const listRes = http.get(queryUrl, {
    ...headers,
    tags: { endpoint: 'restaurants_list' },
  });

  check(listRes, {
    'discovery list returned 200': (r) => r.status === 200,
  });

  sleep(0.3);

  // 2. Full restaurant menu items catalog
  const menuUrl = `${ENDPOINTS.RESTAURANT_DETAILS(restaurantId)}?includeMenu=true`;
  const menuRes = http.get(menuUrl, {
    ...headers,
    tags: { endpoint: 'restaurant_details' },
  });

  check(menuRes, {
    'menu details returned 200': (r) => r.status === 200,
  });

  sleep(0.3);

  // 3. Fast ETA prediction calculation
  const etaParty = Math.floor(Math.random() * 6) + 1;
  const etaUrl = `${ENDPOINTS.GET_ETA(restaurantId)}?partySize=${etaParty}`;
  const etaRes = http.get(etaUrl, {
    ...headers,
    tags: { endpoint: 'queue_eta' },
  });

  check(etaRes, {
    'eta calculation responded': (r) => [200, 404, 409].includes(r.status),
  });

  sleep(0.5);
}
