import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VectorService } from './vector.service';
import { DataLoader } from './data-loader';

@Module({
  imports: [ConfigModule],
  providers: [VectorService, DataLoader],
  exports: [VectorService, DataLoader],
})
export class VectorModule {}
