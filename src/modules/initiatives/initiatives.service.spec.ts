import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InitiativesService } from './initiatives.service';
import { VectorService } from '../vector/vector.service';
import { DataLoader } from '../vector/data-loader';
import { AIMessageChunk } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { jest } from '@jest/globals';

describe('InitiativesService', () => {
  let service: InitiativesService;
  let mockOpenAI: jest.Mocked<ChatOpenAI>;
  let mockVectorService: jest.Mocked<VectorService>;
  let mockDataLoader: jest.Mocked<DataLoader>;

  beforeEach(async () => {
    mockOpenAI = {
      invoke: jest.fn(),
    } as unknown as jest.Mocked<ChatOpenAI>;

    mockVectorService = {
      storeVector: jest.fn(),
    } as unknown as jest.Mocked<VectorService>;

    mockDataLoader = {
      searchSimilarInitiatives: jest.fn(),
    } as unknown as jest.Mocked<DataLoader>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiativesService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              switch (key) {
                case 'openai.apiKey':
                  return 'test-api-key';
                case 'qdrant.url':
                  return 'http://localhost:6333';
                case 'qdrant.apiKey':
                  return 'test-qdrant-key';
                default:
                  return null;
              }
            },
          },
        },
        {
          provide: VectorService,
          useValue: mockVectorService,
        },
        {
          provide: DataLoader,
          useValue: mockDataLoader,
        },
      ],
    }).compile();

    service = module.get<InitiativesService>(InitiativesService);
    Object.defineProperty(service, 'openai', {
      value: mockOpenAI,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(service, 'dataLoader', {
      value: mockDataLoader,
      writable: true,
      configurable: true,
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convertInitiativeToTasks', () => {
    it('should successfully convert an initiative to tasks with historical context', async () => {
      const initiative = 'Create a new user authentication system';
      const historicalContext = [
        {
          initiative: {
            id: '1',
            title: 'Previous auth system implementation',
            description: 'Previous implementation of authentication system',
            category: 'Security',
            priority: 'High',
            status: 'Completed',
          },
          score: 0.85,
        },
      ];

      const searchSimilarInitiativesSpy = jest.spyOn(
        mockDataLoader,
        'searchSimilarInitiatives',
      );
      const invokeSpy = jest.spyOn(mockOpenAI, 'invoke');
      const storeVectorSpy = jest.spyOn(mockVectorService, 'storeVector');

      searchSimilarInitiativesSpy.mockResolvedValue(historicalContext);

      const mockResponse = new AIMessageChunk({
        content: JSON.stringify([
          {
            type: 'Task',
            summary: 'Design authentication flow',
            description: 'Create detailed design documents',
            priority: 'High',
            storyPoints: 5,
          },
        ]),
      });

      invokeSpy.mockResolvedValue(mockResponse);
      storeVectorSpy.mockResolvedValue({ status: 'completed' });

      const result = await service.convertInitiativeToTasks(initiative);

      expect(searchSimilarInitiativesSpy).toHaveBeenCalledWith(initiative, 3);
      expect(invokeSpy).toHaveBeenCalled();
      expect(storeVectorSpy).toHaveBeenCalled();
      expect(result).toEqual({
        tasks: [
          {
            type: 'Task',
            summary: 'Design authentication flow',
            description: 'Create detailed design documents',
            priority: 'High',
            storyPoints: 5,
          },
        ],
        metadata: {
          initiative,
          totalTasks: 1,
          totalStoryPoints: 5,
        },
      });
    });

    it('should handle OpenAI API errors gracefully', async () => {
      const initiative = 'Create a new feature';
      mockDataLoader.searchSimilarInitiatives.mockResolvedValue([]);
      mockOpenAI.invoke.mockRejectedValue(new Error('API Error'));

      await expect(
        service.convertInitiativeToTasks(initiative),
      ).rejects.toThrow('Failed to convert initiative to tasks');
    });

    it('should handle invalid task structure from OpenAI', async () => {
      const initiative = 'Create a new feature';
      mockDataLoader.searchSimilarInitiatives.mockResolvedValue([]);

      const invalidResponse = new AIMessageChunk({
        content: JSON.stringify([{ invalid: 'structure' }]),
      });

      mockOpenAI.invoke.mockResolvedValue(invalidResponse);

      await expect(
        service.convertInitiativeToTasks(initiative),
      ).rejects.toThrow('Failed to convert initiative to tasks');
    });

    it('should handle vector storage errors', async () => {
      const initiative = 'Create a new feature';
      mockDataLoader.searchSimilarInitiatives.mockResolvedValue([]);

      const validResponse = new AIMessageChunk({
        content: JSON.stringify([
          {
            type: 'Task',
            summary: 'Test task',
            description: 'Test description',
            priority: 'High',
            storyPoints: 3,
          },
        ]),
      });

      mockOpenAI.invoke.mockResolvedValue(validResponse);
      mockVectorService.storeVector.mockRejectedValue(
        new Error('Storage error'),
      );

      await expect(
        service.convertInitiativeToTasks(initiative),
      ).rejects.toThrow('Failed to convert initiative to tasks');
    });
  });
});
