import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ConfigService } from '@nestjs/config';
import { Injectable, OnModuleInit } from '@nestjs/common';

export interface InitiativeData {
  id: string;
  title: string;
  description: string;
  category?: string;
  priority?: string;
  status?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class DataLoader implements OnModuleInit {
  private embeddings: OpenAIEmbeddings;
  private qdrantClient: QdrantClient;
  private readonly collectionName = 'initiatives';

  constructor(private readonly configService: ConfigService) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.configService.get<string>('openai.apiKey'),
    });

    this.qdrantClient = new QdrantClient({
      url: this.configService.get<string>('qdrant.url'),
      apiKey: this.configService.get<string>('qdrant.apiKey'),
    });
  }

  async onModuleInit() {
    await this.ensureCollection();
  }

  private async ensureCollection() {
    try {
      // Check if collection exists
      const collections = await this.qdrantClient.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName,
      );

      if (!exists) {
        // Create collection with appropriate settings
        await this.qdrantClient.createCollection(this.collectionName, {
          vectors: {
            size: 1536, // OpenAI embeddings dimension
            distance: 'Cosine',
          },
          optimizers_config: {
            default_segment_number: 2,
          },
        });

        console.log(`Created collection: ${this.collectionName}`);
      }
    } catch (error) {
      console.error('Error ensuring collection exists:', error);
      throw error;
    }
  }

  async loadInitiatives(initiatives: InitiativeData[]) {
    try {
      console.log(`Loading ${initiatives.length} initiatives into Qdrant...`);

      for (const initiative of initiatives) {
        // Create embedding for the initiative text
        const text = `${initiative.title}\n${initiative.description}`;
        const embedding = await this.embeddings.embedQuery(text);

        // Store in Qdrant
        await this.qdrantClient.upsert(this.collectionName, {
          wait: true,
          points: [
            {
              id: initiative.id,
              vector: embedding,
              payload: {
                ...initiative,
                text,
                timestamp: new Date().toISOString(),
              },
            },
          ],
        });

        console.log(`Loaded initiative: ${initiative.title}`);
      }

      console.log('Successfully loaded all initiatives');
    } catch (error) {
      console.error('Error loading initiatives:', error);
      throw error;
    }
  }

  async searchSimilarInitiatives(query: string, limit: number = 5) {
    try {
      const queryEmbedding = await this.embeddings.embedQuery(query);

      const results = await this.qdrantClient.search(this.collectionName, {
        vector: queryEmbedding,
        limit,
        with_payload: true,
      });

      return results
        .map((result) => ({
          initiative: result.payload
            ? (result.payload as unknown as InitiativeData)
            : null,
          score: result.score,
        }))
        .filter((result) => result.initiative !== null);
    } catch (error) {
      console.error('Error searching initiatives:', error);
      throw error;
    }
  }
}
