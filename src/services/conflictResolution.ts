// Conflict resolution service for handling concurrent edits
export interface DataConflict {
  id: string;
  table: string;
  entityId: string;
  localData: any;
  remoteData: any;
  timestamp: Date;
  status: 'pending' | 'resolved' | 'ignored';
  resolution?: 'local' | 'remote' | 'merge';
}

class ConflictResolutionService {
  private conflicts: Map<string, DataConflict> = new Map();

  detectConflict(table: string, entityId: string, localData: any, remoteData: any): DataConflict | null {
    // Check if data has actually changed
    if (JSON.stringify(localData) === JSON.stringify(remoteData)) {
      return null;
    }

    // Check timestamps to determine if there's a real conflict
    const localTimestamp = new Date(localData.updatedAt || localData.createdAt);
    const remoteTimestamp = new Date(remoteData.updatedAt || remoteData.createdAt);

    if (Math.abs(localTimestamp.getTime() - remoteTimestamp.getTime()) < 1000) {
      return null; // Within 1 second tolerance
    }

    const conflictId = this.generateConflictId();
    const conflict: DataConflict = {
      id: conflictId,
      table,
      entityId,
      localData,
      remoteData,
      timestamp: new Date(),
      status: 'pending'
    };

    this.conflicts.set(conflictId, conflict);
    return conflict;
  }

  resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merge', mergedData?: any): any {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    let resolvedData: any;

    switch (resolution) {
      case 'local':
        resolvedData = conflict.localData;
        break;
      case 'remote':
        resolvedData = conflict.remoteData;
        break;
      case 'merge':
        resolvedData = mergedData || this.autoMergeData(conflict.localData, conflict.remoteData);
        break;
    }

    conflict.status = 'resolved';
    conflict.resolution = resolution;

    return resolvedData;
  }

  getPendingConflicts(): DataConflict[] {
    return Array.from(this.conflicts.values())
      .filter(conflict => conflict.status === 'pending')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  ignoreConflict(conflictId: string): void {
    const conflict = this.conflicts.get(conflictId);
    if (conflict) {
      conflict.status = 'ignored';
    }
  }

  private autoMergeData(localData: any, remoteData: any): any {
    // Simple merge strategy - prefer remote for most fields, keep local for user-specific fields
    const merged = { ...remoteData };
    
    // Keep local user-specific fields
    const localFields = ['waiterName', 'specialInstructions', 'priority'];
    localFields.forEach(field => {
      if (localData[field] !== undefined) {
        merged[field] = localData[field];
      }
    });

    // Use latest timestamp
    const localTime = new Date(localData.updatedAt || localData.createdAt).getTime();
    const remoteTime = new Date(remoteData.updatedAt || remoteData.createdAt).getTime();
    
    if (localTime > remoteTime) {
      merged.updatedAt = localData.updatedAt;
    }

    return merged;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearResolvedConflicts(): void {
    const resolved = Array.from(this.conflicts.entries())
      .filter(([, conflict]) => conflict.status !== 'pending');
    
    resolved.forEach(([id]) => this.conflicts.delete(id));
  }
}

export const conflictResolutionService = new ConflictResolutionService();
