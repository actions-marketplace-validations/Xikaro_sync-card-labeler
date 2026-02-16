import type { ConfigType, SyncTarget } from '../types';
export declare class ConflictResolver {
    private resolution;
    constructor(config: ConfigType);
    resolveTargets(targets: SyncTarget[]): Promise<SyncTarget[]>;
    private groupTargetsByIssue;
    private resolveIssueTargets;
    private detectViewConflicts;
    private applyResolutionRules;
    private selectLastTarget;
    private applyCustomRules;
    private extractResolutionRules;
}
