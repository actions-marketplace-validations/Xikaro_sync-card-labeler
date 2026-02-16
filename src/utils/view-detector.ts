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
