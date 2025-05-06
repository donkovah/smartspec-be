import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VectorModule } from '../vector/vector.module';
import { InitiativesController } from './initiatives.controller';
import { InitiativesService } from './initiatives.service';
import { DataLoader } from '../vector/data-loader';
import { InitiativesRepository } from './initiatives.repository';
import { InitiativeProcess } from './entities/initiative-process.entity';
import { InitiativeRevision } from './entities/initiative-revision.entity';
import { InitiativesAnalyticsService } from './initiatives-analytics.service';
import { InitiativesAnalyticsController } from './initiatives-analytics.controller';

@Module({
  imports: [
    VectorModule,
    TypeOrmModule.forFeature([InitiativeProcess, InitiativeRevision]),
  ],
  controllers: [InitiativesController, InitiativesAnalyticsController],
  providers: [
    InitiativesRepository,
    InitiativesService,
    DataLoader,
    InitiativesAnalyticsService,
  ],
  exports: [InitiativesService, InitiativesAnalyticsService],
})
export class InitiativesModule {}
