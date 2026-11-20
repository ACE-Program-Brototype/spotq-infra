logging {
  level  = "info"
  format = "logfmt"
}

discovery.docker "spotq" {
  host = "unix:///var/run/docker.sock"
}

discovery.relabel "spotq" {
  targets = discovery.docker.spotq.targets

  rule {
    source_labels = ["__meta_docker_container_name"]
    regex         = "/?(.*)"
    target_label  = "container"
  }

  rule {
    source_labels = ["__meta_docker_container_label_com_docker_compose_service"]
    target_label  = "service"
  }
}

loki.source.docker "spotq" {
  host = "unix:///var/run/docker.sock"

  targets = discovery.relabel.spotq.output

  labels = {
    platform = "spotq",
  }

  forward_to = [
    loki.write.spotq.receiver,
  ]
}

loki.write "spotq" {
  endpoint {
    url = "http://loki:3100/loki/api/v1/push"
  }
}

prometheus.scrape "spotq" {
  targets = [
    {
      "__address__"      = "api-gateway:9901",
      "__metrics_path__" = "/stats/prometheus",
      "service"          = "api-gateway",
    },
    {
      "__address__" = "user-service:3000",
      "service"     = "user-service",
    },
    {
      "__address__" = "restaurant-service:3001",
      "service"     = "restaurant-service",
    },
    {
      "__address__" = "order-service:3002",
      "service"     = "order-service",
    },
    {
      "__address__" = "payment-service:3003",
      "service"     = "payment-service",
    },
    {
      "__address__" = "queue-service:3004",
      "service"     = "queue-service",
    },
    {
      "__address__" = "ml-eta-service:8000",
      "service"     = "ml-eta-service",
    },
  ]

  forward_to = [
    prometheus.remote_write.spotq.receiver,
  ]
}

prometheus.exporter.redis "spotq" {
  redis_addr = "redis:6379"
}

prometheus.scrape "redis" {
  targets = prometheus.exporter.redis.spotq.targets

  forward_to = [
    prometheus.remote_write.spotq.receiver,
  ]
}

prometheus.remote_write "spotq" {
  endpoint {
    url = "http://prometheus:9090/api/v1/write"
  }
}