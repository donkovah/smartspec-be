import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InitiativesService } from './initiatives.service';
import { VectorService } from '../vector/vector.service';
import { jest } from '@jest/globals';

// Mock the ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    const config = {
      'openai.apiKey': 'test-api-key',
      'qdrant.url': 'http://localhost:6333',
      'qdrant.apiKey': 'test-qdrant-key',
    };
    return config[key as keyof typeof config];
  }),
};

// Mock the VectorService
const mockVectorService = {
  storeVector: jest.fn(),
};

describe('InitiativesService', () => {
  let service: InitiativesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiativesService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: VectorService,
          useValue: mockVectorService,
        },
      ],
    }).compile();

    service = module.get<InitiativesService>(InitiativesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
