import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
    @InjectMetric('db_connections_active')
    private readonly dbConnectionsActive: Gauge<string>,
    @InjectMetric('initiative_processes_total')
    private readonly initiativeProcessesTotal: Counter<string>,
    @InjectMetric('initiative_revisions_total')
    private readonly initiativeRevisionsTotal: Counter<string>,
    @InjectMetric('task_generation_duration_seconds')
    private readonly taskGenerationDuration: Histogram<string>,
  ) {}

  incrementHttpRequests(method: string, path: string, status: number) {
    this.httpRequestsTotal.inc({ method, path, status: status.toString() });
  }

  observeHttpRequestDuration(method: string, path: string, duration: number) {
    this.httpRequestDuration.observe({ method, path }, duration);
  }

  setDbConnectionsActive(count: number) {
    this.dbConnectionsActive.set(count);
  }

  incrementInitiativeProcesses(status: string) {
    this.initiativeProcessesTotal.inc({ status });
  }

  incrementInitiativeRevisions(type: string) {
    this.initiativeRevisionsTotal.inc({ type });
  }

  observeTaskGenerationDuration(duration: number) {
    this.taskGenerationDuration.observe(duration);
  }
} 