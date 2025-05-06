import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { metricsProviders } from './metrics.config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [PrometheusModule.register()],
  providers: [MetricsService, ...metricsProviders],
  controllers: [MetricsController],
  exports: [MetricsService],
})
export class MetricsModule {} 