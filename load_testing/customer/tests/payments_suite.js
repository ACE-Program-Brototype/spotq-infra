import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { ENDPOINTS, FALLBACK_ORDER_ID, FALLBACK_TRANSACTION_ID } from '../config.js';
import { getAuthHeaders, generateUuid } from '../helpers/auth.js';

/**
 * Tests all Payments, Invoicing & Refund APIs: payment ledger, order payment status, verification, retry, invoice download, refunds
 */
export function runPaymentsSuite(token) {
  const headers = getAuthHeaders(token);
  const testOrderId = FALLBACK_ORDER_ID;
  const testTransactionId = FALLBACK_TRANSACTION_ID;

  group('07_Payments_And_Invoicing_APIs', () => {
    // 1. Customer Payment History Ledger
    const historyUrl = `${ENDPOINTS.PAYMENT_HISTORY}?page=1&limit=10&status=ALL`;
    const historyRes = http.get(historyUrl, {
      ...headers,
      tags: { endpoint: 'payment_history' },
    });

    check(historyRes, {
      'payment history returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 2. Order Payment Status
    const orderStatusRes = http.get(ENDPOINTS.PAYMENT_STATUS(testOrderId), {
      ...headers,
      tags: { endpoint: 'payment_order_status' },
    });

    check(orderStatusRes, {
      'order payment status responded': (r) => [200, 404].includes(r.status),
    });

    sleep(0.3);

    // 3. Payment Signature Verification
    const verifyPayload = JSON.stringify({
      orderId: testOrderId,
      razorpayOrderId: `order_${generateUuid().substring(0, 14)}`,
      razorpayPaymentId: `pay_${generateUuid().substring(0, 14)}`,
      razorpaySignature: 'simulated_k6_test_signature_hash',
    });

    const verifyRes = http.post(ENDPOINTS.VERIFY_PAYMENT, verifyPayload, {
      ...headers,
      tags: { endpoint: 'payment_verify' },
    });

    check(verifyRes, {
      'payment verification responded': (r) => [200, 400, 404].includes(r.status),
    });

    sleep(0.3);

    // 4. Payment Retry
    const retryRes = http.post(ENDPOINTS.PAYMENT_RETRY(testTransactionId), null, {
      ...headers,
      tags: { endpoint: 'payment_retry' },
    });

    check(retryRes, {
      'payment retry responded': (r) => [200, 400, 404].includes(r.status),
    });

    sleep(0.3);

    // 5. Download Official GST Tax Invoice
    const invoiceRes = http.get(ENDPOINTS.PAYMENT_INVOICE(testTransactionId), {
      ...headers,
      tags: { endpoint: 'payment_invoice' },
    });

    check(invoiceRes, {
      'payment invoice responded': (r) => [200, 404].includes(r.status),
    });

    sleep(0.3);

    // 6. Order Refund Tracking
    const refundRes = http.get(ENDPOINTS.PAYMENT_REFUND_STATUS(testOrderId), {
      ...headers,
      tags: { endpoint: 'payment_refund_status' },
    });

    check(refundRes, {
      'order refund status responded': (r) => [200, 404].includes(r.status),
    });

    sleep(0.3);

    // 7. Public Subscription Plans Catalog
    const plansRes = http.get(ENDPOINTS.PLANS_CATALOG, {
      headers: { Accept: 'application/json' },
      tags: { endpoint: 'payment_plans_catalog' },
    });

    check(plansRes, {
      'plans catalog returned 200': (r) => r.status === 200,
    });

    sleep(0.5);
  });
}
