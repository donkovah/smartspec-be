import { Module } from '@nestjs/common';
import { VectorModule } from '../vector/vector.module';
import { InitiativesController } from './initiatives.controller';
import { InitiativesService } from './initiatives.service';


@Module({
  imports: [VectorModule],
  controllers: [InitiativesController],
  providers: [InitiativesService],
  exports: [InitiativesService],
})
export class InitiativesModule {} 