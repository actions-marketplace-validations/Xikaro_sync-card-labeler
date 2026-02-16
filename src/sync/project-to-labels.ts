import type { Context } from '@actions/github/lib/context';
import type { Octokit } from '@technote-space/github-action-helper/dist/types';
import type { Logger } from '@technote-space/github-action-log-helper';
import type { ConfigType } from '../types';
import { getRelatedInfo, getLabels, addLabels, removeLabels } from '../utils/issue';
import { getAddLabels, getRemoveLabels } from '../utils/label';
import { getColumnName, getProjectName } from '../utils/misc';

// Типы для обратной совместимости с существующими функциями
type ProjectConfigType = {
  [key: string]: string | string[];
};
type LegacyConfigType = {
  [key: string]: ProjectConfigType;
};

export class ProjectToLabelsSync {
  constructor(
    private octokit: Octokit,
    private context: Context,
    private config: ConfigType,
    private logger: Logger
  ) {}

  async execute(): Promise<boolean> {
    try {
      this.logger.startProcess('Getting card related info...');
      const info = await getRelatedInfo(this.context.payload, this.octokit);
      if (!info) {
        this.logger.endProcess();
        this.logger.warn('There is not related card with this issue.');
        return false;
      }

      const { projectId, issueNumber } = info;
      this.logger.info('Getting project name... %d', projectId);
      const project = await getProjectName(projectId, this.octokit);
      this.logger.displayStdout(project);

      this.logger.info('Getting column name... %d', this.context.payload.project_card.column_id);
      const column = await getColumnName(this.context.payload.project_card.column_id, this.octokit);
      this.logger.displayStdout(column);

      this.logger.startProcess('Getting current labels...');
      const currentLabels = await getLabels(issueNumber, this.octokit, this.context);

      // Конвертируем новую конфигурацию в старый формат для совместимости
      const legacyConfig = this.convertToLegacyConfig();
      const labelsToRemove = getRemoveLabels(currentLabels, project, column, legacyConfig);
      const labelsToAdd = getAddLabels(currentLabels, project, column, legacyConfig);

      if (labelsToRemove.length) {
        this.logger.startProcess('Removing labels...');
        this.logger.displayStdout(labelsToRemove);
        await removeLabels(issueNumber, labelsToRemove, this.octokit, this.context);
      }
      if (labelsToAdd.length) {
        this.logger.startProcess('Adding labels...');
        this.logger.displayStdout(labelsToAdd);
        await addLabels(issueNumber, labelsToAdd, this.octokit, this.context);
      }

      this.logger.endProcess();
      this.logger.info('Removed count: %d', labelsToRemove.length);
      this.logger.info('Added count: %d', labelsToAdd.length);
      return true;
    } catch (error) {
      this.logger.error('Error in project-to-labels sync:', error);
      throw error;
    }
  }

  private convertToLegacyConfig(): LegacyConfigType {
    const legacy: LegacyConfigType = {};

    for (const [projectName, projectConfig] of Object.entries(this.config)) {
      const legacyProject: ProjectConfigType = {};

      // Если есть views, объединяем все колонки из всех view
      if (projectConfig.views) {
        for (const viewConfig of Object.values(projectConfig.views)) {
          Object.assign(legacyProject, viewConfig);
        }
      }

      // Добавляем остальные поля для обратной совместимости
      for (const [key, value] of Object.entries(projectConfig)) {
        if (!['views', 'sync_directions', 'conflict_resolution'].includes(key)) {
          if (typeof value === 'string' || Array.isArray(value)) {
            legacyProject[key] = value;
          }
        }
      }

      legacy[projectName] = legacyProject;
    }

    return legacy;
  }
}
