import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { InitiativeProcess } from './initiative-process.entity';

export enum RevisionType {
  Suggestion = 'suggestion',
  UserEdit = 'user_edit',
  Final = 'final',
}

@Entity('initiative_revisions')
export class InitiativeRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({
    type: 'enum',
    enum: RevisionType,
  })
  type: RevisionType;

  @Column('jsonb')
  tasks: any[]; // We'll use JSONB for the tasks array

  @Column('jsonb')
  metadata: {
    totalTasks: number;
    totalStoryPoints: number;
    accuracy?: number;
    editDistance?: number;
  };

  @ManyToOne(() => InitiativeProcess, process => process.revisions)
  process: InitiativeProcess;
} 