import type { LabelChange } from '../types';

export class LabelDetector {
  detectLabelChanges(payload: any): LabelChange[] {
    const changes: LabelChange[] = [];
    const timestamp = Date.now();

    if (payload.action === 'labeled' && payload.label) {
      changes.push({
        type: 'added',
        label: payload.label.name,
        timestamp
      });
    } else if (payload.action === 'unlabeled' && payload.label) {
      changes.push({
        type: 'removed',
        label: payload.label.name,
        timestamp
      });
    } else if (payload.action === 'edited' && payload.changes?.labels) {
      // Обработка изменений меток через API
      const { labels } = payload.changes;
      
      if (labels.from && labels.to) {
        // Находим добавленные и удаленные метки
        const fromLabels = new Set(labels.from.map((l: any) => l.name));
        const toLabels = new Set(labels.to.map((l: any) => l.name));
        
        // Добавленные метки
        for (const label of toLabels) {
          if (!fromLabels.has(label)) {
            changes.push({
              type: 'added',
              label: String(label),
              timestamp
            });
          }
        }
        
        // Удаленные метки
        for (const label of fromLabels) {
          if (!toLabels.has(label)) {
            changes.push({
              type: 'removed',
              label: String(label),
              timestamp
            });
          }
        }
      }
    }

    return changes;
  }

  extractLabelType(label: string): 'Status' | 'Priority' | null {
    if (label.startsWith('Status:')) return 'Status';
    if (label.startsWith('Priority:')) return 'Priority';
    return null;
  }

  extractLabelValue(label: string): string | null {
    const type = this.extractLabelType(label);
    if (!type) return null;
    
    return label.substring(type.length + 1).trim();
  }

  groupChangesByType(changes: LabelChange[]): { Status: LabelChange[], Priority: LabelChange[], other: LabelChange[] } {
    const grouped = {
      Status: [] as LabelChange[],
      Priority: [] as LabelChange[],
      other: [] as LabelChange[]
    };

    for (const change of changes) {
      const type = this.extractLabelType(change.label);
      if (type === 'Status') {
        grouped.Status.push(change);
      } else if (type === 'Priority') {
        grouped.Priority.push(change);
      } else {
        grouped.other.push(change);
      }
    }

    return grouped;
  }

  getEffectiveLabels(changes: LabelChange[], currentLabels: string[]): string[] {
    // Применяем изменения к текущим меткам
    let effective = [...currentLabels];

    for (const change of changes) {
      if (change.type === 'added') {
        if (!effective.includes(change.label)) {
          effective.push(change.label);
        }
      } else if (change.type === 'removed') {
        const index = effective.indexOf(change.label);
        if (index !== -1) {
          effective.splice(index, 1);
        }
      }
    }

    return effective;
  }

  hasConflictingChanges(changes: LabelChange[]): boolean {
    const grouped = this.groupChangesByType(changes);
    
    // Проверяем конфликты в пределах одного типа
    for (const type of ['Status', 'Priority'] as const) {
      const typeChanges = grouped[type];
      if (typeChanges.length > 1) {
        // Если есть несколько изменений одного типа, это потенциальный конфликт
        const hasAddAndRemove = typeChanges.some(c => c.type === 'added') && 
                               typeChanges.some(c => c.type === 'removed');
        if (hasAddAndRemove) {
          return true;
        }
      }
    }

    return false;
  }

  resolveConflicts(changes: LabelChange[]): LabelChange[] {
    // Простое разрешение конфликтов: последнее изменение выигрывает
    return changes.sort((a, b) => a.timestamp - b.timestamp);
  }
}
