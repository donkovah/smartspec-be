import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InitiativesModule } from './modules/initiatives/initiatives.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { VectorModule } from './modules/vector/vector.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    InitiativesModule,
    TasksModule,
    VectorModule,
  ],
})
export class AppModule {}
