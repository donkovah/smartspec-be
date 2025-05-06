import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InitiativesService } from './initiatives.service';
import { VectorService } from '../vector/vector.service';
import { OpenAI } from '@langchain/openai';
import { JiraTask } from './initiatives.schema';

jest.mock('@langchain/openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(),
  })),
}));

jest.mock('../vector/vector.service');

describe('InitiativesService', () => {
  let service: InitiativesService;
  let vectorService: VectorService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'openai.apiKey': 'test-api-key',
        'qdrant.url': 'http://localhost:6333',
        'qdrant.apiKey': 'test-qdrant-key',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiativesService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        VectorService,
      ],
    }).compile();

    service = module.get<InitiativesService>(InitiativesService);
    vectorService = module.get<VectorService>(VectorService);
    mockOpenAI = new (OpenAI as any)();
    service.setOpenAI(mockOpenAI);
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
      mockOpenAI.invoke.mockResolvedValue(JSON.stringify(mockTasks));

      // Mock vector service
      jest.spyOn(vectorService, 'storeVector').mockResolvedValue({ status: 'completed' });

      const result = await service.convertInitiativeToTasks(mockInitiative);

      expect(result.tasks).toEqual(mockTasks);
      expect(result.metadata).toHaveProperty('initiative', mockInitiative);
      expect(result.metadata.totalTasks).toBe(2); // Main task + 1 subtask
      expect(result.metadata.totalStoryPoints).toBe(8); // 5 + 3 story points
      expect(vectorService.storeVector).toHaveBeenCalled();
    });

    it('should handle OpenAI errors gracefully', async () => {
      mockOpenAI.invoke.mockRejectedValue(new Error('OpenAI API error'));

      await expect(service.convertInitiativeToTasks(mockInitiative)).rejects.toThrow(
        'Failed to convert initiative to tasks',
      );
    });

    it('should handle invalid task structure', async () => {
      mockOpenAI.invoke.mockResolvedValue('Invalid JSON response');

      await expect(service.convertInitiativeToTasks(mockInitiative)).rejects.toThrow(
        'Failed to convert initiative to tasks',
      );
    });
  });
}); 