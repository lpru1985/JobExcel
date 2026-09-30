import { SyncLog } from '../types';
import { FileText, Plus, RefreshCw, Archive, AlertCircle, Play, CheckCircle2 } from 'lucide-react';

interface SyncLogsProps {
  logs: SyncLog[];
}

const actionIcons = {
  INSERT: Plus,
  UPDATE: RefreshCw,
  SOFT_DELETE: Archive,
  ERROR: AlertCircle,
  START: Play,
  COMPLETE: CheckCircle2,
};

const actionColors = {
  INSERT: 'text-green-600 bg-green-50',
  UPDATE: 'text-amber-600 bg-amber-50',
  SOFT_DELETE: 'text-red-600 bg-red-50',
  ERROR: 'text-red-700 bg-red-100',
  START: 'text-blue-600 bg-blue-50',
  COMPLETE: 'text-emerald-600 bg-emerald-50',
};

export function SyncLogs({ logs }: SyncLogsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Логи синхронизации</h2>
        <span className="text-xs text-gray-400 font-mono">sync_logs table</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {logs.map(log => {
            const Icon = actionIcons[log.action];
            const colorClass = actionColors[log.action];

            return (
              <div key={log.id} className="flex items-start gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${colorClass}`}>
                      {log.action}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {log.fileName}
                    </span>
                    {log.recordsAffected > 0 && (
                      <span className="text-xs text-gray-400">
                        • {log.recordsAffected} записей
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{log.details}</p>
                </div>
                <div className="flex-shrink-0 text-xs text-gray-400 font-mono">
                  {new Date(log.timestamp).toLocaleString('ru-RU', {
                    day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
