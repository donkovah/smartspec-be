import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { VectorService } from '../vector/vector.service';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { JiraTask, JiraTaskSchema } from './initiatives.schema';
import { HumanMessage } from '@langchain/core/messages';
import { DataLoader } from '../vector/data-loader';

interface TaskMetadata {
  initiative: string;
  totalTasks: number;
  totalStoryPoints: number;
}

@Injectable()
export class InitiativesService {
  private openai: ChatOpenAI;
  private taskParser: StructuredOutputParser<z.ZodType<JiraTask[]>>;

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorService: VectorService,
    private readonly dataLoader: DataLoader,
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

  async convertInitiativeToTasks(
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

      // Store the initiative and tasks in vector store for future reference
      await this.storeInitiativeAndTasks(initiative, tasks);

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

  private async storeInitiativeAndTasks(
    initiative: string,
    tasks: JiraTask[],
  ): Promise<void> {
    // Store the initiative and tasks in the vector store
    await this.vectorService.storeVector('initiatives', {
      initiative,
      tasks,
      timestamp: new Date().toISOString(),
    });
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
}
