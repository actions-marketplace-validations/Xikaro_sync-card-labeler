import { describe, it, expect, beforeEach } from 'vitest';
import { ViewDetector } from './view-detector';
import type { ConfigType } from '../types';

describe('ViewDetector', () => {
  const mockConfig: ConfigType = {
    'Roadmap-Team': {
      views: {
        Status: {
          Dropped: ['Status: Dropped'],
          Backlog: ['Status: Backlog'],
          Ready: ['Status: Ready'],
          'In Progress': ['Status: In Progress'],
          Done: ['Status: Done']
        },
        Priority: {
          Critical: ['Priority: Critical'],
          High: ['Priority: High'],
          Medium: ['Priority: Medium'],
          Low: ['Priority: Low'],
          'Long-term plans': ['Priority: Long-term plans']
        }
      },
      sync_directions: {
        project_to_labels: true,
        labels_to_project: true
      },
      conflict_resolution: {
        priority_over_status: true,
        last_change_wins: true
      }
    },
    'Another-Project': {
      views: {
        CustomView: {
          Column1: ['Label: Value'],
          Column2: ['Another: Label']
        }
      }
    }
  };

  let detector: ViewDetector;

  beforeEach(() => {
    detector = new ViewDetector(mockConfig);
  });

  describe('findViewForLabelType', () => {
    it('should return view name for existing Status view', () => {
      const result = detector.findViewForLabelType('Roadmap-Team', 'Status');
      expect(result).toBe('Status');
    });

    it('should return view name for existing Priority view', () => {
      const result = detector.findViewForLabelType('Roadmap-Team', 'Priority');
      expect(result).toBe('Priority');
    });

    it('should return view name for custom view', () => {
      const result = detector.findViewForLabelType('Another-Project', 'CustomView');
      expect(result).toBe('CustomView');
    });

    it('should return null for non-existing view', () => {
      const result = detector.findViewForLabelType('Roadmap-Team', 'NonExisting');
      expect(result).toBeNull();
    });

    it('should return null for non-existing project', () => {
      const result = detector.findViewForLabelType('NonExistingProject', 'Status');
      expect(result).toBeNull();
    });

    it('should return null for project without views', () => {
      const configWithoutViews: ConfigType = {
        'Project-Without-Views': {}
      };
      const detectorWithoutViews = new ViewDetector(configWithoutViews);
      const result = detectorWithoutViews.findViewForLabelType('Project-Without-Views', 'Status');
      expect(result).toBeNull();
    });
  });

  describe('getAllLabelTypes', () => {
    it('should return all view names for project', () => {
      const result = detector.getAllLabelTypes('Roadmap-Team');
      expect(result).toEqual(['Status', 'Priority']);
    });

    it('should return custom view names', () => {
      const result = detector.getAllLabelTypes('Another-Project');
      expect(result).toEqual(['CustomView']);
    });

    it('should return empty array for non-existing project', () => {
      const result = detector.getAllLabelTypes('NonExistingProject');
      expect(result).toEqual([]);
    });

    it('should return empty array for project without views', () => {
      const configWithoutViews: ConfigType = {
        'Project-Without-Views': {}
      };
      const detectorWithoutViews = new ViewDetector(configWithoutViews);
      const result = detectorWithoutViews.getAllLabelTypes('Project-Without-Views');
      expect(result).toEqual([]);
    });
  });

  describe('getViewsForProject', () => {
    it('should return all view names for project', () => {
      const result = detector.getViewsForProject('Roadmap-Team');
      expect(result).toEqual(['Status', 'Priority']);
    });

    it('should return empty array for non-existing project', () => {
      const result = detector.getViewsForProject('NonExistingProject');
      expect(result).toEqual([]);
    });
  });
});
