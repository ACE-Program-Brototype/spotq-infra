# SpotQ Infrastructure

Infrastructure repository for the **SpotQ** platform — containing DevOps configurations, container orchestration, deployment automation, monitoring, and service environment management.

---

## Folder Structure

```
spotq-infra/
├── docker-compose.yml # Central Docker Compose specification for local and staging
├── terraform/         # Infrastructure as Code (IaC) for cloud provisioning
├── monitoring/        # Monitoring, alerting, and observability configurations
└── README.md
```

| File / Directory     | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `docker-compose.yml` | Multi-container service definitions for local development     |
| `terraform/`         | Cloud resource provisioning (VPC, EKS, RDS, S3, IAM, etc.)    |
| `monitoring/`        | Prometheus, Grafana, Alloy, Loki, Tempo, and Alertmanager     |

---

## Docker Setup

This repository contains the central `docker-compose.yml` configuration at the repository root to orchestrate the entire **SpotQ** platform (microservices, datastores, caching, message queues, API gateway, and observability stack) locally.

### Workspace Layout & Sibling Repositories

The Docker Compose configuration resolves microservice build contexts relative to the repository root (`../spotq-*`). Ensure sibling microservice repositories are checked out side-by-side with `spotq-infra` in the same parent folder:

```
<workspace>/
├── spotq-infra/             # This repository (contains root docker-compose.yml)
├── spotq-api-gateway/       # Envoy API Gateway
├── spotq-user-service/      # User management microservice
├── spotq-restaurant-service/# Restaurant management microservice
├── spotq-order-service/     # Order processing microservice
├── spotq-payment-service/   # Payment processing microservice
├── spotq-queue-service/     # Queue management microservice
└── spotq-ml-eta-service/    # ML ETA prediction microservice
```

### Prerequisites

- **Docker Desktop** installed and running.
- **Infisical CLI** installed and authenticated.
- Reference environment configuration (documented in `.env.example`).

### Running the Services

1. Log in to Infisical:
   ```bash
   infisical login
   ```

2. **Core Microservices Only** (App services, Redis, RabbitMQ, Envoy API Gateway):
   ```bash
   infisical run --env=dev -- docker compose up -d
   ```

3. **Core Microservices + Full Observability Stack** (Grafana, Prometheus, Loki, Tempo, Alloy, Alertmanager):
   ```bash
   infisical run --env=dev -- docker compose --profile monitoring up -d
   ```

4. **Monitoring Stack Only** (Observability components without running microservices):
   ```bash
   infisical run --env=dev -- docker compose --profile monitoring up -d grafana prometheus alloy loki tempo alertmanager
   ```

5. **Stop All Services**:
   ```bash
   docker compose --profile monitoring down
   ```

### Service Ports & Access Points

| Service | Host Port | Purpose & Security Notes |
| :--- | :--- | :--- |
| **API Gateway** | `http://localhost:10000` | Ingress routing to microservices |
| **Envoy Admin** | `http://127.0.0.1:9901` | Admin & metrics interface (strictly bound to `127.0.0.1` for security) |
| **Grafana** | `http://localhost:3006` | Observability dashboards (`admin` / `admin` or `spotq` / `admin`) |
| **Prometheus** | `http://localhost:9090` | Target metrics & scrape status (`/targets`) |
| **Grafana Alloy** | `http://localhost:12345` | OpenTelemetry collector & pipeline dashboard |
| **RabbitMQ Management** | `http://localhost:15672` | AMQP broker management (`guest` / `guest`) |
| **Redis** | `localhost:6379` | Feature store & session caching |

---

## Branching Strategy

This repository follows a **three-branch** workflow:

```
main ← staging ← development
```

| Branch        | Purpose                                | Deploys To       |
| ------------- | -------------------------------------- | ---------------- |
| `main`        | Production-ready infrastructure code   | **Production**   |
| `staging`     | Pre-production validation and testing  | **Staging**      |
| `development` | Active development and feature work    | **Development**  |

### Branch Rules

- **`main`** — Protected. Only accepts merges from `staging` via approved pull requests. Represents the current production state.
- **`staging`** — Protected. Accepts merges from `development` after code review. Used for integration testing before production.
- **`development`** — Default working branch. All feature branches are created from and merged back into `development`.

### Feature Branch Naming

Create feature branches from `development` using the following conventions:

```
feature/<short-description>
fix/<short-description>
hotfix/<short-description>
chore/<short-description>
```

**Examples:**
```
feature/add-redis-deployment
fix/nginx-ingress-config
hotfix/production-env-vars
chore/update-terraform-modules
```

---

## Contribution Guidelines

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/<org>/spotq-infra.git
   cd spotq-infra
   ```
2. Check out the `development` branch:
   ```bash
   git checkout development
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/<your-feature>
   ```

### Pull Request Process

1. **Create a feature branch** from `development`.
2. **Make your changes** and commit with clear, descriptive messages.
3. **Push** your branch and open a **Pull Request** targeting `development`.
4. **Request a review** from at least one team member.
5. **Address feedback** and ensure all checks pass.
6. **Merge** once approved — use **squash merge** to keep history clean.

### Commit Message Convention

Follow this format for commit messages:

```
<type>: <short description>

[optional body]
```

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `ci`, `test`

**Examples:**
```
feat: add kubernetes deployment for auth service
fix: correct environment variable mapping in docker-compose
docs: update README with monitoring setup instructions
ci: add terraform plan step to PR pipeline
```

### Code Review Checklist

- [ ] Changes are scoped to a single concern
- [ ] No secrets or credentials are committed
- [ ] Configurations are parameterized (no hardcoded values)
- [ ] Changes have been tested in the appropriate environment
- [ ] Documentation is updated if applicable

---

## License

This repository is private and proprietary to the SpotQ team. Unauthorized distribution is prohibited.