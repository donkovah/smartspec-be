import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InitiativesService } from './initiatives.service';
import { VectorService } from '../vector/vector.service';
import { ChatOpenAI } from '@langchain/openai';
import { AIMessageChunk } from '@langchain/core/messages';
import { JiraTask } from './initiatives.schema';
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
  let mockOpenAI: jest.Mocked<ChatOpenAI>;

  beforeEach(async () => {
    mockOpenAI = {
      invoke: jest.fn(),
    } as unknown as jest.Mocked<ChatOpenAI>;

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
    service.setOpenAI(mockOpenAI as unknown as ChatOpenAI);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convertInitiativeToTasks', () => {
    const mockInitiative = 'Implement user authentication system';
    const mockTasks: JiraTask[] = [
      {
        summary: 'Set up OAuth2.0 authentication',
        description: 'Implement OAuth2.0 authentication flow',
        type: 'Story',
        priority: 'High',
        storyPoints: 5,
        subtasks: [
          {
            summary: 'Configure OAuth providers',
            description: 'Set up Google and GitHub OAuth providers',
            type: 'Task',
            priority: 'Medium',
            storyPoints: 3,
          },
        ],
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully convert initiative to tasks', async () => {
      // Mock OpenAI response
      const mockResponse = new AIMessageChunk({
        content: JSON.stringify(mockTasks),
      });
      mockOpenAI.invoke.mockResolvedValueOnce(mockResponse);

      // Mock vector service
      jest
        .spyOn(mockVectorService, 'storeVector')
        .mockResolvedValue({ status: 'completed' });

      const result = await service.convertInitiativeToTasks(mockInitiative);

      expect(result.tasks).toEqual(mockTasks);
      expect(result.metadata).toHaveProperty('initiative', mockInitiative);
      expect(result.metadata.totalTasks).toBe(2); // Main task + 1 subtask
      expect(result.metadata.totalStoryPoints).toBe(8); // 5 + 3 story points
      expect(mockVectorService.storeVector).toHaveBeenCalled();
    });

    it('should handle OpenAI errors gracefully', async () => {
      mockOpenAI.invoke.mockRejectedValue(new Error('OpenAI API error'));

      await expect(
        service.convertInitiativeToTasks(mockInitiative),
      ).rejects.toThrow('Failed to convert initiative to tasks');
    });

    it('should handle invalid task structure', async () => {
      mockOpenAI.invoke.mockResolvedValue('Invalid JSON response');

      await expect(
        service.convertInitiativeToTasks(mockInitiative),
      ).rejects.toThrow('Failed to convert initiative to tasks');
    });
  });
});
