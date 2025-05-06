import { Controller, Post, Body } from '@nestjs/common';
import { InitiativesService } from './initiatives.service';

@Controller('initiatives')
export class InitiativesController {
  constructor(private readonly initiativesService: InitiativesService) {}

  @Post('convert')
  async convertInitiative(@Body('initiative') initiative: string) {
    return this.initiativesService.convertInitiativeToTasks(initiative);
  }
} 