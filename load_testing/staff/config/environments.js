/**
 * Environment configuration for SpotQ Staff load tests.
 * Defaults to local Envoy API Gateway (port 10000).
 * Can be overridden via k6 CLI flag: -e BASE_URL=http://your-host:port
 */
export const ENV = {
  BASE_URL: __ENV.BASE_URL || 'http://localhost:10000',
  API_PREFIX: '/api/v1',
};

export const API_ENDPOINTS = {
  // Staff Authentication & Profile (routed to spotq-restaurant-service)
  AUTH: {
    LOGIN: `${ENV.API_PREFIX}/auth/restaurants/staff/login`,
    SELECT_RESTAURANT: `${ENV.API_PREFIX}/auth/restaurants/staff/select-restaurant`,
    PROFILE: `${ENV.API_PREFIX}/staff/profile/me`,
  },

  // Live Queue & Actions (routed to spotq-queue-service)
  QUEUE: {
    LIVE_QUEUE: (restaurantId) => `${ENV.API_PREFIX}/queues/staff/restaurants/${restaurantId}`,
    WALK_IN: (restaurantId) => `${ENV.API_PREFIX}/queues/staff/restaurants/${restaurantId}/queue/walk-in`,
    ASSIGN_TABLES: (queueEntryId) => `${ENV.API_PREFIX}/queues/staff/queue/${queueEntryId}/assign-tables`,
    RING_CUSTOMER: (queueEntryId) => `${ENV.API_PREFIX}/queues/staff/queue/${queueEntryId}/ring`,
    SEAT_PARTY: (restaurantId, queueEntryId) => `${ENV.API_PREFIX}/queues/staff/restaurants/${restaurantId}/queue/${queueEntryId}/seat`,
    SKIP_PARTY: (restaurantId, queueEntryId) => `${ENV.API_PREFIX}/queues/staff/restaurants/${restaurantId}/queue/${queueEntryId}/skip`,
    CANCEL: (restaurantId, queueEntryId) => `${ENV.API_PREFIX}/queues/staff/restaurants/${restaurantId}/queue/${queueEntryId}/cancel`,
  },

  // Table Floor Management (routed to spotq-restaurant-service)
  TABLES: {
    LIST: (restaurantId) => `${ENV.API_PREFIX}/restaurants/${restaurantId}/table`,
    DETAILS: (restaurantId, tableId) => `${ENV.API_PREFIX}/restaurants/${restaurantId}/table/${tableId}`,
    UPDATE_STATUS: (restaurantId, tableId) => `${ENV.API_PREFIX}/restaurants/${restaurantId}/table/${tableId}/status`,
  },

  // Kitchen Orders & Fulfillment (routed to spotq-order-service)
  ORDERS: {
    LIST: (restaurantId) => `${ENV.API_PREFIX}/orders/staff/restaurants/${restaurantId}/orders`,
    DETAILS: (restaurantId, orderId) => `${ENV.API_PREFIX}/orders/staff/restaurants/${restaurantId}/orders/${orderId}`,
    UPDATE_STATUS: (orderId) => `${ENV.API_PREFIX}/orders/staff/${orderId}/status`,
  },
};

