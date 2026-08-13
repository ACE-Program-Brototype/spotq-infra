logging {
  level  = "info"
  format = "logfmt"
}

discovery.docker "spotq" {
  host = "unix:///var/run/docker.sock"
}

loki.source.docker "spotq" {
  host = "unix:///var/run/docker.sock"

  targets = discovery.docker.spotq.targets

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

prometheus.remote_write "spotq" {
  endpoint {
    url = "http://prometheus:9090/api/v1/write"
  }
}