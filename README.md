# SpotQ Infrastructure

Infrastructure repository for the **SpotQ** platform — containing DevOps configurations, container orchestration, deployment automation, monitoring, and service environment management.

---

## Folder Structure

```
spotq-infra/
├── docker-compose/   # Docker Compose files for local and staging environments
├── kubernetes/       # Kubernetes manifests, Helm charts, and cluster configs
├── terraform/        # Infrastructure as Code (IaC) for cloud provisioning
├── monitoring/       # Monitoring, alerting, and observability configurations
├── scripts/          # Utility and automation scripts (CI/CD helpers, setup, etc.)
├── docs/             # Infrastructure documentation, architecture, and operational guides
└── README.md
```

| Directory        | Purpose                                                       |
| ---------------- | ------------------------------------------------------------- |
| `docker-compose/`| Service definitions for local development and staging setups  |
| `kubernetes/`    | K8s deployments, services, ingress, configmaps, and secrets   |
| `terraform/`     | Cloud resource provisioning (VPC, EKS, RDS, S3, IAM, etc.)    |
| `monitoring/`    | Prometheus, Grafana, and alerting rule configurations         |
| `scripts/`       | Deployment scripts, environment bootstrapping, and helpers    |
| `docs/`          | Infrastructure documentation, architecture diagrams, setup guides, runbooks, and operational documentation    |

---

## Docker Setup

This repository contains the central Docker Compose configuration to spin up the entire **SpotQ** platform (microservices, database, caching, queue, and API gateway) locally.

### Prerequisites

- **Docker Desktop** installed and running.
- **Infisical CLI** installed and authenticated.

### Running the Services

1. Log in to Infisical:
   ```bash
   infisical login
   ```

2. Start the services with environment variables injected via Infisical:
   ```bash
   infisical run --env=dev -- docker compose up
   ```

   *To run in detached mode, append the `-d` flag:*
   ```bash
   infisical run --env=dev -- docker compose up -d
   ```

3. Stop the services:
   ```bash
   docker compose down
   ```

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