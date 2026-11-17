import http from 'k6/http';
import { check } from 'k6';
import { ENV, API_ENDPOINTS } from '../config/environments.js';
import { buildHeaders } from './headers.js';

/**
 * Authenticates a single staff member against the Envoy API Gateway.
 * Automatically handles the 2-step flow if restaurant selection is required.
 *
 * @param {Object} credentials - { email, password }
 * @param {string} targetRestaurantId - UUID of the restaurant
 * @returns {Object} { token, restaurantId, staffId }
 */
export function loginStaff(credentials, targetRestaurantId = null) {
  // If an override token was provided via CLI, use it directly (-e STAFF_TOKEN=...)
  if (__ENV.STAFF_TOKEN) {
    return {
      token: __ENV.STAFF_TOKEN,
      restaurantId: targetRestaurantId || __ENV.RESTAURANT_ID,
      staffId: 'manual-token-user',
    };
  }

  const loginUrl = `${ENV.BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`;
  const payload = JSON.stringify({
    email: credentials.email,
    password: credentials.password,
    ...(targetRestaurantId && { restaurantId: targetRestaurantId }),
  });

  const response = http.post(loginUrl, payload, { headers: buildHeaders() });

  const loginOk = check(response, {
    'Staff login status is 200': (res) => res.status === 200,
    'Login response has data': (res) => {
      try {
        const body = res.json();
        return body && body.data !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (!loginOk) {
    console.error(`Login failed for ${credentials.email}. Status: ${response.status}, Body: ${response.body}`);
    return null;
  }

  const resBody = response.json();
  const data = resBody.data;

  // Case 1: Direct token returned (Staff belongs to a single restaurant or auto-resolved)
  if (data.accessToken) {
    const resolvedRestaurantId = data.staff?.restaurantId || (data.restaurants && data.restaurants[0]?.restaurantId) || targetRestaurantId;
    console.log(`[setup] Staff ${credentials.email} resolved to restaurantId: ${resolvedRestaurantId}`);
    return {
      token: data.accessToken,
      restaurantId: resolvedRestaurantId,
      staffId: data.staff?.id || data.staff?.staffId,
    };
  }

  // Case 2: Requires restaurant selection
  if (data.requiresRestaurantSelection && data.selectToken) {
    const chosenRestaurantId = data.staff?.restaurantId || (data.restaurants && data.restaurants[0]?.restaurantId) || targetRestaurantId;
    if (!chosenRestaurantId) {
      console.error(`Staff requires restaurant selection, but no restaurant ID was provided or found in response.`);
      return null;
    }

    const selectUrl = `${ENV.BASE_URL}${API_ENDPOINTS.AUTH.SELECT_RESTAURANT}`;
    const selectPayload = JSON.stringify({
      selectToken: data.selectToken,
      restaurantId: chosenRestaurantId,
    });

    const selectRes = http.post(selectUrl, selectPayload, { headers: buildHeaders() });
    const selectOk = check(selectRes, {
      'Select restaurant status is 200': (res) => res.status === 200,
      'Select restaurant returned accessToken': (res) => {
        try {
          return !!res.json().data?.accessToken;
        } catch (e) {
          return false;
        }
      },
    });

    if (!selectOk) {
      console.error(`Select restaurant failed. Status: ${selectRes.status}, Body: ${selectRes.body}`);
      return null;
    }

    const selectData = selectRes.json().data;
    const finalRestaurantId = selectData.staff?.restaurantId || chosenRestaurantId;
    console.log(`[setup] Staff ${credentials.email} selected restaurantId: ${finalRestaurantId}`);
    return {
      token: selectData.accessToken,
      restaurantId: finalRestaurantId,
      staffId: selectData.staff?.id || selectData.staff?.staffId,
    };
  }

  console.error(`Unexpected login response structure: ${response.body}`);
  return null;
}

/**
 * Logs in all staff accounts found in fixtures during k6's setup() phase.
 * Returns an array of authenticated sessions { token, restaurantId, staffId }.
 */
export function authenticateStaffPool(credentialsConfig) {
  const restaurantId = __ENV.RESTAURANT_ID || credentialsConfig.restaurantId;
  const staffList = credentialsConfig.staff || [];

  if (staffList.length === 0 && !__ENV.STAFF_TOKEN) {
    throw new Error('No staff credentials found in data/staff-credentials.json and no STAFF_TOKEN provided.');
  }

  const authenticatedPool = [];

  for (let i = 0; i < staffList.length; i++) {
    const cred = staffList[i];
    console.log(`[setup] Authenticating staff: ${cred.email}...`);
    const session = loginStaff(cred, restaurantId);
    if (session && session.token) {
      authenticatedPool.push(session);
    }
  }

  if (authenticatedPool.length === 0) {
    throw new Error('[setup] Failed to authenticate any staff members. Check credentials, DB, and Envoy gateway.');
  }

  console.log(`[setup] Successfully authenticated ${authenticatedPool.length} staff account(s).`);
  const primaryRestaurantId = authenticatedPool[0].restaurantId || restaurantId;
  return {
    restaurantId: primaryRestaurantId,
    sessions: authenticatedPool,
  };
}

