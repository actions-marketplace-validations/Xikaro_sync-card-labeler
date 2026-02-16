import type { ConfigType } from '../types';
export declare class ViewDetector {
    private config;
    constructor(config: ConfigType);
    findViewForLabelType(projectName: string, labelType: string): string | null;
    getAllLabelTypes(projectName: string): string[];
    getViewsForProject(projectName: string): string[];
}
