# SpotQ Staff API Load Testing (k6)

This directory contains the production-grade **k6 load testing suite** for the **SpotQ Staff Interface**.

---

## 📁 Directory Structure

```text
spotq-infra/load_testing/staff/
├── config/
│   ├── environments.js    # API endpoints & gateway URLs (http://localhost:10000)
│   ├── stages.js          # Ascending VU levels (10 -> 25 -> 50 -> 100)
│   └── thresholds.js      # SLAs (p95 < 400ms, error rate < 1%)
├── data/
│   └── staff-credentials.json # Your real DB staff credentials & restaurantId
├── lib/
│   ├── auth.js            # Automated login & token pool generator
│   ├── headers.js         # Header builder with Bearer JWT
│   ├── helpers.js         # Pacing, think time, random data helpers
│   └── metrics.js         # Custom k6 latency Trends & Counter metrics
├── scenarios/
│   ├── 01_live_queue.js   # Live queue polling, walk-in registration, ringing
│   ├── 02_table_turnover.js # Floor table layout & status updates
│   ├── 03_kitchen_orders.js # Kitchen order feed & status progression
│   ├── 04_staff_full_journey.js # End-to-end multi-role staff shift simulation
│   └── 05_auth_stress.js  # Dedicated login & rate limiter benchmark
└── README.md
```

---

## 🚀 Quick Start Guide

### Step 1: Configure Your Real Staff Credentials
Open `data/staff-credentials.json` and enter your actual `restaurantId` (UUID) and 1 or more staff email/password pairs from your database:

```json
{
  "restaurantId": "your-restaurant-uuid-from-db",
  "staff": [
    {
      "email": "staff1@restaurant.com",
      "password": "Password123!"
    }
  ]
}
```

> **Tip:** You only need 1 to 5 staff accounts in the DB. k6 will authenticate them once in `setup()` and distribute tokens evenly across all 10, 25, 50, or 100 Virtual Users!

---

### Step 2: Run a Smoke Test (Verify Everything Works)
Before blasting high VUs, run a quick **30-second smoke test** with **1 VU** to verify that your Docker Compose services and Envoy gateway are reachable:

```powershell
cd spotq-infra/load_testing/staff
k6 run -e PROFILE=smoke scenarios/01_live_queue.js
```

---

### Step 3: Run the Ascending Staged Load Test (10 ➔ 25 ➔ 50 ➔ 100 VUs)
To execute the gradual ramp-up test:

```powershell
# Default ascending profile (2-minute plateau per tier)
k6 run scenarios/01_live_queue.js

# Or run the fast ascending profile (45 seconds per tier)
k6 run -e PROFILE=fast scenarios/01_live_queue.js
```

---

## 🎯 Available Scenarios

| Scenario Script | Focus Area | Simulated Real-world Actions |
|---|---|---|
| `scenarios/01_live_queue.js` | **Queue Service** | Hostess polling live queue, creating walk-in guests, ringing waiting parties |
| `scenarios/02_table_turnover.js` | **Restaurant Service** | Floor staff checking floor tables, marking tables available/cleaning |
| `scenarios/03_kitchen_orders.js` | **Order Service** | Kitchen Display System (KDS) order feed, viewing order details, advancing status |
| `scenarios/04_staff_full_journey.js` | **Full End-to-End Shift** | Unified test: 40% Hostesses, 30% Kitchen staff, 30% Floor staff simultaneously |
| `scenarios/05_auth_stress.js` | **Auth & Rate Limiting** | Dedicated staff login stress test |

---

## ⚙️ Advanced CLI Options

You can override parameters on the fly without changing the code:

```powershell
# Custom Base URL (if Envoy runs on a different port or host)
k6 run -e BASE_URL=http://localhost:10000 scenarios/01_live_queue.js

# Custom Stage Duration (e.g. hold each VU tier for 3 minutes)
k6 run -e STAGE_DURATION=3m scenarios/04_staff_full_journey.js

# Pass a pre-generated token directly (skips login step entirely)
k6 run -e STAFF_TOKEN="eyJhbGciOi..." -e RESTAURANT_ID="uuid" scenarios/01_live_queue.js
```

---

## 📊 Understanding k6 Metrics & Results

When a test completes, look at the summary report:

1. **`http_req_duration`**:
   - `p(95)`: 95% of staff requests completed faster than this time. Target: `< 400ms`.
   - `p(99)`: 99% of requests completed faster than this time. Target: `< 800ms`.
2. **`http_req_failed`**:
   - Total failure rate. Target: `< 1%`.
3. **`order_table_conflict_409_rate`**:
   - Measures how many concurrent requests attempted to update the same order or table at the exact same time.

