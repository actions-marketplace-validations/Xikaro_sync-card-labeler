import { LabelsToProjectSync } from './labels-to-project';
import type { ConfigType } from '../types';

describe('LabelsToProjectSync', () => {
  let sync: LabelsToProjectSync;
  let mockOctokit: any;
  let mockContext: any;
  let mockLogger: any;
  let mockConfig: ConfigType;

  beforeEach(() => {
    mockOctokit = {
      rest: {
        projects: {
          getCard: jest.fn(),
          listColumns: jest.fn(),
          listCards: jest.fn(),
          moveCard: jest.fn()
        }
      }
    };

    mockContext = {
      payload: {
        action: 'labeled',
        label: { name: 'Status: Ready' },
        issue: { number: 123 }
      },
      eventName: 'issues'
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      startProcess: jest.fn(),
      endProcess: jest.fn(),
      displayStdout: jest.fn()
    };

    mockConfig = {
      'Roadmap-Team': {
        views: {
          Status: {
            Ready: ['Status: Ready'],
            'In Progress': ['Status: In Progress']
          }
        },
        sync_directions: {
          project_to_labels: true,
          labels_to_project: true
        }
      }
    };

    sync = new LabelsToProjectSync(mockOctokit, mockContext, mockConfig, mockLogger);
  });

  describe('execute', () => {
    it('should detect label changes and sync to project', async () => {
      // Mock successful card detection and movement
      mockOctokit.rest.projects.getCard.mockResolvedValue({
        data: {
          project_url: 'https://api.github.com/projects/1',
          content_url: 'https://api.github.com/repos/owner/repo/issues/123'
        }
      });

      mockOctokit.rest.projects.listColumns.mockResolvedValue({
        data: [
          { id: 1, name: 'Ready' },
          { id: 2, name: 'In Progress' }
        ]
      });

      mockOctokit.rest.projects.listCards.mockResolvedValue({
        data: [
          { id: 100, content_url: 'https://api.github.com/repos/owner/repo/issues/123' }
        ]
      });

      mockOctokit.rest.projects.moveCard.mockResolvedValue({});

      const result = await sync.execute();

      expect(result).toBe(true);
      expect(mockOctokit.rest.projects.moveCard).toHaveBeenCalledWith({
        card_id: 100,
        position: 'top',
        column_id: 1
      });
    });

    it('should handle no label changes', async () => {
      mockContext.payload.action = 'edited';
      mockContext.payload.changes = {};

      const result = await sync.execute();

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('No label changes detected.');
    });

    it('should handle missing project card', async () => {
      mockOctokit.rest.projects.getCard.mockResolvedValue({
        data: {}
      });

      const result = await sync.execute();

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('No related project card found.');
    });
  });

  describe('label type detection', () => {
    it('should detect Status labels', () => {
      const statusChanges = sync['extractLabelType']('Status: Ready');
      expect(statusChanges).toBe('Status');
    });

    it('should detect Priority labels', () => {
      const priorityChanges = sync['extractLabelType']('Priority: Critical');
      expect(priorityChanges).toBe('Priority');
    });

    it('should return null for unknown labels', () => {
      const unknownChanges = sync['extractLabelType']('Bug');
      expect(unknownChanges).toBeNull();
    });
  });
});
