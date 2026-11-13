# SpotQ Platform Admin — Production Grade Load Testing Suite

Production-grade k6 performance and load testing suite designed specifically for the **SpotQ Platform Administrator** surfaces.

This suite is modeled around **Risk-Based Load Testing** principles and real administrative workload patterns, targeting critical multi-service fan-outs, heavy database aggregations, and high-memory streaming operations.

---

## 🎯 Architecture & Blast Radius Under Test

```
                            [k6 Virtual Users]
                                    │
                       (JWT Bearer Auth: Port 10000)
                                    ▼
                         [Envoy API Gateway]
                                    │
      ┌─────────────────────────────┼────────────────────────────┐
      ▼                             ▼                            ▼
[user-service]           [restaurant-service]         [payment-service]
• Admin Auth (Bcrypt)    • Aggregator Dashboard       • Financial Summary & Ledger
• Customer Directory     • Applications & Approvals   • CSV Export (Memory Hazard)
• Session Revocation     • Tenant Management          • Subscribers (S2S Batch)
                                    │
                                    ▼
                             [order-service]
                             • Global Orders Directory
                             • Status Analytics & Metrics
```

---

## 📋 The 9 Critical APIs Tested

| # | Endpoint | Method | Service Target | Performance Hazard / Failure Mechanism |
| :-: | :--- | :-: | :--- | :--- |
| **1** | `/api/v1/restaurants/admin/analytics/dashboard` | `GET` | `restaurant-service` | **Multi-Service Fan-Out:** Queries local DB, `payment-service`, and `user-service`. Evaluates Circuit Breaker tripping and latency under load. |
| **2** | `/api/v1/payments/admin/finance/ledger/export.csv` | `GET` | `payment-service` | **Memory & Event-Loop Hazard:** In-memory unpaginated CSV formatting. Detects V8 heap Out-Of-Memory (OOM) and GC thrashing. |
| **3** | `/api/v1/orders/admin` | `GET` | `order-service` | **Table Scan Hazard:** Multi-column dynamic filtering and text search across the system's largest dataset. Tests composite database indexing. |
| **4** | `/api/v1/payments/admin/finance/summary` | `GET` | `payment-service` | **Aggregation Computation:** Real-time computation of gross margins, subscription revenue, platform fees, and pending disbursements. |
| **5** | `/api/v1/payments/admin/finance/ledger` | `GET` | `payment-service` | **Deep Pagination:** High-cardinality ledger pagination (`OFFSET / LIMIT`) across payment intakes, settlements, and refunds. |
| **6** | `/api/v1/subscribers` | `GET` | `payment-service` | **Cross-Service Batching:** Queries subscriptions and calls `restaurant-service` in batch (`/api/internal/v1/restaurants/batch`) to hydrate tenant metadata. |
| **7** | `/api/v1/admin/restaurants` | `GET` | `restaurant-service` | **Tenant Directory Scan:** Full platform restaurant search with status, city, and onboarding state filters. |
| **8** | `/api/v1/users` *(Admin Auth)* | `GET` | `user-service` | **Auth Table Contention:** Verifies admin user directory searches do not create read-lock contention on active customer auth tables. |
| **9** | `/api/v1/auth/admin/login` | `POST` | `user-service` | **CPU Throttling:** Evaluates Bcrypt/Argon2 password hash verification under concurrent load to prevent `libuv` worker thread starvation. |

---

## 🛠️ Prerequisites

1. **k6 Installed**:
   ```bash
   # macOS
   brew install k6

   # Linux (Debian/Ubuntu)
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update && sudo apt-get install k6
   ```

2. **SpotQ Platform Running**:
   Ensure Docker containers are active via `docker compose up -d` in `spotq-infra`.

3. **Admin Seed Data**:
   Ensure a platform admin account exists (default `admin@spotq.com` / `Admin@12345` or configured via `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

---

## 🚀 Execution Guide

Run commands from the `spotq-infra/load_testing/platform_admin` directory:

```bash
cd spotq-infra/load_testing/platform_admin
```

### 1. Smoke Test (Sanity Verification — 1 VU, 30s)
*Verifies all target endpoints return 200 OK without errors.*
```bash
k6 run -e TEST_PROFILE=smoke main.js
```

### 2. Standard Load Test (Typical Admin Peak Traffic — Ramping to 25 VUs)
*Simulates peak simultaneous administrative sessions navigating dashboards, filtering orders, and reviewing finances.*
```bash
k6 run -e TEST_PROFILE=load main.js
```

### 3. Stress Test (Beyond Peak — Ramping to 80 VUs)
*Pushes the system to identify breaking points, database connection pool exhaustion, and circuit breaker activation.*
```bash
k6 run -e TEST_PROFILE=stress main.js
```

### 4. Spike Test (Sudden Shift / Incident Rush — 60 VUs in 15s)
*Validates API Gateway stability and auto-recovery during sudden traffic bursts.*
```bash
k6 run -e TEST_PROFILE=spike main.js
```

### 5. Soak / Endurance Test (15m Sustained Load)
*Checks for memory leaks, unclosed database cursors, and GC latency over prolonged usage.*
```bash
k6 run -e TEST_PROFILE=soak main.js
```

---

## 🎯 Testing Specific Component Suites

You can isolate and target individual high-risk components using the `-e TEST_TYPE` flag:

```bash
# 1. Stress test the multi-service Analytics Aggregator only
k6 run -e TEST_PROFILE=stress -e TEST_TYPE=dashboard main.js

# 2. Stress test the Financial Ledger CSV Export (memory & heap consumption)
k6 run -e TEST_PROFILE=stress -e TEST_TYPE=export main.js

# 3. Stress test the Orders database with deep pagination and dynamic filters
k6 run -e TEST_PROFILE=stress -e TEST_TYPE=orders main.js

# 4. Run the complete human-like Admin browsing journey (default)
k6 run -e TEST_PROFILE=load -e TEST_TYPE=workflow main.js
```

---

## ⚙️ Environment Configuration

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `BASE_URL` | `http://localhost:10000` | Envoy API Gateway ingress URL |
| `ADMIN_EMAIL` | `admin@spotq.com` | Platform Administrator login email |
| `ADMIN_PASSWORD` | `Admin@12345` | Platform Administrator login password |
| `TEST_PROFILE` | `load` | Execution profile (`smoke`, `load`, `stress`, `spike`, `soak`) |
| `TEST_TYPE` | `workflow` | Test target (`workflow`, `dashboard`, `export`, `orders`, `all`) |

*Example targeting a staging cluster with custom credentials:*
```bash
k6 run \
  -e BASE_URL="https://api-staging.spotq.com" \
  -e ADMIN_EMAIL="superadmin@spotq.com" \
  -e ADMIN_PASSWORD="SuperSecretPassword#2026" \
  -e TEST_PROFILE="load" \
  main.js
```

---

## 📊 Reports & SLO Quality Gates

At the end of every test execution, k6 generates:
1. **HTML Executive Report:** `load-test-report.html` (viewable in any web browser with interactive tables, p95/p99 breakdown, and error distribution).
2. **Machine-Readable Summary:** `load-test-summary.json` (for CI/CD reporting and Prometheus ingestion).
3. **Console Telemetry:** Real-time throughput and pass/fail SLO evaluation.

### Service-Level Objectives (SLOs)
* Global Failure Rate: `< 1%`
* Dashboard Aggregator p95: `< 800ms` (p99 `< 1500ms`)
* Orders Filter Search p95: `< 450ms`
* Finance Summary p95: `< 500ms`
* CSV Export p95: `< 3000ms`
* Admin Login p95: `< 400ms`
