import type { ConfigType } from '../types';

export class ViewDetector {
  constructor(private config: ConfigType) {}

  findViewForLabelType(projectName: string, labelType: string): string | null {
    const projectConfig = this.config[projectName];
    if (!projectConfig?.views) return null;

    // Ищем view по имени из конфигурации
    if (projectConfig.views[labelType]) {
      return labelType;
    }

    // Если не нашли по имени, возможно это цифровой ID
    const viewId = parseInt(labelType);
    if (!isNaN(viewId)) {
      // Ищем view по ID в конфигурации
      const viewNames = Object.keys(projectConfig.views);
      const viewIndex = viewId - 1; // view ID начинаются с 1
      
      if (viewIndex >= 0 && viewIndex < viewNames.length) {
        const foundView = viewNames[viewIndex];
        if (foundView) {
          console.log(`Found view by ID ${viewId}: ${foundView}`);
          return foundView;
        }
      }
    }

    return null;
  }

  getAllLabelTypes(projectName: string): string[] {
    const projectConfig = this.config[projectName];
    if (!projectConfig?.views) return [];
    
    // Возвращаем имена всех view из конфигурации
    return Object.keys(projectConfig.views);
  }

  getViewsForProject(projectName: string): string[] {
    const projectConfig = this.config[projectName];
    if (!projectConfig?.views) return [];
    
    return Object.keys(projectConfig.views);
  }
}
