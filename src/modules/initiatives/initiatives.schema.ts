import { z } from "zod";

export const JiraTaskSchema = z.object({
    summary: z.string().describe('A concise title for the task'),
    description: z.string().describe('Detailed description of the task'),
    type: z.enum(['Story', 'Task', 'Bug']).describe('Type of the JIRA task'),
    priority: z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']).describe('Priority level of the task'),
    storyPoints: z.number().min(1).max(13).describe('Story points estimation (1-13)'),
    subtasks: z.array(z.lazy(() => JiraTaskSchema)).optional().describe('Optional subtasks'),
  });
  
  export type JiraTask = z.infer<typeof JiraTaskSchema>;