import type { ConfigType, SyncTarget, ConflictResolution } from '../types';

export class ConflictResolver {
  private resolution: ConflictResolution;

  constructor(config: ConfigType) {
    // Извлекаем правила разрешения конфликтов из конфигурации
    this.resolution = this.extractResolutionRules(config);
  }

  async resolveTargets(targets: SyncTarget[]): Promise<SyncTarget[]> {
    if (targets.length <= 1) {
      return targets;
    }

    // Группируем цели по issue
    const groupedTargets = this.groupTargetsByIssue(targets);
    const resolvedTargets: SyncTarget[] = [];

    for (const [issueNumber, issueTargets] of groupedTargets) {
      const resolved = await this.resolveIssueTargets(issueNumber, issueTargets);
      resolvedTargets.push(...resolved);
    }

    return resolvedTargets;
  }

  private groupTargetsByIssue(targets: SyncTarget[]): Map<number, SyncTarget[]> {
    const grouped = new Map<number, SyncTarget[]>();
    
    for (const target of targets) {
      if (!grouped.has(target.issueNumber)) {
        grouped.set(target.issueNumber, []);
      }
      grouped.get(target.issueNumber)!.push(target);
    }
    
    return grouped;
  }

  private async resolveIssueTargets(issueNumber: number, targets: SyncTarget[]): Promise<SyncTarget[]> {
    // Проверяем конфликты между разными view
    const viewConflicts = this.detectViewConflicts(targets);
    
    if (viewConflicts.length === 0) {
      return targets;
    }

    // Применяем правила разрешения конфликтов
    return this.applyResolutionRules(targets, viewConflicts);
  }

  private detectViewConflicts(targets: SyncTarget[]): Array<{type: string, targets: SyncTarget[]}> {
    const conflicts: Array<{type: string, targets: SyncTarget[]}> = [];
    
    // Группируем по типам меток
    const statusTargets = targets.filter(t => t.viewName === 'Status');
    const priorityTargets = targets.filter(t => t.viewName === 'Priority');
    
    if (statusTargets.length > 1) {
      conflicts.push({ type: 'status_conflict', targets: statusTargets });
    }
    
    if (priorityTargets.length > 1) {
      conflicts.push({ type: 'priority_conflict', targets: priorityTargets });
    }
    
    if (statusTargets.length > 0 && priorityTargets.length > 0) {
      conflicts.push({ 
        type: 'view_conflict', 
        targets: [...statusTargets, ...priorityTargets] 
      });
    }
    
    return conflicts;
  }

  private applyResolutionRules(targets: SyncTarget[], conflicts: Array<{type: string, targets: SyncTarget[]}>): SyncTarget[] {
    let resolvedTargets = [...targets];

    for (const conflict of conflicts) {
      switch (conflict.type) {
        case 'view_conflict':
          if (this.resolution.priority_over_status) {
            // Priority имеет приоритет над Status
            resolvedTargets = resolvedTargets.filter(t => t.viewName !== 'Status');
          }
          break;
          
        case 'status_conflict':
          // Для конфликтов Status выбираем последнюю колонку
          resolvedTargets = this.selectLastTarget(resolvedTargets, conflict.targets);
          break;
          
        case 'priority_conflict':
          // Для конфликтов Priority выбираем последнюю колонку
          resolvedTargets = this.selectLastTarget(resolvedTargets, conflict.targets);
          break;
      }
    }

    // Применяем кастомные правила
    if (this.resolution.custom_rules) {
      resolvedTargets = this.applyCustomRules(resolvedTargets);
    }

    return resolvedTargets;
  }

  private selectLastTarget(targets: SyncTarget[], conflictTargets: SyncTarget[]): SyncTarget[] {
    // Удаляем все конфликтующие цели кроме последней
    const toRemove = conflictTargets.slice(0, -1);
    return targets.filter(t => !toRemove.includes(t));
  }

  private applyCustomRules(targets: SyncTarget[]): SyncTarget[] {
    // Применяем кастомные правила из конфигурации
    for (const [labelType, rule] of Object.entries(this.resolution.custom_rules || {})) {
      if (rule === 'priority') {
        // Приоритет для этого типа меток
        const priorityTargets = targets.filter(t => 
          t.viewName && t.viewName.toLowerCase().includes(labelType.toLowerCase())
        );
        if (priorityTargets.length > 0) {
          // Оставляем только priority цели
          return priorityTargets;
        }
      }
    }
    
    return targets;
  }

  private extractResolutionRules(config: ConfigType): ConflictResolution {
    // Извлекаем правила из глобальной конфигурации или из конфигурации проекта
    const defaultRules: ConflictResolution = {
      priority_over_status: true,
      last_change_wins: true
    };

    // Ищем глобальные правила
    for (const projectConfig of Object.values(config)) {
      if (projectConfig.conflict_resolution) {
        return { ...defaultRules, ...projectConfig.conflict_resolution };
      }
    }

    return defaultRules;
  }
}
