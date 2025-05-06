import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { VectorService } from '../vector/vector.service';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { JiraTask, JiraTaskSchema } from './initiatives.schema';
import { HumanMessage } from '@langchain/core/messages';
import { DataLoader } from '../vector/data-loader';
import { v4 as uuidv4 } from 'uuid';
import { InitiativesRepository } from './initiatives.repository';
import { InitiativeProcess } from './entities/initiative-process.entity';
import { InitiativeRevision } from './entities/initiative-revision.entity';
import { InitiativeStatus } from './entities/initiative-process.entity';
import { RevisionType } from './entities/initiative-revision.entity';

interface TaskMetadata {
  initiative: string;
  totalTasks: number;
  totalStoryPoints: number;
}

interface TaskComparison {
  added: JiraTask[];
  removed: JiraTask[];
  modified: JiraTask[];
}

@Injectable()
export class InitiativesService {
  private openai: ChatOpenAI;
  private taskParser: StructuredOutputParser<z.ZodType<JiraTask[]>>;

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorService: VectorService,
    private readonly dataLoader: DataLoader,
    private readonly repository: InitiativesRepository,
  ) {
    this.openai = new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('openai.apiKey'),
      modelName: 'gpt-4',
      temperature: 0.7,
    });

    this.taskParser = StructuredOutputParser.fromZodSchema(
      z.array(JiraTaskSchema),
    );
  }

  setOpenAI(openai: ChatOpenAI): void {
    this.openai = openai;
  }

  async createInitiativeProcess(
    title: string,
    description: string,
    jiraProjectKey?: string,
  ): Promise<InitiativeProcess> {
    const now = new Date();
    const process = new InitiativeProcess();
    process.id = uuidv4();
    process.title = title;
    process.description = description;
    process.status = InitiativeStatus.Draft;
    process.created_at = now;
    process.updated_at = now;
    process.jiraProjectKey = jiraProjectKey;
    process.revisions = [];

    // Generate initial task suggestions
    const suggestedTasks = await this.generateTaskSuggestions(title + '\n' + description);
    
    // Create the first revision with the suggestions
    const initialRevision = new InitiativeRevision();
    initialRevision.id = uuidv4();
    initialRevision.timestamp = now;
    initialRevision.type = RevisionType.Suggestion;
    initialRevision.tasks = suggestedTasks.tasks;
    initialRevision.metadata = {
      totalTasks: suggestedTasks.metadata.totalTasks,
      totalStoryPoints: suggestedTasks.metadata.totalStoryPoints,
    };
    initialRevision.process = process;

    process.revisions.push(initialRevision);
    process.status = InitiativeStatus.Reviewing;

    // Store the process
    await this.storeInitiativeProcess(process);

    return process;
  }

  async updateInitiativeTasks(
    processId: string,
    tasks: JiraTask[],
  ): Promise<InitiativeProcess> {
    // Retrieve the current process
    const process = await this.getInitiativeProcess(processId);
    if (!process) {
      throw new Error('Initiative process not found');
    }

    const now = new Date();
    const lastRevision = process.revisions[process.revisions.length - 1];

    // Create a new revision for user edits
    const newRevision = new InitiativeRevision();
    newRevision.id = uuidv4();
    newRevision.timestamp = now;
    newRevision.type = RevisionType.UserEdit;
    newRevision.tasks = tasks;
    newRevision.metadata = {
      totalTasks: this.countTotalTasks(tasks),
      totalStoryPoints: this.calculateTotalStoryPoints(tasks),
      editDistance: this.calculateEditDistance(lastRevision.tasks, tasks),
    };
    newRevision.process = process;

    process.revisions.push(newRevision);
    process.updated_at = now;

    // Store the updated process
    await this.storeInitiativeProcess(process);

    return process;
  }

  async finalizeAndUploadToJira(
    processId: string,
    tasks: JiraTask[],
  ): Promise<InitiativeProcess> {
    const process = await this.getInitiativeProcess(processId);
    if (!process) {
      throw new Error('Initiative process not found');
    }

    const now = new Date();
    const initialSuggestion = process.revisions[0];

    // Create final revision
    const finalRevision = new InitiativeRevision();
    finalRevision.id = uuidv4();
    finalRevision.timestamp = now;
    finalRevision.type = RevisionType.Final;
    finalRevision.tasks = tasks;
    finalRevision.metadata = {
      totalTasks: this.countTotalTasks(tasks),
      totalStoryPoints: this.calculateTotalStoryPoints(tasks),
      accuracy: this.calculateAccuracy(initialSuggestion.tasks, tasks),
      editDistance: this.calculateEditDistance(
        process.revisions[process.revisions.length - 1].tasks,
        tasks,
      ),
    };
    finalRevision.process = process;

    process.revisions.push(finalRevision);
    process.status = InitiativeStatus.Approved;
    process.updated_at = now;

    // Store the final version
    await this.storeInitiativeProcess(process);

    // TODO: Implement JIRA upload
    // const jiraEpicLink = await this.uploadToJira(process.jiraProjectKey, tasks);
    // process.jiraEpicLink = jiraEpicLink;
    // process.status = InitiativeStatus.Uploaded;
    // await this.storeInitiativeProcess(process);

    return process;
  }

  private async generateTaskSuggestions(
    initiative: string,
  ): Promise<{ tasks: JiraTask[]; metadata: TaskMetadata }> {
    try {
      // Search for similar historical initiatives
      const similarInitiatives = await this.dataLoader.searchSimilarInitiatives(
        initiative,
        3,
      );

      // Format historical context
      const historicalContext = similarInitiatives
        .map((result) => {
          const init = result.initiative;
          if (!init) return null;
          return `Similar Initiative: ${init.title}
Description: ${init.description}
Category: ${init.category || 'N/A'}
Priority: ${init.priority || 'N/A'}
Status: ${init.status || 'N/A'}
Similarity Score: ${result.score.toFixed(2)}`;
        })
        .filter((context): context is string => context !== null)
        .join('\n\n');

      // Create a prompt template for task conversion
      const promptTemplate = PromptTemplate.fromTemplate(`
        You are an expert project manager and technical lead. Your task is to break down the following project initiative into well-structured JIRA tasks.
        
        Initiative: {initiative}
        
        Here are some similar historical initiatives for context:
        {historical_context}
        
        Guidelines:
        1. Break down the initiative into logical, manageable tasks
        2. Each task should be specific, measurable, and achievable
        3. Include appropriate story points (1-13) based on complexity
        4. Set realistic priorities
        5. Include subtasks where necessary
        6. Use clear, concise language
        7. Consider patterns from similar historical initiatives when appropriate
        
        {format_instructions}
      `);

      // Format the prompt with the initiative and parser instructions
      const formattedPrompt = await promptTemplate.format({
        initiative,
        historical_context:
          historicalContext || 'No similar historical initiatives found.',
        format_instructions: this.taskParser.getFormatInstructions(),
      });

      // Generate the response using OpenAI
      const response = await this.openai.invoke([
        new HumanMessage(formattedPrompt),
      ]);

      // Parse the response into structured tasks
      const content =
        typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);
      const tasks = await this.taskParser.parse(content);

      return {
        tasks,
        metadata: {
          initiative,
          totalTasks: this.countTotalTasks(tasks),
          totalStoryPoints: this.calculateTotalStoryPoints(tasks),
        },
      };
    } catch (error) {
      console.error('Error converting initiative to tasks:', error);
      throw new Error('Failed to convert initiative to tasks');
    }
  }

  private async storeInitiativeProcess(process: InitiativeProcess): Promise<void> {
    // Store in repository
    await this.repository.save(process);

    // Store in vector database for similarity search
    await this.vectorService.storeVector('initiatives', {
      id: process.id,
      title: process.title,
      description: process.description,
      tasks: process.revisions[process.revisions.length - 1].tasks,
      timestamp: process.updated_at,
    });
  }

  private async getInitiativeProcess(id: string): Promise<InitiativeProcess | null> {
    return this.repository.findById(id);
  }

  async getAllInitiatives(): Promise<InitiativeProcess[]> {
    return this.repository.findAll();
  }

  async getInitiativesByStatus(status: InitiativeStatus): Promise<InitiativeProcess[]> {
    return this.repository.findByStatus(status);
  }

  private countTotalTasks(tasks: JiraTask[]): number {
    return tasks.reduce((count, task) => {
      const subtaskCount = task.subtasks
        ? this.countTotalTasks(task.subtasks)
        : 0;
      return count + 1 + subtaskCount;
    }, 0);
  }

  private calculateTotalStoryPoints(tasks: JiraTask[]): number {
    return tasks.reduce((total, task) => {
      const subtaskPoints = task.subtasks
        ? this.calculateTotalStoryPoints(task.subtasks)
        : 0;
      return total + task.storyPoints + subtaskPoints;
    }, 0);
  }

  private calculateEditDistance(originalTasks: JiraTask[], newTasks: JiraTask[]): number {
    // TODO: Implement a proper edit distance calculation
    // This should consider changes in task properties and structure
    return 0;
  }

  private calculateAccuracy(suggestedTasks: JiraTask[], finalTasks: JiraTask[]): number {
    // TODO: Implement a proper accuracy calculation
    // This should consider how close the initial suggestion was to the final version
    return 0;
  }

  private compareTasks(originalTasks: JiraTask[], newTasks: JiraTask[]): TaskComparison {
    const added = newTasks.filter(task => !originalTasks.some(ot => ot.id === task.id));
    const removed = originalTasks.filter(task => !newTasks.some(nt => nt.id === task.id));
    const modified = newTasks.filter(task => {
      const originalTask = originalTasks.find(ot => ot.id === task.id);
      return originalTask && JSON.stringify(originalTask) !== JSON.stringify(task);
    });

    return {
      added,
      removed,
      modified
    };
  }

  private async updateTasks(processId: string, tasks: JiraTask[]): Promise<void> {
    const process = await this.repository.findOne({ where: { id: processId } });
    if (!process) {
      throw new NotFoundException(`Process with ID ${processId} not found`);
    }

    process.tasks = tasks;
    await this.repository.save(process);
  }

  private async generateTasks(processId: string): Promise<JiraTask[]> {
    const process = await this.repository.findOne({ where: { id: processId } });
    if (!process) {
      throw new NotFoundException(`Process with ID ${processId} not found`);
    }

    const tasks = await this.dataLoader.generateTasks(process.description);
    return tasks;
  }

  private async suggestTasks(processId: string): Promise<JiraTask[]> {
    const process = await this.repository.findOne({ where: { id: processId } });
    if (!process) {
      throw new NotFoundException(`Process with ID ${processId} not found`);
    }

    const tasks = await this.dataLoader.suggestTasks(process.description);
    return tasks;
  }

  private async generateFinalTasks(processId: string): Promise<JiraTask[]> {
    const process = await this.repository.findOne({ where: { id: processId } });
    if (!process) {
      throw new NotFoundException(`Process with ID ${processId} not found`);
    }

    const tasks = await this.dataLoader.generateFinalTasks(process.description);
    return tasks;
  }
}
