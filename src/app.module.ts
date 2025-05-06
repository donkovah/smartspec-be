import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InitiativesModule } from './initiatives/initiatives.module';
import { MetricsModule } from './common/metrics.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    InitiativesModule,
    MetricsModule,
  ],
})
export class AppModule {}
