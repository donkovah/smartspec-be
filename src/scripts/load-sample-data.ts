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

async function loadSampleData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const initiativesService = app.get(InitiativesService);

  try {
    for (const initiative of sampleInitiatives) {
      const process = await initiativesService.createProcess(initiative);
      console.log(`Created process for initiative: ${initiative.title}`);

      // Update process with tasks
      const tasks = await initiativesService.generateTasks(process.id);
      await initiativesService.updateProcess(process.id, { tasks });
      console.log(`Updated process with ${tasks.length} tasks`);
    }
  } catch (error) {
    console.error('Error loading sample data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void loadSampleData();
