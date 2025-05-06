import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataLoader } from '../modules/vector/data-loader';
import { InitiativeData } from '../modules/vector/data-loader';
import { InitiativesService } from '../modules/initiatives/initiatives.service';
import { JiraTask } from '../modules/jira/jira.service';

const sampleInitiatives: InitiativeData[] = [
  {
    id: '1',
    title: 'Implement AI-Powered Customer Support',
    description:
      'Develop and integrate an AI chatbot system to handle first-line customer support inquiries, reducing response time and improving customer satisfaction.',
    category: 'Customer Experience',
    priority: 'High',
    status: 'Planning',
    metadata: {
      estimatedBudget: 50000,
      expectedROI: '30%',
      stakeholders: ['Customer Support', 'IT', 'Product'],
    },
  },
  {
    id: '2',
    title: 'Mobile App Redesign',
    description:
      'Modernize our mobile application with a new UI/UX design, focusing on improved navigation, accessibility, and performance optimizations.',
    category: 'Product Development',
    priority: 'High',
    status: 'In Progress',
    metadata: {
      platform: ['iOS', 'Android'],
      targetCompletion: '2024-Q3',
      dependencies: ['Design System Update', 'API Modernization'],
    },
  },
  {
    id: '3',
    title: 'Data Analytics Platform Enhancement',
    description:
      'Upgrade our analytics infrastructure to handle real-time data processing and implement advanced visualization capabilities for better business insights.',
    category: 'Analytics',
    priority: 'Medium',
    status: 'Planning',
    metadata: {
      tools: ['Tableau', 'BigQuery', 'Apache Kafka'],
      dataVolume: '5TB/day',
      stakeholders: ['Data Science', 'Business Intelligence', 'Engineering'],
    },
  },
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataLoader = app.get(DataLoader);
  const initiativesService = app.get(InitiativesService);

  try {
    await dataLoader.loadInitiatives(sampleInitiatives);
    console.log('Successfully loaded sample initiatives');

    // 1. Create a new initiative process
    const process = await initiativesService.createInitiativeProcess(
      "Build Authentication System",
      "Implement OAuth2 with social login"
    );
    
    // 2. Review and update tasks
    const updatedProcess = await initiativesService.updateInitiativeTasks(
      process.id,
      modifiedTasks
    );
    
    // 3. Finalize and upload to JIRA
    const finalProcess = await initiativesService.finalizeAndUploadToJira(
      process.id,
      finalTasks
    );

    // Update process with suggested tasks
    const suggestedTasks = await initiativesService.suggestTasks(process.id);
    await initiativesService.updateProcess(process.id, {
      tasks: suggestedTasks as JiraTask[]
    });

    // Update process with final tasks
    const finalTasks = await initiativesService.generateFinalTasks(process.id);
    await initiativesService.updateProcess(process.id, {
      tasks: finalTasks as JiraTask[]
    });
  } catch (error) {
    console.error('Error loading sample data:', error);
  } finally {
    await app.close();
  }
}

// Add void operator to explicitly mark the promise as intentionally not awaited
void bootstrap().catch((error) => {
  console.error('Error loading sample data:', error);
  process.exit(1);
});
