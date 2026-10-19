import client from 'prom-client';

// Initialize default system metrics (CPU, Memory, Event Loop Lag)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'hackathon_portal_' });

// Custom Prometheus Metrics
export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed by the Hackathon API',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDurationHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export const activeSubmissionsGauge = new client.Gauge({
  name: 'hackathon_active_submissions_count',
  help: 'Current number of submissions undergoing evaluation',
});

export const kubernetesPodStatusGauge = new client.Gauge({
  name: 'k8s_pod_health_status',
  help: 'Current health status of Kubernetes workloads (1 = Healthy, 0 = Degraded)',
  labelNames: ['deployment', 'namespace'],
});

// Set default values for gauges
kubernetesPodStatusGauge.set({ deployment: 'frontend-deployment', namespace: 'hackathon' }, 1);
kubernetesPodStatusGauge.set({ deployment: 'backend-deployment', namespace: 'hackathon' }, 1);

export const register = client.register;
