import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { ENDPOINTS, FALLBACK_RESTAURANT_ID, FALLBACK_MENU_ITEM_ID } from '../config.js';
import { getAuthHeaders } from '../helpers/auth.js';

/**
 * Tests all Restaurant Discovery, Search, and Menu Catalog APIs
 */
export function runDiscoveryMenuSuite(token, seedData = {}) {
  const headers = getAuthHeaders(token);
  const restaurantId = seedData.restaurantId || FALLBACK_RESTAURANT_ID;
  const menuItemId = seedData.menuItemId || FALLBACK_MENU_ITEM_ID;

  group('03_Restaurant_Discovery_And_Menu_APIs', () => {
    // 1. Browse Customer Restaurants Directory
    const listUrl = `${ENDPOINTS.RESTAURANTS_LIST}?page=1&limit=8&sortBy=createdAt&sortOrder=desc`;
    const listRes = http.get(listUrl, {
      ...headers,
      tags: { endpoint: 'restaurants_list' },
    });
    check(listRes, {
      'restaurants directory returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 2. Filtered Search (Cuisine, City, Price Range)
    const filteredUrl = `${ENDPOINTS.RESTAURANTS_LIST}?page=1&limit=10&cuisine=Biryani&minPrice=50&maxPrice=1000&sortBy=restaurantName&sortOrder=asc`;
    const filterRes = http.get(filteredUrl, {
      ...headers,
      tags: { endpoint: 'restaurants_list' },
    });
    check(filterRes, {
      'filtered restaurants query returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 3. Restaurant Profile & Full Menu Details
    const detailsUrl = `${ENDPOINTS.RESTAURANT_DETAILS(restaurantId)}?includeMenu=true`;
    const detailsRes = http.get(detailsUrl, {
      ...headers,
      tags: { endpoint: 'restaurant_details' },
    });
    check(detailsRes, {
      'restaurant details with menu returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 4. Single Customer Menu Item Detail
    const itemDetailUrl = ENDPOINTS.CUSTOMER_MENU_ITEM(restaurantId, menuItemId);
    const itemDetailRes = http.get(itemDetailUrl, {
      ...headers,
      tags: { endpoint: 'customer_menu_item_detail' },
    });
    check(itemDetailRes, {
      'customer menu item detail responded': (r) => [200, 404].includes(r.status),
    });

    sleep(0.3);

    // 5. Menu Categories List
    const catUrl = ENDPOINTS.MENU_CATEGORIES(restaurantId);
    const catRes = http.get(catUrl, {
      ...headers,
      tags: { endpoint: 'menu_categories_list' },
    });
    check(catRes, {
      'menu categories responded': (r) => [200, 401, 403, 404].includes(r.status),
    });

    sleep(0.3);

    // 6. Direct Menu Items List
    const itemsUrl = `${ENDPOINTS.MENU_ITEMS(restaurantId)}?page=1&limit=20`;
    const itemsRes = http.get(itemsUrl, {
      ...headers,
      tags: { endpoint: 'menu_items_list' },
    });
    check(itemsRes, {
      'menu items list responded': (r) => [200, 401, 403, 404].includes(r.status),
    });

    sleep(0.5);
  });
}
