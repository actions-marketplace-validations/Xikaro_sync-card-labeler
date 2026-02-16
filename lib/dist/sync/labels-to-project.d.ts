import type { Context } from '@actions/github/lib/context';
import type { Octokit } from '@technote-space/github-action-helper/dist/types';
import type { Logger } from '@technote-space/github-action-log-helper';
import type { ConfigType } from '../types';
export declare class LabelsToProjectSync {
    private octokit;
    private context;
    private config;
    private logger;
    private projectApi;
    private viewDetector;
    private conflictResolver;
    private labelDetector;
    constructor(octokit: Octokit, context: Context, config: ConfigType, logger: Logger);
    execute(): Promise<boolean>;
    private detectLabelChanges;
    private determineSyncTargets;
    private extractLabelType;
    private getProjectName;
    private findColumnNameForLabel;
    private performSync;
}
