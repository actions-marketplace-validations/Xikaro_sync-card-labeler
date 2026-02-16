export interface ColumnConfig {
    [columnName: string]: string | string[];
}
export interface ViewConfig {
    [viewName: string]: ColumnConfig;
}
export interface SyncDirections {
    project_to_labels?: boolean;
    labels_to_project?: boolean;
}
export interface ProjectConfig {
    views?: ViewConfig;
    sync_directions?: SyncDirections;
    conflict_resolution?: ConflictResolution;
    [key: string]: any;
}
export interface ConfigType {
    [projectName: string]: ProjectConfig;
}
export interface LabelChange {
    type: 'added' | 'removed';
    label: string;
    timestamp: number;
}
export interface SyncTarget {
    projectId: number;
    viewName?: string;
    columnName: string;
    issueNumber: number;
}
export interface ConflictResolution {
    priority_over_status?: boolean;
    last_change_wins?: boolean;
    custom_rules?: {
        [labelType: string]: string;
    };
}
