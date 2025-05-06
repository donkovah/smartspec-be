import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InitiativesModule } from './modules/initiatives/initiatives.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { VectorModule } from './modules/vector/vector.module';
import { JiraModule } from './modules/jira/jira.module';
import { QdrantModule } from './modules/qdrant/qdrant.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { metricsProviders } from './modules/metrics/metrics.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_DATABASE ?? 'smartspec',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    InitiativesModule,
    MetricsModule,
    VectorModule,
    JiraModule,
    QdrantModule,
  ],
  providers: metricsProviders,
})
export class AppModule {}
