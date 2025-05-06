import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class VectorService {
  private qdrantClient: QdrantClient;

  constructor(private readonly configService: ConfigService) {
    this.qdrantClient = new QdrantClient({
      url: this.configService.get<string>('qdrant.url'),
      apiKey: this.configService.get<string>('qdrant.apiKey'),
    });
  }

  async storeVector(collection: string, vector: number[], metadata: any) {
    // TODO: Implement vector storage logic
    return this.qdrantClient.upsert(collection, {
      points: [
        {
          id: Date.now().toString(),
          vector,
          payload: metadata,
        },
      ],
    });
  }

  async searchSimilar(collection: string, vector: number[], limit: number = 5) {
    // TODO: Implement vector search logic
    return this.qdrantClient.search(collection, {
      vector,
      limit,
    });
  }
} 