import type { ConfigType, ProjectConfig, ViewConfig, SyncDirections } from '../types';
import { Utils } from '@technote-space/github-action-helper';

export class ConfigParser {
  static parse(rawConfig: any): ConfigType {
    const parsed: ConfigType = {};

    for (const [projectName, projectData] of Object.entries(rawConfig)) {
      parsed[projectName] = this.parseProjectConfig(projectData as any);
    }

    return parsed;
  }

  private static parseProjectConfig(projectData: any): ProjectConfig {
    const config: ProjectConfig = {};

    // Проверяем новый формат с views
    if (projectData.views && typeof projectData.views === 'object') {
      config.views = this.parseViews(projectData.views);
    }

    // Проверяем направления синхронизации
    if (projectData.sync_directions && typeof projectData.sync_directions === 'object') {
      config.sync_directions = this.parseSyncDirections(projectData.sync_directions);
    }

    // Проверяем правила разрешения конфликтов
    if (projectData.conflict_resolution && typeof projectData.conflict_resolution === 'object') {
      config.conflict_resolution = projectData.conflict_resolution;
    }

    // Обратная совместимость - копируем остальные поля как колонки
    for (const [key, value] of Object.entries(projectData)) {
      if (!['views', 'sync_directions', 'conflict_resolution'].includes(key)) {
        config[key] = value;
      }
    }

    return config;
  }

  private static parseViews(viewsData: any): ViewConfig {
    const views: ViewConfig = {};

    for (const [viewName, viewData] of Object.entries(viewsData)) {
      views[viewName] = this.parseViewColumns(viewData as any);
    }

    return views;
  }

  private static parseViewColumns(viewData: any): { [columnName: string]: string | string[] } {
    const columns: { [columnName: string]: string | string[] } = {};

    for (const [columnName, columnData] of Object.entries(viewData)) {
      if (Array.isArray(columnData)) {
        columns[columnName] = Utils.uniqueArray(columnData);
      } else if (typeof columnData === 'string') {
        columns[columnName] = columnData;
      } else {
        // Преобразуем другие типы в массив строк
        columns[columnName] = Utils.uniqueArray([String(columnData)]);
      }
    }

    return columns;
  }

  private static parseSyncDirections(directionsData: any): SyncDirections {
    const directions: SyncDirections = {};

    if (typeof directionsData.project_to_labels === 'boolean') {
      directions.project_to_labels = directionsData.project_to_labels;
    }

    if (typeof directionsData.labels_to_project === 'boolean') {
      directions.labels_to_project = directionsData.labels_to_project;
    }

    return directions;
  }

  static isLegacyFormat(config: ConfigType): boolean {
    // Проверяем, используется ли старый формат конфигурации
    for (const projectConfig of Object.values(config)) {
      if (!projectConfig.views) {
        return true;
      }
    }
    return false;
  }

  static migrateLegacyConfig(legacyConfig: ConfigType): ConfigType {
    // Мигрируем старый формат в новый
    const migrated: ConfigType = {};

    for (const [projectName, projectConfig] of Object.entries(legacyConfig)) {
      migrated[projectName] = {
        views: {
          'Default': this.extractColumnsFromLegacy(projectConfig)
        },
        sync_directions: {
          project_to_labels: true,
          labels_to_project: false
        },
        // Копируем остальные поля
        ...Object.fromEntries(
          Object.entries(projectConfig).filter(([key]) => 
            !['views', 'sync_directions', 'conflict_resolution'].includes(key)
          )
        )
      };
    }

    return migrated;
  }

  private static extractColumnsFromLegacy(projectConfig: ProjectConfig): { [columnName: string]: string | string[] } {
    const columns: { [columnName: string]: string | string[] } = {};

    for (const [key, value] of Object.entries(projectConfig)) {
      if (typeof value === 'string' || Array.isArray(value)) {
        columns[key] = value;
      }
    }

    return columns;
  }

  static validateConfig(config: ConfigType): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [projectName, projectConfig] of Object.entries(config)) {
      // Валидация views
      if (projectConfig.views) {
        for (const [viewName, viewConfig] of Object.entries(projectConfig.views)) {
          for (const [columnName, labels] of Object.entries(viewConfig)) {
            if (!Array.isArray(labels) && typeof labels !== 'string') {
              errors.push(`Invalid labels format for ${projectName}/${viewName}/${columnName}`);
            }
          }
        }
      }

      // Валидация sync_directions
      if (projectConfig.sync_directions) {
        const { project_to_labels, labels_to_project } = projectConfig.sync_directions;
        if (project_to_labels !== undefined && typeof project_to_labels !== 'boolean') {
          errors.push(`Invalid project_to_labels value for ${projectName}`);
        }
        if (labels_to_project !== undefined && typeof labels_to_project !== 'boolean') {
          errors.push(`Invalid labels_to_project value for ${projectName}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
