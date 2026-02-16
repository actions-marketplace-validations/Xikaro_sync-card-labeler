import type { Context } from '@actions/github/lib/context';
import type { Octokit } from '@technote-space/github-action-helper/dist/types';
import type { Logger } from '@technote-space/github-action-log-helper';
import type { ConfigType } from '../types';
export declare class ProjectToLabelsSync {
    private octokit;
    private context;
    private config;
    private logger;
    constructor(octokit: Octokit, context: Context, config: ConfigType, logger: Logger);
    execute(): Promise<boolean>;
    private convertToLegacyConfig;
}
