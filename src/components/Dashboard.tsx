import { SyncStats } from '../types';
import { Database, Plus, RefreshCw, Archive, AlertTriangle, Activity } from 'lucide-react';

interface DashboardProps {
  stats: SyncStats;
  isSyncRunning: boolean;
  onRunSync: () => void;
}

export function Dashboard({ stats, isSyncRunning, onRunSync }: DashboardProps) {
  const statCards = [
    { label: 'Всего записей', value: stats.totalRecords, icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Активные', value: stats.activeRecords, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Архивные', value: stats.archivedRecords, icon: Archive, color: 'text-gray-600', bg: 'bg-gray-100' },
    { label: 'INSERT', value: stats.totalInserts, icon: Plus, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'UPDATE', value: stats.totalUpdates, icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'SOFT DELETE', value: stats.totalSoftDeletes, icon: Archive, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Ошибки', value: stats.totalErrors, icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with sync control */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Панель синхронизации</h2>
          <p className="text-sm text-gray-500 mt-1">
            Последняя синхронизация: {new Date(stats.lastSyncTime).toLocaleString('ru-RU')}
          </p>
        </div>
        <button
          onClick={onRunSync}
          disabled={isSyncRunning}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white
            transition-all duration-200 shadow-md
            ${isSyncRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-95'
            }
          `}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncRunning ? 'animate-spin' : ''}`} />
          {isSyncRunning ? 'Обработка...' : 'Запустить синхронизацию'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {statCards.map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-gray-100 shadow-sm`}>
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</span>
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Status Bar */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isSyncRunning ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="font-medium">
              {isSyncRunning ? 'Воркер обрабатывает файл...' : 'Мониторинг папки /incoming_data/ активен'}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Watchdog • APScheduler • SQLite
          </span>
        </div>
      </div>
    </div>
  );
}
