import type { Octokit } from '@technote-space/github-action-helper/dist/types';
export declare class ProjectApi {
    private octokit;
    constructor(octokit: Octokit);
    moveCard(issueNumber: number, projectId: number, columnName: string): Promise<void>;
    getColumnId(projectId: number, columnName: string): Promise<number | null>;
    findCardId(issueNumber: number, projectId: number): Promise<number | null>;
    getProjectViews(projectId: number): Promise<any[]>;
    getViewColumns(projectId: number, viewId: number): Promise<any[]>;
    getViewByName(projectId: number, viewNameOrId: string | number): Promise<any | null>;
}
