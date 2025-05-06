import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { InitiativeRevision } from './initiative-revision.entity';

export enum InitiativeStatus {
  Draft = 'Draft',
  Reviewing = 'Reviewing',
  Approved = 'Approved',
  Uploaded = 'Uploaded',
}

@Entity('initiative_processes')
export class InitiativeProcess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: InitiativeStatus,
    default: InitiativeStatus.Draft,
  })
  status: InitiativeStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => InitiativeRevision, revision => revision.process, {
    cascade: true,
    eager: true,
  })
  revisions: InitiativeRevision[];

  @Column({ nullable: true })
  jiraProjectKey?: string;

  @Column({ nullable: true })
  jiraEpicLink?: string;
} 