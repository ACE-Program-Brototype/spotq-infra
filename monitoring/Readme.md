# SpotQ Monitoring

Centralized observability configuration for the SpotQ platform.

This module provides the infrastructure required to collect, store, visualize, and analyze **metrics, logs, and distributed traces** across SpotQ services.

The observability platform is designed to provide a single monitoring interface through Grafana while keeping the underlying telemetry systems independently responsible for metrics, logs, and traces.

---

## 1. Overview

The SpotQ monitoring platform is built using the Grafana observability stack:

* **Grafana** — Visualization and observability interface
* **Prometheus** — Metrics collection and storage
* **Loki** — Log aggregation and storage
* **Grafana Tempo** — Distributed trace storage
* **Grafana Alloy** — Telemetry collection and processing
* **Alertmanager** — Alert management and routing

The platform provides:

* Centralized metrics
* Centralized logs
* Distributed tracing
* Metrics, logs, and trace correlation
* Infrastructure health monitoring
* Application performance visibility
* Initial alerting capabilities
* Persistent monitoring data
* Provisioned Grafana datasources and dashboards

---

# 2. Architecture

```text
                         SPOTQ SERVICES
                              │
              ┌───────────────┼───────────────┐
              │               │               │
           Metrics           Logs           Traces
              │               │               │
              │               ▼               │
              │            Alloy ◄────────────┘
              │               │
              │        ┌──────┴──────┐
              │        │             │
              │        ▼             ▼
              │       Loki          Tempo
              │        │             │
              │        │             │
              ▼        ▼             ▼
          Prometheus ────────────────┐
              │                      │
              └──────────┬───────────┘
                         ▼
                      Grafana
                         │
             ┌───────────┼───────────┐
             │           │           │
          Metrics       Logs       Traces
```

Grafana acts as the centralized interface through which developers and operators can explore all three telemetry signals.

---

# 3. Observability Signals

The platform follows the three primary observability signals.

## 3.1 Metrics

Metrics provide numerical measurements of system and application behavior.

Examples:

* Request rate
* Request latency
* Error rate
* CPU utilization
* Memory utilization
* Container health
* Container restart count
* Service availability

Metrics are collected and stored by Prometheus.

```text
Service
   │
   │ /metrics
   ▼
Prometheus
   │
   ▼
Grafana
```

---

## 3.2 Logs

Logs provide detailed information about events occurring inside applications and infrastructure.

Examples:

* Application errors
* HTTP requests
* Authentication events
* Database errors
* Worker failures
* Infrastructure events

Logs are collected by Grafana Alloy and forwarded to Loki.

```text
Docker Container
       │
       ▼
     Alloy
       │
       ▼
      Loki
       │
       ▼
    Grafana
```

---

## 3.3 Distributed Traces

Distributed traces provide end-to-end visibility into requests travelling across multiple services.

Traces contain:

* Trace ID
* Span ID
* Service name
* Operation name
* Duration
* Parent-child relationships
* Span attributes
* Errors

The platform uses OpenTelemetry Protocol (OTLP) for trace ingestion.

```text
Application
     │
     │ OTLP
     ▼
   Alloy
     │
     ▼
   Tempo
     │
     ▼
  Grafana
```

Supported OTLP protocols:

* OTLP gRPC
* OTLP HTTP

---

# 4. Components

## 4.1 Grafana

Grafana is the central observability interface.

Responsibilities:

* Metrics visualization
* Log exploration
* Trace exploration
* Dashboard management
* Alert visualization
* Metrics/logs/traces correlation

Configured datasources:

* Prometheus
* Loki
* Tempo

Grafana configuration is provisioned through files stored in this repository.

---

## 4.2 Prometheus

Prometheus is responsible for collecting and storing metrics.

Responsibilities:

* Metrics scraping
* Target health monitoring
* Metrics storage
* PromQL querying
* Alert rule evaluation

Initial monitoring targets include:

* Prometheus
* Grafana
* Loki
* Tempo
* Grafana Alloy

Application services will be integrated in subsequent service-level observability stories.

---

## 4.3 Loki

Loki provides centralized log aggregation.

Responsibilities:

* Log ingestion
* Log storage
* Log querying
* Log retention
* Service-based log filtering

Logs are collected by Grafana Alloy and forwarded to Loki.

Loki uses labels to organize logs while avoiding unnecessary high-cardinality indexing.

---

## 4.4 Grafana Tempo

Tempo provides distributed trace storage and querying.

Responsibilities:

* OTLP trace ingestion
* Trace storage
* Trace querying
* Trace visualization
* Trace-to-log correlation

Tempo supports:

```text
OTLP gRPC
OTLP HTTP
```

Application services will send OpenTelemetry traces to the telemetry collection layer.

---

## 4.5 Grafana Alloy

Grafana Alloy acts as the centralized telemetry collection and processing layer.

Responsibilities include:

* Collecting container logs
* Receiving OpenTelemetry telemetry
* Processing telemetry
* Forwarding logs to Loki
* Forwarding traces to Tempo
* Supporting future telemetry pipelines

Alloy provides a centralized point for telemetry processing before data reaches the backend observability systems.

---

## 4.6 Alertmanager

Alertmanager manages alerts generated by Prometheus.

Responsibilities:

* Receiving alerts
* Grouping alerts
* Deduplicating alerts
* Routing alerts
* Managing alert state

Initial alerting focuses on monitoring infrastructure health.

External notification integrations such as Slack, email, or PagerDuty are intentionally deferred to future stories.

---

# 5. Repository Structure

```text
monitoring/
│
├── grafana/
│   ├── dashboards/
│   │   ├── infrastructure-overview.json
│   │   ├── application-metrics.json
│   │   ├── application-logs.json
│   │   └── distributed-tracing.json
│   │
│   ├── provisioning/
│   │   ├── dashboards/
│   │   │   └── dashboards.yml
│   │   │
│   │   └── datasources/
│   │       └── datasources.yml
│   │
│   └── grafana.ini
│
├── prometheus/
│   ├── prometheus.yml
│   └── rules/
│       └── monitoring-alerts.yml
│
├── loki/
│   └── config.yaml
│
├── tempo/
│   └── tempo.yaml
│
├── alloy/
│   └── config.alloy
│
├── alertmanager/
│   └── alertmanager.yml
│
└── README.md
```

---

# 6. Grafana Configuration

Grafana configuration is maintained under:

```text
grafana/
```

## Datasource Provisioning

Datasources are automatically provisioned rather than manually configured through the Grafana UI.

Configured datasources:

```text
Prometheus
Loki
Tempo
```

This ensures that the monitoring environment can be recreated consistently.

---

# 7. Dashboard Provisioning

Dashboards are stored as configuration files and provisioned automatically.

Initial dashboards:

### Infrastructure Overview

Provides visibility into:

* CPU usage
* Memory usage
* Disk usage
* Network usage
* Container status
* Container restart count
* Monitoring service health

### Application Metrics

Provides visibility into:

* Request rate
* Response latency
* Error rate
* Active requests
* HTTP status codes
* Service availability

Application-specific metrics will become available as SpotQ services integrate with Prometheus.

### Application Logs

Provides visibility into:

* Log search
* Service filtering
* Log-level filtering
* Container filtering
* Live log exploration
* Trace ID correlation

### Distributed Tracing

Provides visibility into:

* Trace search
* Trace timelines
* Request waterfall
* Span details
* Service dependencies
* Trace-to-log correlation

---

# 8. Prometheus Configuration

Prometheus configuration is stored under:

```text
prometheus/
```

The configuration defines:

* Scrape interval
* Scrape timeout
* Monitoring targets
* Metrics retention
* Alert rule files

Initial targets:

```text
Prometheus
Grafana
Loki
Tempo
Grafana Alloy
```

Future SpotQ services can be added once they expose compatible metrics endpoints.

---

# 9. Loki Configuration

Loki configuration is stored under:

```text
loki/
```

Loki is configured for:

* Local filesystem storage
* Log ingestion
* Log querying
* Retention
* Persistent data storage

Grafana Alloy is responsible for forwarding collected logs to Loki.

---

# 10. Tempo Configuration

Tempo configuration is stored under:

```text
tempo/
```

Tempo is configured for:

* Local trace storage
* Persistent storage
* OTLP gRPC ingestion
* OTLP HTTP ingestion
* Trace querying
* Trace retention

---

# 11. Alloy Configuration

Alloy configuration is stored under:

```text
alloy/
```

Alloy acts as the telemetry collection layer.

The initial configuration is responsible for collecting monitoring-related telemetry.

Future SpotQ services can be integrated by adding appropriate telemetry pipelines.

---

# 12. Alerting

The initial alerting foundation monitors the health of the observability platform and infrastructure.

Initial alert categories include:

* Grafana unavailable
* Prometheus unavailable
* Loki unavailable
* Tempo unavailable
* High CPU utilization
* High memory utilization
* Container restart detection
* Monitoring pipeline failures

Alerts are evaluated by Prometheus and managed by Alertmanager.

```text
Prometheus
     │
     │ Alert Rules
     ▼
Alertmanager
     │
     ▼
Future Notification Channels
```

Notification channels are intentionally outside the scope of the initial implementation.

---

# 13. Persistence

Monitoring data must survive container or service restarts.

Persistent storage is required for:

* Grafana
* Prometheus
* Loki
* Tempo

Persistence configuration depends on the deployment environment.

For local development, persistent volumes are expected to be provided by the infrastructure orchestration layer.

For production Kubernetes deployments, persistent storage should use an appropriate persistent volume/storage class.

---

# 14. Security

Sensitive configuration must not be committed directly to the repository.

Examples of sensitive values:

* Grafana admin password
* API credentials
* External notification credentials
* Cloud credentials
* Authentication tokens

Credentials should be injected through the approved SpotQ secret-management mechanism.

Do not commit:

```text
.env
passwords
API keys
tokens
private keys
credentials
```

Grafana administrator credentials must be provided through environment variables or the organization's approved secret-management platform.

---

# 15. Local Development

The monitoring configuration is designed to be consumed by the SpotQ infrastructure orchestration layer.

Docker Compose orchestration is maintained by the dedicated Docker Compose infrastructure story and is not duplicated inside this module.

Once the orchestration layer is available, the monitoring stack should be started using the commands defined by that deployment configuration.

Typical workflow:

```bash
docker compose up -d
```

Check service status:

```bash
docker compose ps
```

View service logs:

```bash
docker compose logs -f <service>
```

Stop the stack:

```bash
docker compose down
```

Persistent volumes should not be removed unless the monitoring data needs to be reset.

---

# 16. Access

The exact access URLs depend on the deployment environment.

Typical local development endpoints include:

| Component    | Default Port |
| ------------ | -----------: |
| Grafana      |         3000 |
| Prometheus   |         9090 |
| Loki         |         3100 |
| Tempo        |         3200 |
| Alertmanager |         9093 |

These ports may be changed by the infrastructure orchestration configuration.

Grafana is the primary interface for day-to-day observability.

---

# 17. Verification

After deployment, verify each component independently.

## Grafana

Verify:

* Grafana is reachable
* Login works
* Datasources are provisioned
* Dashboards are available

## Prometheus

Verify:

* Prometheus is reachable
* Targets are healthy
* Metrics are queryable
* Alert rules are loaded

## Loki

Verify:

* Loki is reachable
* Logs are being ingested
* Logs can be queried from Grafana

## Tempo

Verify:

* Tempo is reachable
* OTLP endpoints are available
* Traces are queryable from Grafana

## Alloy

Verify:

* Alloy starts successfully
* Configuration loads without errors
* Telemetry pipelines are operational
* Logs/traces are forwarded successfully

## Alertmanager

Verify:

* Alertmanager starts successfully
* Prometheus can communicate with Alertmanager
* Alert rules are evaluated
* Alerts appear in Alertmanager

---

# 18. Adding a New SpotQ Service

When a new SpotQ service is integrated with the observability platform, it should provide the following telemetry capabilities.

## Metrics

Expose application metrics through a Prometheus-compatible metrics endpoint.

Recommended metrics include:

```text
HTTP request count
HTTP request duration
HTTP error count
Active requests
Database operation metrics
Queue/worker metrics
```

---

## Logs

Applications should produce structured logs.

Recommended fields include:

```text
timestamp
level
service
environment
message
request_id
trace_id
span_id
```

Example:

```json
{
  "level": "error",
  "service": "order-service",
  "message": "Failed to create order",
  "trace_id": "example-trace-id"
}
```

---

## Distributed Tracing

Applications should use OpenTelemetry for distributed tracing.

Tracing should capture:

* Incoming HTTP requests
* Outgoing HTTP requests
* Database operations
* External service calls
* Queue operations
* Important business operations

Trace context should be propagated across service boundaries.

---

# 19. Telemetry Correlation

The observability platform is designed to correlate the three telemetry signals.

```text
                    Request
                       │
                       ▼
                    Metrics
                       │
                       │
                       ▼
                      Logs
                       │
                    trace_id
                       │
                       ▼
                     Trace
```

A developer should be able to move from:

```text
Metric
   ↓
Service
   ↓
Log
   ↓
Trace ID
   ↓
Distributed Trace
```

This enables faster root-cause analysis.

---

# 20. Recommended Logging Standards

SpotQ services should use structured logging.

Recommended log levels:

```text
DEBUG
INFO
WARN
ERROR
```

Production services should avoid excessive `DEBUG` logging unless explicitly enabled.

Logs should avoid sensitive information such as:

* Passwords
* Authentication tokens
* Payment credentials
* Personal secrets
* Database credentials

---

# 21. Recommended Metric Naming

Metrics should use consistent names across SpotQ services.

Examples:

```text
http_requests_total
http_request_duration_seconds
http_requests_active
http_errors_total
```

Application-specific metrics should clearly identify:

* Service
* Operation
* Status
* Relevant non-high-cardinality dimensions

Avoid using highly dynamic values such as user IDs, order IDs, or request IDs as metric labels.

---

# 22. Troubleshooting

## Grafana Cannot Reach Prometheus

Check:

1. Prometheus is running.
2. Prometheus is reachable from Grafana.
3. The datasource URL is correct.
4. Prometheus is accepting requests.

---

## Logs Are Not Appearing

Check:

1. Alloy is running.
2. Alloy can access container logs.
3. Alloy configuration is valid.
4. Loki is running.
5. Alloy can reach Loki.
6. Loki is accepting log ingestion.

---

## Traces Are Not Appearing

Check:

1. Application OpenTelemetry configuration.
2. OTLP endpoint configuration.
3. Alloy OTLP receiver.
4. Alloy-to-Tempo forwarding.
5. Tempo ingestion endpoints.
6. Grafana Tempo datasource configuration.

---

## Metrics Are Not Available

Check:

1. Target service is running.
2. Metrics endpoint is available.
3. Prometheus can reach the target.
4. Target is configured in Prometheus.
5. Target appears healthy in Prometheus.

---

## Alerts Are Not Triggering

Check:

1. Alert rules are loaded.
2. Prometheus is evaluating the rules.
3. The alert expression is producing the expected result.
4. The configured `for` duration has elapsed.
5. Prometheus can reach Alertmanager.

---

# 23. Operational Guidelines

The monitoring platform should follow these principles:

### Consistency

All SpotQ services should follow common telemetry conventions.

### Low Cardinality

Avoid high-cardinality metric labels.

### Structured Logging

Use machine-readable structured logs.

### Trace Propagation

Propagate trace context across service boundaries.

### Secure Configuration

Never store credentials in Git.

### Persistent Storage

Monitoring data should use persistent storage appropriate for the environment.

### Observability by Default

New SpotQ services should integrate metrics, logs, and tracing as part of their development lifecycle.

---

# 24. Scope

This monitoring module establishes the centralized observability foundation for SpotQ.

### Included

* Grafana
* Prometheus
* Loki
* Grafana Tempo
* Grafana Alloy
* Alertmanager
* Metrics collection
* Log collection
* Distributed tracing support
* Grafana datasource provisioning
* Dashboard provisioning
* Initial alerting
* Persistence configuration
* Observability documentation

### Excluded

The following are handled by separate infrastructure or service stories:

* Docker Compose orchestration
* Kubernetes deployment
* Terraform infrastructure
* Cloud infrastructure provisioning
* Application-specific telemetry instrumentation
* External notification channels
* Production high-availability architecture
* Long-term centralized object storage
* Advanced incident management

---

# 25. Future Improvements

The monitoring platform can be extended with:

* Kubernetes service discovery
* Kubernetes node and pod monitoring
* OpenTelemetry Collector scaling
* Cloud object storage for Loki
* Cloud object storage for Tempo
* High-availability Prometheus
* Alert notification integrations
* Slack notifications
* Email notifications
* PagerDuty integration
* SLO/SLI monitoring
* Synthetic monitoring
* Advanced service dependency dashboards
* Application-specific dashboards
* Business metrics
* Cost monitoring
* Security event monitoring

---

# 26. Definition of Done

The monitoring implementation is considered complete when:

* [ ] Grafana configuration is available.
* [ ] Prometheus configuration is available.
* [ ] Loki configuration is available.
* [ ] Tempo configuration is available.
* [ ] Alloy configuration is available.
* [ ] Alertmanager configuration is available.
* [ ] Grafana datasources are provisioned.
* [ ] Initial dashboards are available.
* [ ] Initial alert rules are configured.
* [ ] Persistent storage is supported.
* [ ] Metrics can be visualized in Grafana.
* [ ] Logs can be explored in Grafana.
* [ ] Distributed traces can be explored in Grafana.
* [ ] Metrics, logs, and traces can be correlated where supported.
* [ ] Monitoring architecture is documented.
* [ ] Future service integration is documented.
* [ ] Security and secret-management practices are documented.
* [ ] Troubleshooting guidance is available.

---

# 27. Ownership

The monitoring configuration is maintained as part of the `spotq-infra` repository.

Changes to the monitoring platform should follow the SpotQ infrastructure contribution and review process.

All significant changes should be reviewed before being merged into the shared infrastructure branches.

---

## Summary

The SpotQ monitoring platform provides a centralized observability foundation using:

```text
Grafana
   │
   ├── Prometheus → Metrics
   ├── Loki       → Logs
   └── Tempo      → Traces

Grafana Alloy → Telemetry Collection

Alertmanager → Alert Management
```

The platform is designed to support current infrastructure monitoring while providing a scalable foundation for future SpotQ microservices.

As new services are developed, they should integrate with this platform using standardized metrics, structured logs, and OpenTelemetry traces.
