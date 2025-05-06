import { Module } from '@nestjs/common';
import { VectorModule } from '../vector/vector.module';
import { InitiativesController } from './initiatives.controller';
import { InitiativesService } from './initiatives.service';
import { DataLoader } from '../vector/data-loader';

@Module({
  imports: [VectorModule],
  controllers: [InitiativesController],
  providers: [InitiativesService, DataLoader],
  exports: [InitiativesService],
})
export class InitiativesModule {}
