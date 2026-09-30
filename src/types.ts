// Types for the Excel-DB Sync System

export interface SyncRecord {
  id: number;
  nomorUS: string; // "Номер УС" - Primary Business Key
  name: string;
  address: string;
  phone: string;
  status: 'active' | 'archived';
  lastUpdated: string;
  isDeleted: boolean;
}

export interface SyncLog {
  id: number;
  timestamp: string;
  fileName: string;
  action: 'INSERT' | 'UPDATE' | 'SOFT_DELETE' | 'ERROR' | 'START' | 'COMPLETE';
  details: string;
  recordsAffected: number;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
}

export interface SyncStats {
  totalRecords: number;
  activeRecords: number;
  archivedRecords: number;
  lastSyncTime: string;
  totalInserts: number;
  totalUpdates: number;
  totalSoftDeletes: number;
  totalErrors: number;
}

export interface SyncEvent {
  type: 'INSERT' | 'UPDATE' | 'SOFT_DELETE';
  record: Partial<SyncRecord>;
  timestamp: string;
}
