import { z } from 'zod';

const TaskType = z.enum(['Story', 'Task', 'Bug']);
const PriorityType = z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']);
const InitiativeStatus = z.enum(['Draft', 'Reviewing', 'Approved', 'Uploaded']);

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

export const InitiativeRevisionSchema = z.object({
  id: z.string().describe('Unique identifier for the revision'),
  timestamp: z.string().describe('When this revision was created'),
  type: z.enum(['suggestion', 'user_edit', 'final']).describe('Type of revision'),
  tasks: z.array(JiraTaskSchema).describe('Tasks in this revision'),
  metadata: z.object({
    totalTasks: z.number(),
    totalStoryPoints: z.number(),
    accuracy: z.number().optional().describe('If type is final, accuracy score of original suggestion'),
    editDistance: z.number().optional().describe('If type is user_edit or final, distance from previous revision'),
  }),
});

export const InitiativeProcessSchema = z.object({
  id: z.string().describe('Unique identifier for the initiative process'),
  title: z.string().describe('Initiative title'),
  description: z.string().describe('Initiative description'),
  status: InitiativeStatus,
  created_at: z.string(),
  updated_at: z.string(),
  revisions: z.array(InitiativeRevisionSchema),
  jiraProjectKey: z.string().optional(),
  jiraEpicLink: z.string().optional(),
});

export type JiraTask = {
  type: z.infer<typeof TaskType>;
  summary: string;
  description: string;
  priority: z.infer<typeof PriorityType>;
  storyPoints: number;
  subtasks?: JiraTask[];
};

export type InitiativeRevision = z.infer<typeof InitiativeRevisionSchema>;
export type InitiativeProcess = z.infer<typeof InitiativeProcessSchema>;
