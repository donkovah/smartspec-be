import { ConfigService } from '@nestjs/config';
import { OpenAI } from '@langchain/openai';
import { VectorService } from '../vector/vector.service';
import { Test, TestingModule } from '@nestjs/testing';
import { InitiativesService } from './initiatives.service';

jest.mock('@langchain/openai');
jest.mock('../vector/vector.service');

describe('InitiativesService', () => {
  let service: InitiativesService;
  let vectorService: VectorService;
  let openai: jest.Mocked<OpenAI>;

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
    openai = new OpenAI() as jest.Mocked<OpenAI>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convertInitiativeToTasks', () => {
    const mockInitiative = 'Implement user authentication system';
    const mockTasks = [
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
      const mockResponse = JSON.stringify(mockTasks);
      openai.invoke.mockResolvedValue(mockResponse);

      // Mock vector service
      jest.spyOn(vectorService, 'storeVector').mockResolvedValue({ status: 'completed' });

      const result = await service.convertInitiativeToTasks(mockInitiative);

      expect(result.tasks).toEqual(mockTasks);
      expect(result.metadata).toHaveProperty('initiative', mockInitiative);
      expect(result.metadata).toHaveProperty('totalTasks');
      expect(result.metadata).toHaveProperty('totalStoryPoints');
      expect(vectorService.storeVector).toHaveBeenCalled();
    });

    it('should handle OpenAI errors gracefully', async () => {
      openai.invoke.mockRejectedValue(new Error('OpenAI API error'));

      await expect(service.convertInitiativeToTasks(mockInitiative)).rejects.toThrow(
        'Failed to convert initiative to tasks',
      );
    });

    it('should handle invalid task structure', async () => {
      const invalidResponse = 'Invalid JSON response';
      openai.invoke.mockResolvedValue(invalidResponse);

      await expect(service.convertInitiativeToTasks(mockInitiative)).rejects.toThrow(
        'Failed to convert initiative to tasks',
      );
    });

    it('should calculate total tasks and story points correctly', async () => {
      const mockResponse = JSON.stringify(mockTasks);
      openai.invoke.mockResolvedValue(mockResponse);
      jest.spyOn(vectorService, 'storeVector').mockResolvedValue({ status: 'completed' });

      const result = await service.convertInitiativeToTasks(mockInitiative);

      expect(result.metadata.totalTasks).toBe(2); // Main task + 1 subtask
      expect(result.metadata.totalStoryPoints).toBe(8); // 5 + 3 story points
    });
  });
}); 