import { SyncRecord } from '../types';
import { Archive, CheckCircle, Search } from 'lucide-react';
import { useState } from 'react';

interface DataTableProps {
  records: SyncRecord[];
}

export function DataTable({ records }: DataTableProps) {
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.nomorUS.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = showArchived || !r.isDeleted;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Данные из БД</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по Номер УС / Название..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-gray-300"
            />
            Показать архивные
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Номер УС</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Название</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Адрес</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Телефон</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Статус</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Обновлено</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => (
                <tr
                  key={record.id}
                  className={`border-b border-gray-100 transition-colors ${
                    record.isDeleted
                      ? 'bg-red-50/50 opacity-60'
                      : 'hover:bg-blue-50/30'
                  }`}
                >
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{record.id}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                      {record.nomorUS}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {record.isDeleted && <span className="line-through text-gray-400">{record.name}</span>}
                    {!record.isDeleted && record.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{record.address}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs font-mono">{record.phone}</td>
                  <td className="px-4 py-3">
                    {record.isDeleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                        <Archive className="w-3 h-3" />
                        archived
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(record.lastUpdated).toLocaleString('ru-RU', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRecords.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Записи не найдены</p>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">
        Показано {filteredRecords.length} из {records.length} записей. Ключ: «Номер УС» (Primary Business Key)
      </p>
    </div>
  );
}

function Database(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <path d="M3 12a9 3 0 0 0 18 0" />
    </svg>
  );
}
