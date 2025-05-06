import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

interface MetricsConfig {
  prefix: string;
  defaultLabels: Record<string, string>;
  enabled: boolean;
}

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;
  private readonly prefix: string;

  // API Metrics
  public apiRequestsTotal: Counter;
  public apiRequestDuration: Histogram;
  public apiRequestsInProgress: Gauge;

  // OpenAI Metrics
  public openaiRequestsTotal: Counter;
  public openaiTokensTotal: Counter;
  public openaiRequestDuration: Histogram;
  public openaiRequestsInProgress: Gauge;

  // Qdrant Metrics
  public qdrantOperationsTotal: Counter;
  public qdrantOperationDuration: Histogram;
  public qdrantOperationsInProgress: Gauge;
  public qdrantCollectionSize: Gauge;

  // Business Metrics
  public initiativesTotal: Counter;
  public tasksGeneratedTotal: Counter;
  public averageTasksPerInitiative: Gauge;
  public averageStoryPoints: Gauge;

  constructor(private readonly configService: ConfigService) {
    this.registry = new Registry();
    const metricsConfig = this.configService.get<MetricsConfig>('metrics');
    this.prefix = metricsConfig?.prefix ?? 'smartspec_';
    const defaultLabels = metricsConfig?.defaultLabels ?? {};
    this.registry.setDefaultLabels(defaultLabels);

    this.initializeMetrics();
  }

  onModuleInit(): void {
    // Start collecting default metrics
    if (this.configService.get('metrics.enabled', true)) {
      collectDefaultMetrics({ register: this.registry });
    }
  }

  private initializeMetrics(): void {
    // API Metrics
    this.apiRequestsTotal = new Counter({
      name: `${this.prefix}api_requests_total`,
      help: 'Total number of API requests',
      labelNames: ['method', 'path', 'status'],
    });

    this.apiRequestDuration = new Histogram({
      name: `${this.prefix}api_request_duration_seconds`,
      help: 'API request duration in seconds',
      labelNames: ['method', 'path'],
    });

    this.apiRequestsInProgress = new Gauge({
      name: `${this.prefix}api_requests_in_progress`,
      help: 'Number of API requests in progress',
      labelNames: ['method'],
    });

    // OpenAI Metrics
    this.openaiRequestsTotal = new Counter({
      name: `${this.prefix}openai_requests_total`,
      help: 'Total number of OpenAI API requests',
      labelNames: ['model', 'status'],
    });

    this.openaiTokensTotal = new Counter({
      name: `${this.prefix}openai_tokens_total`,
      help: 'Total number of tokens used in OpenAI requests',
      labelNames: ['model', 'type'],
    });

    this.openaiRequestDuration = new Histogram({
      name: `${this.prefix}openai_request_duration_seconds`,
      help: 'OpenAI request duration in seconds',
      labelNames: ['model'],
    });

    // Qdrant Metrics
    this.qdrantOperationsTotal = new Counter({
      name: `${this.prefix}qdrant_operations_total`,
      help: 'Total number of Qdrant operations',
      labelNames: ['operation', 'collection', 'status'],
    });

    this.qdrantOperationDuration = new Histogram({
      name: `${this.prefix}qdrant_operation_duration_seconds`,
      help: 'Qdrant operation duration in seconds',
      labelNames: ['operation', 'collection'],
    });

    this.qdrantCollectionSize = new Gauge({
      name: `${this.prefix}qdrant_collection_size`,
      help: 'Number of points in Qdrant collection',
      labelNames: ['collection'],
    });

    // Business Metrics
    this.initiativesTotal = new Counter({
      name: `${this.prefix}initiatives_total`,
      help: 'Total number of initiatives processed',
    });

    this.tasksGeneratedTotal = new Counter({
      name: `${this.prefix}tasks_generated_total`,
      help: 'Total number of tasks generated',
    });

    this.averageTasksPerInitiative = new Gauge({
      name: `${this.prefix}average_tasks_per_initiative`,
      help: 'Average number of tasks per initiative',
    });

    this.averageStoryPoints = new Gauge({
      name: `${this.prefix}average_story_points`,
      help: 'Average story points per task',
    });

    // Register all metrics
    [
      this.apiRequestsTotal,
      this.apiRequestDuration,
      this.apiRequestsInProgress,
      this.openaiRequestsTotal,
      this.openaiTokensTotal,
      this.openaiRequestDuration,
      this.qdrantOperationsTotal,
      this.qdrantOperationDuration,
      this.qdrantCollectionSize,
      this.initiativesTotal,
      this.tasksGeneratedTotal,
      this.averageTasksPerInitiative,
      this.averageStoryPoints,
    ].forEach((metric) => this.registry.registerMetric(metric));
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
