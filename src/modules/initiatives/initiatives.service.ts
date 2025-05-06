import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from '@langchain/openai';
import { VectorService } from '../vector/vector.service';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { JiraTask, JiraTaskSchema } from './initiatives.schema';

@Injectable()
export class InitiativesService {
  private openai: OpenAI;
  private taskParser: StructuredOutputParser<z.ZodType<any>>;

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorService: VectorService,
  ) {
    this.openai = new OpenAI({
      openAIApiKey: this.configService.get<string>('openai.apiKey'),
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
    });

    this.taskParser = StructuredOutputParser.fromZodSchema(z.array(JiraTaskSchema));
  }

  setOpenAI(openai: OpenAI) {
    this.openai = openai;
  }

  async convertInitiativeToTasks(initiative: string) {
    try {
      // Create a prompt template for task conversion
      const promptTemplate = PromptTemplate.fromTemplate(`
        You are an expert project manager and technical lead. Your task is to break down the following project initiative into well-structured JIRA tasks.
        
        Initiative: {initiative}
        
        Guidelines:
        1. Break down the initiative into logical, manageable tasks
        2. Each task should be specific, measurable, and achievable
        3. Include appropriate story points (1-13) based on complexity
        4. Set realistic priorities
        5. Include subtasks where necessary
        6. Use clear, concise language
        
        {format_instructions}
      `);

      // Format the prompt with the initiative and parser instructions
      const formattedPrompt = await promptTemplate.format({
        initiative,
        format_instructions: this.taskParser.getFormatInstructions(),
      });

      // Generate the response using OpenAI
      const response = await this.openai.invoke(formattedPrompt);

      // Parse the response into structured tasks
      const tasks = await this.taskParser.parse(response);

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

  private async storeInitiativeAndTasks(initiative: string, tasks: JiraTask[]) {
    // Store the initiative and tasks in the vector store
    await this.vectorService.storeVector('initiatives', {
      initiative,
      tasks,
      timestamp: new Date().toISOString(),
    });
  }

  private countTotalTasks(tasks: JiraTask[]): number {
    return tasks.reduce((count, task) => {
      return count + 1 + (task.subtasks ? this.countTotalTasks(task.subtasks) : 0);
    }, 0);
  }

  private calculateTotalStoryPoints(tasks: JiraTask[]): number {
    return tasks.reduce((total, task) => {
      return total + task.storyPoints + (task.subtasks ? this.calculateTotalStoryPoints(task.subtasks) : 0);
    }, 0);
  }
} 