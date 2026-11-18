# SpotQ Customer — Mission-Critical Core Dining Funnel Load Testing Suite

Production-grade k6 performance and load testing suite designed according to **industry standards (80/20 Rule)** for SpotQ's customer-facing ordering and queue platform.

This suite focuses strictly on **revenue-critical, high-concurrency bottleneck endpoints** (the Core Dining Funnel) and deliberately eliminates non-critical noise (e.g., auth recovery OTPs, profile avatar uploads, push token registers, and health-check loops) that skew metrics and deplete third-party quotas.

---

## 🎯 The Core Dining Funnel Under Test

```
[Virtual Users: Min 100 VUs]
           │
           ▼
[01_Customer_Discovery] ────────► GET  /api/v1/restaurants/customers (Directory & Filter)
                                   GET  /api/v1/restaurants/customers/:id?includeMenu=true
           │
           ▼
[02_Virtual_Queue_Ops]  ────────► GET  /api/v1/queues/customer/active
                                   GET  /api/v1/queues/customer/:restaurantId/eta
                                   POST /api/v1/queues/customer/restaurants/:restaurantId/queue/join
                                   GET  /api/v1/queues/customer/restaurants/:restaurantId/queue/status
                                   POST /api/v1/queues/customer/restaurants/:restaurantId/queue/leave
           │
           ▼
[03_Cart_Management]    ────────► POST /api/v1/carts/items/batch (Redis State Sync)
                                   GET  /api/v1/carts/:cartId
           │
           ▼
[04_Checkout_Ordering]  ────────► GET  /api/v1/orders/checkout (Pricing, Tax, Packing Engine)
                                   POST /api/v1/orders (ACID DB Transaction with Idempotency)
                                   GET  /api/v1/orders/:orderId (Order Tracking)
                                   GET  /api/v1/orders/history (Orders Pagination)
           │
           ▼
[05_Payments_Settlement]────────► POST /api/v1/payments/orders/verify (Headless S2S HMAC Verification)
                                   GET  /api/v1/payments/orders/:orderId/status
                                   GET  /api/v1/payments/history (Ledger Audit)
```

---

## 📋 Must-Tested Customer APIs (Retained According to Industry Standards)

| Domain | Method | Endpoint | Purpose & Failure Mode Tested |
| :--- | :---: | :--- | :--- |
| **Auth Setup** | `POST` | `/api/v1/auth/users/login` | Session token issuance during setup (single-call) |
| **Discovery** | `GET` | `/api/v1/restaurants/customers` | Read scalability, pagination, index health |
| **Discovery** | `GET` | `/api/v1/restaurants/customers/:id` | Menu catalog joins & cache hit rates |
| **Queue** | `GET` | `/api/v1/queues/customer/active` | Live ticket query (fast-polling) |
| **Queue** | `GET` | `/api/v1/queues/customer/:restaurantId/eta` | ML predictive wait time under traffic spikes |
| **Queue** | `POST` | `/api/v1/queues/customer/restaurants/:id/queue/join` | High-concurrency write locks & duplicate guard |
| **Queue** | `GET` | `/api/v1/queues/customer/restaurants/:id/queue/status` | Real-time position tracking |
| **Queue** | `POST` | `/api/v1/queues/customer/restaurants/:id/queue/leave` | Clean queue state transition |
| **Cart** | `POST` | `/api/v1/carts/items/batch` | High-throughput distributed cart item write |
| **Cart** | `GET` | `/api/v1/carts/:cartId` | Cart hydration & subtotal evaluation |
| **Checkout** | `GET` | `/api/v1/orders/checkout` | Pricing contract, dynamic packing charge & GST calculation |
| **Ordering** | `POST` | `/api/v1/orders` | Distributed ACID order creation with `x-idempotency-key` |
| **Ordering** | `GET` | `/api/v1/orders/:orderId` | Live order fulfillment tracking |
| **Ordering** | `GET` | `/api/v1/orders/history` | Orders ledger pagination under load |
| **Payments** | `POST` | `/api/v1/payments/orders/verify` | Server-to-server cryptographic HMAC-SHA256 signature verification |
| **Payments** | `GET` | `/api/v1/payments/orders/:orderId/status` | Payment confirmation polling |
| **Payments** | `GET` | `/api/v1/payments/history` | Financial ledger history pagination |

---

## ⚡ Execution Profiles

| Profile | Virtual Users (VUs) | Duration | Description |
| :--- | :--- | :--- | :--- |
| `smoke` | 1 VU | 30s | Quick sanity check to ensure API gateway, routes, and auth tokens are functional. |
| `constant100` | 100 VUs | 2m | Standard flat concurrency benchmark testing constant diner traffic. |
| `min100` *(Default)* | 100 $\rightarrow$ 150 $\rightarrow$ 100 VUs | 2m 15s | Ramping benchmark simulating dinner rush-hour surges. |
| `stress` | 100 $\rightarrow$ 150 $\rightarrow$ 200 VUs | 1m 50s | High-intensity stress test identifying breaking points and connection pool limits. |

---

## 🚀 How to Run

### 1. Run Complete Dining Funnel (Recommended - 100 VUs Benchmark)

```bash
k6 run \
  -e BASE_URL="https://api.spotq.site" \
  -e TEST_PROFILE=constant100 \
  -e TEST_TYPE=core_funnel \
  -e RESTAURANT_ID="5dc5f92c-03b9-4eb1-85f5-88bf4159f0c8" \
  -e MENU_ITEM_ID="f2c3ea28-12ff-424c-9bf2-e567f65d34cd" \
  -e CUSTOMER_TOKEN="<VALID_ACCESS_TOKEN>" \
  -e RAZORPAY_KEY_SECRET="<RAZORPAY_SECRET_FOR_AUTO_PAYMENT_VERIFY>" \
  main.js
```

### 2. Run Isolated Domain Stress Tests

```bash
# Virtual Queue Race Condition Stress
k6 run -e TEST_TYPE=queue -e TEST_PROFILE=min100 main.js

# Orders & Cart Redis / DB Transaction Stress
k6 run -e TEST_TYPE=orders -e TEST_PROFILE=min100 main.js

# Catalog Search & ETA Predictive Stress
k6 run -e TEST_TYPE=discovery -e TEST_PROFILE=min100 main.js
```

### 3. Quick Smoke Test

```bash
k6 run -e TEST_PROFILE=smoke main.js
```

---

## 📊 Reports & SLA Thresholds

Upon test completion, k6 generates:
- **`load-test-report.html`**: Visual performance dashboard with latency percentiles, throughput charts, and error rates.
- **`load-test-summary.json`**: Structured JSON test telemetry for CI/CD pipeline assertions.
- **Terminal Summary**: Real-time console metrics for instant feedback.

### Strict Production SLOs:
- **Global Error Rate**: $< 5\%$ under peak load
- **Global $p(95)$ Latency**: $< 1,500\text{ ms}$
- **Cart Sync $p(95)$**: $< 600\text{ ms}$
- **Queue Join $p(95)$**: $< 600\text{ ms}$
- **Order Placement $p(95)$**: $< 1,200\text{ ms}$
- **Payment Verification $p(95)$**: $< 600\text{ ms}$
