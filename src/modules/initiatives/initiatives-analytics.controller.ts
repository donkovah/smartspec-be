import { Controller, Get, Query, ParseIntPipe, ParseDatePipe } from '@nestjs/common';
import { InitiativesAnalyticsService } from './initiatives-analytics.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InitiativesService } from './initiatives.service';
import { MetricsService } from '../metrics/metrics.service';

@ApiTags('initiatives-analytics')
@Controller('initiatives/analytics')
export class InitiativesAnalyticsController {
  constructor(
    private readonly analyticsService: InitiativesAnalyticsService,
    private readonly initiativesService: InitiativesService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get process metrics for a date range' })
  @ApiQuery({ name: 'startDate', type: Date, required: true })
  @ApiQuery({ name: 'endDate', type: Date, required: true })
  async getProcessMetrics(
    @Query('startDate', ParseDatePipe) startDate: Date,
    @Query('endDate', ParseDatePipe) endDate: Date,
  ) {
    return this.analyticsService.getProcessMetrics(startDate, endDate);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get process trends for the last N days' })
  @ApiQuery({ name: 'days', type: Number, required: true })
  async getProcessTrends(@Query('days', ParseIntPipe) days: number) {
    return this.analyticsService.getProcessTrends(days);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get process performance metrics' })
  async getProcessPerformanceMetrics() {
    return this.analyticsService.getProcessPerformanceMetrics();
  }

  @Get('status')
  async getStatusAnalytics() {
    const analytics = await this.analyticsService.getStatusAnalytics();
    this.metricsService.observeInitiativeStatus(analytics);
    return analytics;
  }

  @Get('revisions')
  async getRevisionAnalytics() {
    const analytics = await this.analyticsService.getRevisionAnalytics();
    this.metricsService.observeInitiativeRevisions(analytics);
    return analytics;
  }

  @Get('tasks')
  async getTaskAnalytics() {
    const analytics = await this.analyticsService.getTaskAnalytics();
    this.metricsService.observeInitiativeTasks(analytics);
    return analytics;
  }

  @Get('processes')
  async getProcessAnalytics() {
    const analytics = await this.analyticsService.getProcessAnalytics();
    this.metricsService.observeInitiativeProcesses(analytics);
    return analytics;
  }

  @Get('trends')
  async getTrendAnalytics(@Query('days') days: number = 30) {
    const analytics = await this.analyticsService.getTrendAnalytics(days);
    this.metricsService.observeInitiativeTrends(analytics);
    return analytics;
  }
} 