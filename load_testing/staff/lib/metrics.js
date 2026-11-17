import { Trend, Counter, Rate } from 'k6/metrics';

/**
 * Custom metrics to monitor critical operational latencies
 */
export const metrics = {
  // Latency trends for specific actions
  liveQueueDuration: new Trend('live_queue_fetch_duration', true),
  walkInDuration: new Trend('walk_in_registration_duration', true),
  seatPartyDuration: new Trend('seat_party_duration', true),
  tableStatusDuration: new Trend('table_status_update_duration', true),
  orderStatusDuration: new Trend('order_status_update_duration', true),
  ordersListDuration: new Trend('orders_list_duration', true),

  // Success / Failure Rates
  operationSuccessRate: new Rate('staff_operation_success_rate'),
  conflictRate: new Rate('order_table_conflict_409_rate'),
};

