import type { Context } from '@actions/github/lib/context';
import type { Octokit } from '@technote-space/github-action-helper/dist/types';
import type { Logger } from '@technote-space/github-action-log-helper';
import { getConfig } from '@technote-space/github-action-config-helper';
import { ProjectNotFoundError } from './errors';
import { getRelatedInfo } from './utils/issue';
import { getColumnName, getConfigFilename, getProjectName, isProjectConfigRequired } from './utils/misc';
import { ConfigParser } from './config/parser';
import { ProjectToLabelsSync } from './sync/project-to-labels';
import { LabelsToProjectSync } from './sync/labels-to-project';
import type { ConfigType } from './types';

export const execute = async(logger: Logger, octokit: Octokit, context: Context): Promise<boolean> => {
  const rawConfig = await getConfig(getConfigFilename(), octokit, context);
  if (false === rawConfig) {
    logger.warn('There is no valid config file.');
    logger.warn('Please create config file: %s', getConfigFilename());
    return false;
  }

  // Парсим конфигурацию с поддержкой нового формата
  const config = ConfigParser.parse(rawConfig);
  
  // Валидация конфигурации
  const validation = ConfigParser.validateConfig(config);
  if (!validation.valid) {
    logger.error('Configuration validation failed:');
    validation.errors.forEach(error => logger.error('- %s', error));
    return false;
  }

  // Определяем тип события и направление синхронизации
  const eventType = context.payload.action;
  const isProjectCardEvent = context.eventName === 'project_card';
  const isLabelEvent = context.eventName === 'issues' || context.eventName === 'pull_request';

  try {
    if (isProjectCardEvent) {
      // Синхронизация проекта → метки
      const projectSync = new ProjectToLabelsSync(octokit, context, config, logger);
      
      // Проверяем, включена ли синхронизация проекта → метки
      const projectName = await getProjectNameFromContext(context, octokit);
      if (isSyncEnabled(config, projectName, 'project_to_labels')) {
        return await projectSync.execute();
      } else {
        logger.info('Project to labels sync is disabled for this project.');
        return true;
      }
    } else if (isLabelEvent && (eventType === 'labeled' || eventType === 'unlabeled')) {
      // Синхронизация меток → проект
      const labelSync = new LabelsToProjectSync(octokit, context, config, logger);
      
      // Проверяем, включена ли синхронизация меток → проект
      const projectName = await getProjectNameFromContext(context, octokit);
      if (isSyncEnabled(config, projectName, 'labels_to_project')) {
        return await labelSync.execute();
      } else {
        logger.info('Labels to project sync is disabled for this project.');
        return true;
      }
    } else {
      logger.info('Event type %s is not supported for sync.', context.eventName);
      return true;
    }
  } catch (error) {
    if (!isProjectConfigRequired() && error instanceof ProjectNotFoundError) {
      logger.warn(error.message);
      return true;
    }

    throw error;
  }
};

// Вспомогательные функции
const isSyncEnabled = (config: ConfigType, projectName: string, direction: 'project_to_labels' | 'labels_to_project'): boolean => {
  const projectConfig = config[projectName];
  if (!projectConfig?.sync_directions) {
    // По умолчанию включена только синхронизация проекта → метки
    return direction === 'project_to_labels';
  }
  
  return projectConfig.sync_directions[direction] === true;
};

const getProjectNameFromContext = async(context: Context, octokit: Octokit): Promise<string> => {
  if (context.eventName === 'project_card') {
    const info = await getRelatedInfo(context.payload, octokit);
    if (!info) {
      throw new Error('Could not determine project from context');
    }
    return getProjectName(info.projectId, octokit);
  } else {
    // Для событий label нужно найти проект через issue
    const issueNumber = context.payload.issue?.number || context.payload.pull_request?.number;
    if (!issueNumber) {
      throw new Error('Could not determine issue number from context');
    }
    
    // Здесь можно добавить логику поиска проекта по issue
    // Пока возвращаем пустую строку
    return '';
  }
};
