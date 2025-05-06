import { z } from 'zod';

const TaskType = z.enum(['Story', 'Task', 'Bug']);
const PriorityType = z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']);

export const JiraTaskSchema: z.ZodType<JiraTask> = z.object({
  type: TaskType.describe('Type of the task'),
  summary: z.string().describe('Task summary/title'),
  description: z.string().describe('Detailed task description'),
  priority: PriorityType.describe('Task priority level'),
  storyPoints: z.number().min(1).max(13).describe('Story points (1-13)'),
  subtasks: z
    .array(z.lazy(() => JiraTaskSchema))
    .optional()
    .describe('Optional subtasks'),
});

export type JiraTask = {
  type: z.infer<typeof TaskType>;
  summary: string;
  description: string;
  priority: z.infer<typeof PriorityType>;
  storyPoints: number;
  subtasks?: JiraTask[];
};
