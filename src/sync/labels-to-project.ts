import type { Context } from '@actions/github/lib/context';
import type { Octokit } from '@technote-space/github-action-helper/dist/types';
import type { Logger } from '@technote-space/github-action-log-helper';
import type { ConfigType, LabelChange, SyncTarget, ConflictResolution } from '../types';
import { getRelatedInfo } from '../utils/issue';
import { ProjectApi } from '../utils/project-api';
import { ViewDetector } from '../utils/view-detector';
import { ConflictResolver } from '../utils/conflict-resolver';
import { LabelDetector } from '../utils/label-detector';

export class LabelsToProjectSync {
  private projectApi: ProjectApi;
  private viewDetector: ViewDetector;
  private conflictResolver: ConflictResolver;
  private labelDetector: LabelDetector;

  constructor(
    private octokit: Octokit,
    private context: Context,
    private config: ConfigType,
    private logger: Logger
  ) {
    this.projectApi = new ProjectApi(octokit, context);
    this.viewDetector = new ViewDetector(config);
    this.conflictResolver = new ConflictResolver(config);
    this.labelDetector = new LabelDetector();
  }

  async execute(): Promise<boolean> {
    try {
      const labelChanges = this.detectLabelChanges();
      if (labelChanges.length === 0) {
        this.logger.info('No label changes detected.');
        return true;
      }

      const info = await getRelatedInfo(this.context.payload, this.octokit);
      if (!info) {
        this.logger.warn('No related project card found.');
        return false;
      }

      const syncTargets = await this.determineSyncTargets(labelChanges, info);
      if (syncTargets.length === 0) {
        this.logger.info('No sync targets determined.');
        return true;
      }

      await this.performSync(syncTargets);
      return true;
    } catch (error) {
      this.logger.error('Error in labels-to-project sync:', error);
      throw error;
    }
  }

  private detectLabelChanges(): LabelChange[] {
    return this.labelDetector.detectLabelChanges(this.context.payload);
  }

  private async determineSyncTargets(
    labelChanges: LabelChange[],
    info: { projectId: number; issueNumber: number }
  ): Promise<SyncTarget[]> {
    const targets: SyncTarget[] = [];
    const projectName = await this.getProjectName(info.projectId);

    for (const change of labelChanges) {
      const labelType = this.extractLabelType(change.label);
      if (!labelType) continue;

      const viewName = this.viewDetector.findViewForLabelType(projectName, labelType);
      if (!viewName) continue;

      const columnName = this.findColumnNameForLabel(projectName, viewName, change.label);
      if (!columnName) continue;

      targets.push({
        projectId: info.projectId,
        viewName,
        columnName,
        issueNumber: info.issueNumber
      });
    }

    return this.conflictResolver.resolveTargets(targets);
  }

  private extractLabelType(label: string): 'Status' | 'Priority' | null {
    return this.labelDetector.extractLabelType(label);
  }

  private async getProjectName(projectId: number): Promise<string> {
    // Используем существующую логику из utils/misc.ts
    const { getProjectName } = await import('../utils/misc');
    return getProjectName(projectId, this.octokit);
  }

  private findColumnNameForLabel(projectName: string, viewName: string, label: string): string | null {
    const projectConfig = this.config[projectName];
    if (!projectConfig?.views?.[viewName]) return null;

    const viewConfig = projectConfig.views[viewName];
    for (const [columnName, labels] of Object.entries(viewConfig)) {
      const labelArray = Array.isArray(labels) ? labels : [labels];
      if (labelArray.includes(label)) {
        return columnName;
      }
    }

    return null;
  }

  private async performSync(targets: SyncTarget[]): Promise<void> {
    for (const target of targets) {
      this.logger.info(`Moving card to ${target.viewName}/${target.columnName}`);
      await this.projectApi.moveCard(target.issueNumber, target.projectId, target.columnName);
    }
  }
}
