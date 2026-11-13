# SpotQ Customer — Production Grade Complete API Load Testing Suite

Production-grade k6 performance and load testing suite designed specifically for **all Customer-Facing APIs** across the entire SpotQ digital takeaway ordering and virtual queue platform.

This suite is modeled around real-world diner behavior, rush-hour peak ordering traffic, and high-concurrency race conditions across virtual queues, cart synchronization, ML ETA predictions, takeaway checkout, and payment tracking.

---

## 🎯 Architecture & Blast Radius Under Test

```
                              [k6 Virtual Users]
                                      │
                         (JWT Bearer Auth: Port 10000)
                                      ▼
                           [Envoy API Gateway]
                                      │
      ┌───────────────┬───────────────┼───────────────┬───────────────┐
      ▼               ▼               ▼               ▼               ▼
[user-service] [restaurant-svc] [queue-service] [order-service] [payment-service]
• Customer Auth • Discovery     • Virtual Queue • Cart Sync     • Order Verify
• Profile Me    • Menu Catalog  • ML ETA Predict• Checkout Calc • Payment Ledger
• Push Devices  • Categories    • Active Ticket • Order Place   • GST Invoice
                                • Seat / Leave  • Past Orders   • Refunds
                                      │
                                      ▼
                              [ml-eta-service]
                              • Live Wait Time
```

---

## 📋 Comprehensive Catalog of Tested Customer APIs (46 Endpoints)

### 1. Authentication & Identity Lifecycle (`user-service`)
| # | Method | Endpoint | Description |
| :-: | :-: | :--- | :--- |
| **1** | `POST` | `/api/v1/auth/users/login` | Authenticate customer credentials & issue JWT Bearer tokens |
| **2** | `POST` | `/api/v1/auth/users/refresh-token` | Silent token renewal using HTTP cookies / refresh token |
| **3** | `POST` | `/api/v1/auth/users/register` | Customer sign-up & account provisioning |
| **4** | `POST` | `/api/v1/auth/users/resend-email-otp` | Reissue email verification OTP |
| **5** | `POST` | `/api/v1/auth/users/forgot-password` | Initiate password reset flow & send OTP |
| **6** | `POST` | `/api/v1/auth/users/forgot-password/resend-otp` | Reissue forgot password OTP |
| **7** | `POST` | `/api/v1/auth/users/logout` | Invalidate customer session & clear cookies |

### 2. Customer Profile & Device Tokens (`user-service`)
| # | Method | Endpoint | Description |
| :-: | :-: | :--- | :--- |
| **8** | `GET` | `/api/v1/users/profile` | Retrieve customer profile (name, phone, dob, gender) |
| **9** | `PATCH` | `/api/v1/users/profile` | Update profile information with validation rules |
| **10** | `GET` | `/api/v1/users/me` | Fetch active session customer identity snapshot |
| **11** | `GET` | `/api/v1/users/me/devices` | List registered customer push notification devices |
| **12** | `POST` | `/api/v1/users/me/devices` | Register web/mobile push notification device token |
| **13** | `DELETE` | `/api/v1/users/me/devices/:deviceId` | Deactivate/revoke push notification device |

### 3. Restaurant Discovery & Menu Catalog (`restaurant-service`)
| # | Method | Endpoint | Description |
| :-: | :-: | :--- | :--- |
| **14** | `GET` | `/api/v1/restaurants/customers` | Paginated restaurant search with sorting (newest, price, rating) |
| **15** | `GET` | `/api/v1/restaurants/customers` *(Filtered)* | Multi-facet filtering by cuisine, city, minPrice, maxPrice |
| **16** | `GET` | `/api/v1/restaurants/customers/:id?includeMenu=true` | Full restaurant details, opening hours & full menu catalog |
| **17** | `GET` | `/api/v1/restaurants/customers/:restId/menu/items/:itemId` | Single customer menu item details |
| **18** | `GET` | `/api/v1/restaurants/:restId/menu/categories` | Restaurant menu category directory |
| **19** | `GET` | `/api/v1/restaurants/:restId/menu/items` | Restaurant dishes directory |

### 4. Virtual Queue Operations (`queue-service` / `ml-eta-service`)
| # | Method | Endpoint | Description |
| :-: | :-: | :--- | :--- |
| **20** | `GET` | `/api/v1/queues/customer/active` | Floating queue pill query for active ticket |
| **21** | `GET` | `/api/v1/queues/customer/:restaurantId/eta` | ML-driven real-time estimated wait time prediction |
| **22** | `POST` | `/api/v1/queues/customer/restaurants/:restaurantId/queue/join` | Join virtual queue with party size & contact details |
| **23** | `GET` | `/api/v1/queues/customer/restaurants/:restaurantId/queue/status` | Live ticket position & status polling |
| **24** | `POST` | `/api/v1/queues/customer/restaurants/:restaurantId/queue/leave` | Leave virtual queue & recalculate queue positions |

### 5. Takeaway Cart Management (`order-service`)
| # | Method | Endpoint | Description |
| :-: | :-: | :--- | :--- |
| **25** | `POST` | `/api/v1/carts/items/batch` | High-performance Redis batch sync of multiple items |
| **26** | `POST` | `/api/v1/carts/items` | Add single dish item with modifiers to cart |
| **27** | `GET` | `/api/v1/carts/:cartId` | Retrieve cart contents, item counts, and subtotal |
| **28** | `PATCH` | `/api/v1/carts/:cartId/items/:cartItemId` | Update item quantity in cart |
| **29** | `DELETE` | `/api/v1/carts/:cartId/items/:cartItemId` | Remove specific item from cart |
| **30** | `DELETE` | `/api/v1/carts/:cartId` | Clear entire cart contents |

### 6. Takeaway Orders & Checkout Engine (`order-service`)
| # | Method | Endpoint | Description |
| :-: | :-: | :--- | :--- |
| **31** | `GET` | `/api/v1/orders/checkout` | Pricing engine contract: live item prices, packaging, GST |
| **32** | `POST` | `/api/v1/orders` | Place takeaway order with idempotency key (`x-idempotency-key`) |
| **33** | `GET` | `/api/v1/orders/history` | Paginated past orders history filtered by status |
| **34** | `GET` | `/api/v1/orders/:orderId` | Live order tracking (`PLACED` -> `PREPARING` -> `READY`) |
| **35** | `POST` | `/api/v1/orders/:orderId/cancel` | Cancel order with reason |

### 7. Payments, Invoicing & Refunds (`payment-service`)
| # | Method | Endpoint | Description |
| :-: | :-: | :--- | :--- |
| **36** | `GET` | `/api/v1/payments/history` | Paginated customer dining payments ledger |
| **37** | `GET` | `/api/v1/payments/orders/:orderId/status` | Real-time payment gate authorization status check |
| **38** | `POST` | `/api/v1/payments/orders/verify` | Verify Razorpay payment signature & capture order |
| **39** | `POST` | `/api/v1/payments/transactions/:id/retry` | Re-initiate payment for failed transactions |
| **40** | `GET` | `/api/v1/payments/transactions/:id/invoice` | Fetch presigned URL to download official GST tax invoice |
| **41** | `GET` | `/api/v1/payments/:orderId/refund-status` | Track status of refunded orders |
| **42** | `GET` | `/api/v1/payments/plans` | Public subscription plans catalog |

### 8. Microservice Health Checks (`all services`)
| # | Method | Endpoint | Description |
| :-: | :-: | :--- | :--- |
| **43** | `GET` | `/api/v1/users/health` | Downstream health check for User Service |
| **44** | `GET` | `/api/v1/restaurants/health` | Downstream health check for Restaurant Service |
| **45** | `GET` | `/api/v1/queues/health` | Downstream health check for Queue Service |
| **46** | `GET` | `/api/v1/orders/health` | Downstream health check for Order Service |
| **47** | `GET` | `/api/v1/payments/health` | Downstream health check for Payment Service |

---

## 🛠️ Prerequisites

1. **k6 Installed**:
   ```bash
   # Windows (via winget or chocolatey)
   winget install k6 --source winget
   # or
   choco install k6

   # macOS (Homebrew)
   brew install k6

   # Linux (Debian/Ubuntu)
   sudo apt-get update && sudo apt-get install k6
   ```

2. **SpotQ Platform Running**:
   Ensure Docker containers are active via `docker compose up -d` in `infra`.

3. **Customer Account**:
   Default customer credentials (`customer@spotq.com` / `Customer@12345` or configure via `CUSTOMER_EMAIL` / `CUSTOMER_PASSWORD`). The test suite automatically attempts registration if the account is not yet seeded.

---

## 🚀 Execution Guide

Run commands from the `infra/load_testing/customer` directory:

```bash
cd infra/load_testing/customer
```

### 1. Smoke Test (Sanity Verification — 1 VU, 30s)
*Executes all 46 customer endpoints to verify 100% endpoint health and contract compliance.*
```bash
k6 run -e TEST_PROFILE=smoke main.js
```

### 2. Standard Load Test (Typical Lunch / Dinner Rush — Ramping to 50 VUs)
*Simulates peak simultaneous customer sessions across discovery, queuing, cart sync, and ordering.*
```bash
k6 run -e TEST_PROFILE=load main.js
```

### 3. Stress Test (Breaking Point — Ramping to 180 VUs)
*Pushes queue synchronization, cart locks, and database connection pools to evaluate system thresholds.*
```bash
k6 run -e TEST_PROFILE=stress main.js
```

### 4. Spike Test (Sudden Flash Rush — 100 VUs in 10s)
*Validates rate limiters, API Gateway auto-recovery, and burst handling.*
```bash
k6 run -e TEST_PROFILE=spike main.js
```

### 5. Soak / Endurance Test (10m Sustained Concurrency)
*Checks for Redis memory leaks, unclosed database connection pools, and event-loop thrashing.*
```bash
k6 run -e TEST_PROFILE=soak main.js
```

---

## 🎯 Testing Specific Component Suites

You can isolate and target individual high-frequency subsystems using the `-e TEST_TYPE` flag:

```bash
# 1. Run all 46 customer endpoints (default)
k6 run -e TEST_PROFILE=load -e TEST_TYPE=all main.js

# 2. Run the realistic multi-step customer persona journey
k6 run -e TEST_PROFILE=load -e TEST_TYPE=journey main.js

# 3. Test Authentication, Profile, and Device Management
k6 run -e TEST_PROFILE=load -e TEST_TYPE=auth main.js

# 4. Test Restaurant Discovery, Search, and Menu Catalog
k6 run -e TEST_PROFILE=load -e TEST_TYPE=discovery main.js

# 5. Test Virtual Queues (join locks, status polling, ETA queries, position updates)
k6 run -e TEST_PROFILE=load -e TEST_TYPE=queue main.js

# 6. Test Cart operations (batch add, single add, update qty, remove, clear)
k6 run -e TEST_PROFILE=load -e TEST_TYPE=cart main.js

# 7. Test Takeaway Orders & Checkout calculations
k6 run -e TEST_PROFILE=load -e TEST_TYPE=orders main.js

# 8. Test Payments, Invoices, Status & Refunds
k6 run -e TEST_PROFILE=load -e TEST_TYPE=payments main.js
```

---

## ⚙️ Environment Configuration

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `BASE_URL` | `http://localhost:10000` | Envoy API Gateway ingress URL |
| `CUSTOMER_EMAIL` | `customer@spotq.com` | Customer login email |
| `CUSTOMER_PASSWORD` | `Customer@12345` | Customer login password |
| `TEST_PROFILE` | `load` | Execution profile (`smoke`, `load`, `stress`, `spike`, `soak`) |
| `TEST_TYPE` | `all` | Test target (`all`, `journey`, `auth`, `discovery`, `queue`, `cart`, `orders`, `payments`) |
| `RESTAURANT_ID` | Dynamic / Fallback UUID | Target restaurant ID (auto-discovered during `setup()`) |
| `MENU_ITEM_ID` | Dynamic / Fallback UUID | Target menu item ID (auto-discovered during `setup()`) |

---

## 📊 Reports & SLO Quality Gates

At the end of every test execution, k6 automatically generates:
1. **Interactive HTML Dashboard:** `load-test-report.html` (SpotQ branded visual dashboard with p90/p95/p99 breakdown, latency metrics, and error rates).
2. **Machine-Readable Summary:** `load-test-summary.json` (for CI/CD pipeline automation and telemetry aggregation).
3. **Console Telemetry:** Real-time throughput, status badges, and pass/fail SLO evaluation.
