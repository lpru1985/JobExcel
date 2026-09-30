import { useState, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { DataTable } from './components/DataTable';
import { SyncLogs } from './components/SyncLogs';
import { ToastContainer } from './components/ToastContainer';
import { Architecture } from './components/Architecture';
import { SetupGuide } from './components/SetupGuide';
import { useToast } from './hooks/useSyncSimulation';
import { mockRecords, mockLogs, mockStats } from './data/mockData';
import { SyncRecord, SyncLog, SyncStats, SyncEvent } from './types';
import {
  LayoutDashboard,
  Table2,
  ScrollText,
  Code2,
  FolderSync,
  Bell,
  Rocket,
} from 'lucide-react';

type Tab = 'dashboard' | 'data' | 'logs' | 'architecture' | 'setup';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('setup');
  const [records, setRecords] = useState<SyncRecord[]>(mockRecords);
  const [logs, setLogs] = useState<SyncLog[]>(mockLogs);
  const [stats, setStats] = useState<SyncStats>(mockStats);
  const [isSyncRunning, setIsSyncRunning] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  // Simulate a sync run
  const handleRunSync = useCallback(() => {
    setIsSyncRunning(true);

    addToast({
      type: 'info',
      title: 'Синхронизация запущена',
      message: 'Обнаружен файл: data_feb2026.xlsx',
    });

    // Simulate processing steps
    setTimeout(() => {
      addToast({
        type: 'success',
        title: 'INSERT: УС-011',
        message: 'Добавлена новая запись: ООО "НовыйПартнёр"',
      });

      // Add new record
      const newRecord: SyncRecord = {
        id: records.length + 1,
        nomorUS: 'УС-011',
        name: 'ООО "НовыйПартнёр"',
        address: 'г. Уфа, ул. Ленина 50',
        phone: '+7 (347) 111-22-33',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        isDeleted: false,
      };
      setRecords(prev => [...prev, newRecord]);
    }, 2000);

    setTimeout(() => {
      addToast({
        type: 'warning',
        title: 'UPDATE: УС-003',
        message: 'Обновлены данные: ООО "СтройМастер"',
      });

      // Update existing record
      setRecords(prev =>
        prev.map(r =>
          r.nomorUS === 'УС-003'
            ? { ...r, name: 'ООО "СтройМастер" (обновлено)', lastUpdated: new Date().toISOString() }
            : r
        )
      );
    }, 4000);

    setTimeout(() => {
      addToast({
        type: 'error',
        title: 'SOFT DELETE: УС-009',
        message: 'Архивирована запись: ИП Сидоров К.Л. — отсутствует в новом файле',
      });

      // Soft delete a record
      setRecords(prev =>
        prev.map(r =>
          r.nomorUS === 'УС-009'
            ? { ...r, isDeleted: true, status: 'archived' as const, lastUpdated: new Date().toISOString() }
            : r
        )
      );
    }, 6000);

    setTimeout(() => {
      addToast({
        type: 'success',
        title: 'Синхронизация завершена',
        message: 'INSERT: 1, UPDATE: 1, SOFT_DELETE: 1',
      });

      // Update stats
      setStats(prev => ({
        ...prev,
        totalRecords: prev.totalRecords + 1,
        activeRecords: prev.activeRecords, // +1 new -1 archived = same
        archivedRecords: prev.archivedRecords + 1,
        lastSyncTime: new Date().toISOString(),
        totalInserts: prev.totalInserts + 1,
        totalUpdates: prev.totalUpdates + 1,
        totalSoftDeletes: prev.totalSoftDeletes + 1,
      }));

      // Add log entries
      const newLogs: SyncLog[] = [
        {
          id: logs.length + 1,
          timestamp: new Date().toISOString(),
          fileName: 'data_feb2026.xlsx',
          action: 'START',
          details: 'Начало обработки файла data_feb2026.xlsx',
          recordsAffected: 0,
        },
        {
          id: logs.length + 2,
          timestamp: new Date(Date.now() + 2000).toISOString(),
          fileName: 'data_feb2026.xlsx',
          action: 'INSERT',
          details: 'Добавлена запись: УС-011 (ООО "НовыйПартнёр")',
          recordsAffected: 1,
        },
        {
          id: logs.length + 3,
          timestamp: new Date(Date.now() + 4000).toISOString(),
          fileName: 'data_feb2026.xlsx',
          action: 'UPDATE',
          details: 'Обновлена запись: УС-003 (ООО "СтройМастер")',
          recordsAffected: 1,
        },
        {
          id: logs.length + 4,
          timestamp: new Date(Date.now() + 6000).toISOString(),
          fileName: 'data_feb2026.xlsx',
          action: 'SOFT_DELETE',
          details: 'Архивирована запись: УС-009 (ИП Сидоров К.Л.) — отсутствует в новом файле',
          recordsAffected: 1,
        },
        {
          id: logs.length + 5,
          timestamp: new Date(Date.now() + 7000).toISOString(),
          fileName: 'data_feb2026.xlsx',
          action: 'COMPLETE',
          details: 'Синхронизация завершена. INSERT: 1, UPDATE: 1, SOFT_DELETE: 1',
          recordsAffected: 3,
        },
      ];
      setLogs(prev => [...newLogs, ...prev]);

      setIsSyncRunning(false);
    }, 8000);
  }, [addToast, records.length, logs.length]);

  const tabs = [
    { id: 'setup' as Tab, label: '🚀 Запуск', icon: Rocket },
    { id: 'dashboard' as Tab, label: 'Дашборд', icon: LayoutDashboard },
    { id: 'data' as Tab, label: 'Данные', icon: Table2 },
    { id: 'logs' as Tab, label: 'Логи', icon: ScrollText },
    { id: 'architecture' as Tab, label: 'Архитектура', icon: Code2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
                <FolderSync className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Excel↔DB Sync</h1>
                <p className="text-xs text-gray-500 -mt-0.5">ETL System • FastAPI + React</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notification indicator */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
                {toasts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {toasts.length}
                  </span>
                )}
              </button>

              {/* Status indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
                <div className={`w-2 h-2 rounded-full ${isSyncRunning ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span className="text-xs font-medium text-emerald-700">
                  {isSyncRunning ? 'Обработка' : 'Мониторинг'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            isSyncRunning={isSyncRunning}
            onRunSync={handleRunSync}
          />
        )}
        {activeTab === 'data' && (
          <DataTable records={records} />
        )}
        {activeTab === 'logs' && (
          <SyncLogs logs={logs} />
        )}
        {activeTab === 'architecture' && (
          <Architecture />
        )}
        {activeTab === 'setup' && (
          <SetupGuide />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Excel↔DB Sync System v1.0 • Python 3.11 + FastAPI + SQLAlchemy 2.0 + Pandas</span>
            <span>Watchdog • APScheduler • SSE • SQLite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
