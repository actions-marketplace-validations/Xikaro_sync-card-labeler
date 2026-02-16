import type { LabelChange } from '../types';
export declare class LabelDetector {
    detectLabelChanges(payload: any): LabelChange[];
    extractLabelType(label: string): 'Status' | 'Priority' | null;
    extractLabelValue(label: string): string | null;
    groupChangesByType(changes: LabelChange[]): {
        Status: LabelChange[];
        Priority: LabelChange[];
        other: LabelChange[];
    };
    getEffectiveLabels(changes: LabelChange[], currentLabels: string[]): string[];
    hasConflictingChanges(changes: LabelChange[]): boolean;
    resolveConflicts(changes: LabelChange[]): LabelChange[];
}
