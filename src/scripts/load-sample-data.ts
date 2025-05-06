import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataLoader } from '../modules/vector/data-loader';
import { InitiativeData } from '../modules/vector/data-loader';

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

  try {
    await dataLoader.loadInitiatives(sampleInitiatives);
    console.log('Successfully loaded sample initiatives');
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
