import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InitiativeProcess } from './entities/initiative-process.entity';
import { InitiativeRevision } from './entities/initiative-revision.entity';

@Injectable()
export class InitiativesRepository {
  constructor(
    @InjectRepository(InitiativeProcess)
    private readonly processRepository: Repository<InitiativeProcess>,
    @InjectRepository(InitiativeRevision)
    private readonly revisionRepository: Repository<InitiativeRevision>,
  ) {}

  async save(process: InitiativeProcess): Promise<void> {
    await this.processRepository.save(process);
  }

  async findById(id: string): Promise<InitiativeProcess | null> {
    return this.processRepository.findOne({
      where: { id },
      relations: ['revisions'],
    });
  }

  async findAll(): Promise<InitiativeProcess[]> {
    return this.processRepository.find({
      relations: ['revisions'],
    });
  }

  async findByStatus(status: InitiativeProcess['status']): Promise<InitiativeProcess[]> {
    return this.processRepository.find({
      where: { status },
      relations: ['revisions'],
    });
  }

  async findRevisionsByProcessId(processId: string): Promise<InitiativeRevision[]> {
    return this.revisionRepository.find({
      where: { process: { id: processId } },
      order: { timestamp: 'ASC' },
    });
  }
} 