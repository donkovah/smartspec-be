import { makeCounterProvider, makeHistogramProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus';

export const metricsProviders = [
  makeCounterProvider({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
  }),
  makeHistogramProvider({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'path'],
    buckets: [0.1, 0.5, 1, 2, 5],
  }),
  makeGaugeProvider({
    name: 'db_connections_active',
    help: 'Number of active database connections',
  }),
  makeCounterProvider({
    name: 'initiative_processes_total',
    help: 'Total number of initiative processes',
    labelNames: ['status'],
  }),
  makeCounterProvider({
    name: 'initiative_revisions_total',
    help: 'Total number of initiative revisions',
    labelNames: ['type'],
  }),
  makeHistogramProvider({
    name: 'task_generation_duration_seconds',
    help: 'Task generation duration in seconds',
    buckets: [1, 2, 5, 10, 30],
  }),
]; 