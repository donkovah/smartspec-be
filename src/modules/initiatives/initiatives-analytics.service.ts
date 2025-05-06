import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InitiativeProcess } from './entities/initiative-process.entity';
import { InitiativeRevision } from './entities/initiative-revision.entity';
import { InitiativeStatus } from './entities/initiative-process.entity';
import { RevisionType } from './entities/initiative-revision.entity';

interface Task {
  type: string;
  priority: string;
  storyPoints?: number;
}

interface ProcessMetrics {
  totalProcesses: number;
  statusDistribution: Record<InitiativeStatus, number>;
  averageRevisionsPerProcess: number;
  averageTimeToApproval: number;
  revisionTypeDistribution: Record<RevisionType, number>;
}

interface ProcessTrends {
  dailyProcesses: Record<string, number>;
  statusChanges: Record<string, Record<InitiativeStatus, number>>;
}

interface ProcessPerformanceMetrics {
  averageTasksPerProcess: number;
  taskDistributionByType: Record<string, number>;
  averageStoryPoints: number;
  priorityDistribution: Record<string, number>;
}

@Injectable()
export class InitiativesAnalyticsService {
  constructor(
    @InjectRepository(InitiativeProcess)
    private readonly processRepository: Repository<InitiativeProcess>,
    @InjectRepository(InitiativeRevision)
    private readonly revisionRepository: Repository<InitiativeRevision>,
  ) {}

  async getProcessMetrics(startDate: Date, endDate: Date): Promise<ProcessMetrics> {
    const processes = await this.processRepository.find({
      where: {
        created_at: Between(startDate, endDate),
      },
      relations: ['revisions'],
    });

    const metrics: ProcessMetrics = {
      totalProcesses: processes.length,
      statusDistribution: {
        [InitiativeStatus.Draft]: 0,
        [InitiativeStatus.Reviewing]: 0,
        [InitiativeStatus.Approved]: 0,
        [InitiativeStatus.Uploaded]: 0,
      },
      averageRevisionsPerProcess: 0,
      averageTimeToApproval: 0,
      revisionTypeDistribution: {
        [RevisionType.Suggestion]: 0,
        [RevisionType.UserEdit]: 0,
        [RevisionType.Final]: 0,
      },
    };

    let totalRevisions = 0;
    let totalApprovalTime = 0;
    let approvedProcesses = 0;

    processes.forEach(process => {
      // Count status distribution
      metrics.statusDistribution[process.status]++;

      // Count revisions
      const revisions = process.revisions || [];
      totalRevisions += revisions.length;

      // Count revision types
      revisions.forEach(revision => {
        if (revision.type in metrics.revisionTypeDistribution) {
          metrics.revisionTypeDistribution[revision.type as RevisionType]++;
        }
      });

      // Calculate time to approval
      if (process.status === InitiativeStatus.Approved || process.status === InitiativeStatus.Uploaded) {
        const approvalRevision = revisions.find(r => r.type === RevisionType.Final);
        if (approvalRevision) {
          const timeToApproval = approvalRevision.timestamp.getTime() - process.created_at.getTime();
          totalApprovalTime += timeToApproval;
          approvedProcesses++;
        }
      }
    });

    // Calculate averages
    metrics.averageRevisionsPerProcess = totalRevisions / processes.length || 0;
    metrics.averageTimeToApproval = approvedProcesses > 0 ? totalApprovalTime / approvedProcesses : 0;

    return metrics;
  }

  async getProcessTrends(days: number): Promise<ProcessTrends> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const processes = await this.processRepository.find({
      where: {
        created_at: Between(startDate, endDate),
      },
      order: {
        created_at: 'ASC',
      },
    });

    const trends = {
      dailyProcesses: new Map<string, number>(),
      statusChanges: new Map<string, Map<InitiativeStatus, number>>(),
    };

    processes.forEach(process => {
      // Count daily processes
      const dateKey = process.created_at.toISOString().split('T')[0];
      trends.dailyProcesses.set(dateKey, (trends.dailyProcesses.get(dateKey) || 0) + 1);

      // Track status changes
      if (!trends.statusChanges.has(dateKey)) {
        trends.statusChanges.set(dateKey, new Map());
      }
      const statusMap = trends.statusChanges.get(dateKey)!;
      statusMap.set(process.status, (statusMap.get(process.status) || 0) + 1);
    });

    // Convert status changes to the correct type
    const statusChanges: Record<string, Record<InitiativeStatus, number>> = {};
    trends.statusChanges.forEach((statusMap, date) => {
      statusChanges[date] = {
        [InitiativeStatus.Draft]: statusMap.get(InitiativeStatus.Draft) || 0,
        [InitiativeStatus.Reviewing]: statusMap.get(InitiativeStatus.Reviewing) || 0,
        [InitiativeStatus.Approved]: statusMap.get(InitiativeStatus.Approved) || 0,
        [InitiativeStatus.Uploaded]: statusMap.get(InitiativeStatus.Uploaded) || 0,
      };
    });

    return {
      dailyProcesses: Object.fromEntries(trends.dailyProcesses),
      statusChanges,
    };
  }

  async getProcessPerformanceMetrics(): Promise<ProcessPerformanceMetrics> {
    const processes = await this.processRepository.find({
      relations: ['revisions'],
    });

    const metrics: ProcessPerformanceMetrics = {
      averageTasksPerProcess: 0,
      taskDistributionByType: {},
      averageStoryPoints: 0,
      priorityDistribution: {},
    };

    let totalTasks = 0;
    let totalStoryPoints = 0;

    processes.forEach(process => {
      const revisions = process.revisions || [];
      const finalRevision = revisions.find(r => r.type === RevisionType.Final);

      if (finalRevision && finalRevision.tasks) {
        const tasks = finalRevision.tasks as Task[];
        totalTasks += tasks.length;

        tasks.forEach(task => {
          // Count task types
          metrics.taskDistributionByType[task.type] = (metrics.taskDistributionByType[task.type] || 0) + 1;

          // Count priorities
          metrics.priorityDistribution[task.priority] = (metrics.priorityDistribution[task.priority] || 0) + 1;

          // Sum story points
          if (task.storyPoints) {
            totalStoryPoints += task.storyPoints;
          }
        });
      }
    });

    // Calculate averages
    metrics.averageTasksPerProcess = totalTasks / processes.length || 0;
    metrics.averageStoryPoints = totalStoryPoints / totalTasks || 0;

    return metrics;
  }
} 