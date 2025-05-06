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

  async storeVector(collection: string, data: any) {
    // For now, we'll use a simple hash of the data as the vector
    // In a real implementation, you would use an embedding model
    const vector = this.generateSimpleVector(data);
    
    return this.qdrantClient.upsert(collection, {
      points: [
        {
          id: Date.now().toString(),
          vector,
          payload: data,
        },
      ],
    });
  }

  async searchSimilar(collection: string, data: any, limit: number = 5) {
    const vector = this.generateSimpleVector(data);
    return this.qdrantClient.search(collection, {
      vector,
      limit,
    });
  }

  private generateSimpleVector(data: any): number[] {
    // This is a placeholder implementation
    // In a real application, you would use an embedding model
    const str = JSON.stringify(data);
    const vector = new Array(1536).fill(0);
    for (let i = 0; i < str.length; i++) {
      vector[i % 1536] += str.charCodeAt(i) / 255;
    }
    return vector;
  }
} 