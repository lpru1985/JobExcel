import { SyncRecord, SyncLog, SyncStats } from '../types';

export const mockRecords: SyncRecord[] = [
  { id: 1, nomorUS: 'УС-001', name: 'ООО "ТехноСервис"', address: 'г. Москва, ул. Ленина 15', phone: '+7 (495) 123-45-67', status: 'active', lastUpdated: '2026-01-15T10:30:00', isDeleted: false },
  { id: 2, nomorUS: 'УС-002', name: 'ИП Иванов А.В.', address: 'г. Санкт-Петербург, Невский пр. 42', phone: '+7 (812) 234-56-78', status: 'active', lastUpdated: '2026-01-15T10:30:00', isDeleted: false },
  { id: 3, nomorUS: 'УС-003', name: 'ООО "СтройМастер"', address: 'г. Казань, ул. Баумана 8', phone: '+7 (843) 345-67-89', status: 'active', lastUpdated: '2026-01-14T14:20:00', isDeleted: false },
  { id: 4, nomorUS: 'УС-004', name: 'ЗАО "ЭнергоПром"', address: 'г. Екатеринбург, ул. Мира 23', phone: '+7 (343) 456-78-90', status: 'archived', lastUpdated: '2026-01-13T09:15:00', isDeleted: true },
  { id: 5, nomorUS: 'УС-005', name: 'ООО "Логистик Плюс"', address: 'г. Новосибирск, Красный пр. 100', phone: '+7 (383) 567-89-01', status: 'active', lastUpdated: '2026-01-15T10:30:00', isDeleted: false },
  { id: 6, nomorUS: 'УС-006', name: 'ИП Петрова М.С.', address: 'г. Краснодар, ул. Красная 55', phone: '+7 (861) 678-90-12', status: 'active', lastUpdated: '2026-01-15T10:30:00', isDeleted: false },
  { id: 7, nomorUS: 'УС-007', name: 'ООО "ФармТех"', address: 'г. Нижний Новгород, ул. Горького 12', phone: '+7 (831) 789-01-23', status: 'archived', lastUpdated: '2026-01-12T16:45:00', isDeleted: true },
  { id: 8, nomorUS: 'УС-008', name: 'ООО "АгроХолдинг"', address: 'г. Ростов-на-Дону, пр. Ворошиловский 77', phone: '+7 (863) 890-12-34', status: 'active', lastUpdated: '2026-01-15T10:30:00', isDeleted: false },
  { id: 9, nomorUS: 'УС-009', name: 'ИП Сидоров К.Л.', address: 'г. Самара, ул. Молодогвардейская 33', phone: '+7 (846) 901-23-45', status: 'active', lastUpdated: '2026-01-14T11:00:00', isDeleted: false },
  { id: 10, nomorUS: 'УС-010', name: 'ООО "МедиаГрупп"', address: 'г. Воронеж, ул. Плехановская 18', phone: '+7 (473) 012-34-56', status: 'active', lastUpdated: '2026-01-15T10:30:00', isDeleted: false },
];

export const mockLogs: SyncLog[] = [
  { id: 1, timestamp: '2026-01-15T10:30:00', fileName: 'data_jan2026.xlsx', action: 'START', details: 'Начало обработки файла data_jan2026.xlsx', recordsAffected: 0 },
  { id: 2, timestamp: '2026-01-15T10:30:01', fileName: 'data_jan2026.xlsx', action: 'INSERT', details: 'Добавлена запись: УС-006 (ИП Петрова М.С.)', recordsAffected: 1 },
  { id: 3, timestamp: '2026-01-15T10:30:01', fileName: 'data_jan2026.xlsx', action: 'UPDATE', details: 'Обновлена запись: УС-001 (ООО "ТехноСервис")', recordsAffected: 1 },
  { id: 4, timestamp: '2026-01-15T10:30:02', fileName: 'data_jan2026.xlsx', action: 'SOFT_DELETE', details: 'Архивирована запись: УС-004 (ЗАО "ЭнергоПром") — отсутствует в новом файле', recordsAffected: 1 },
  { id: 5, timestamp: '2026-01-15T10:30:02', fileName: 'data_jan2026.xlsx', action: 'SOFT_DELETE', details: 'Архивирована запись: УС-007 (ООО "ФармТех") — отсутствует в новом файле', recordsAffected: 1 },
  { id: 6, timestamp: '2026-01-15T10:30:03', fileName: 'data_jan2026.xlsx', action: 'COMPLETE', details: 'Синхронизация завершена. INSERT: 1, UPDATE: 1, SOFT_DELETE: 2', recordsAffected: 4 },
  { id: 7, timestamp: '2026-01-14T14:20:00', fileName: 'data_dec2025.xlsx', action: 'START', details: 'Начало обработки файла data_dec2025.xlsx', recordsAffected: 0 },
  { id: 8, timestamp: '2026-01-14T14:20:01', fileName: 'data_dec2025.xlsx', action: 'INSERT', details: 'Добавлена запись: УС-009 (ИП Сидоров К.Л.)', recordsAffected: 1 },
  { id: 9, timestamp: '2026-01-14T14:20:02', fileName: 'data_dec2025.xlsx', action: 'UPDATE', details: 'Обновлены 5 записей', recordsAffected: 5 },
  { id: 10, timestamp: '2026-01-14T14:20:03', fileName: 'data_dec2025.xlsx', action: 'COMPLETE', details: 'Синхронизация завершена. INSERT: 1, UPDATE: 5, SOFT_DELETE: 0', recordsAffected: 6 },
];

export const mockStats: SyncStats = {
  totalRecords: 10,
  activeRecords: 8,
  archivedRecords: 2,
  lastSyncTime: '2026-01-15T10:30:03',
  totalInserts: 2,
  totalUpdates: 6,
  totalSoftDeletes: 2,
  totalErrors: 0,
};

// Simulated sync events for real-time notification demo
export const simulatedSyncEvents = [
  { type: 'INSERT' as const, record: { nomorUS: 'УС-011', name: 'ООО "НовыйПартнёр"' }, delay: 3000 },
  { type: 'UPDATE' as const, record: { nomorUS: 'УС-003', name: 'ООО "СтройМастер" (обновлено)' }, delay: 5000 },
  { type: 'SOFT_DELETE' as const, record: { nomorUS: 'УС-009', name: 'ИП Сидоров К.Л.' }, delay: 7000 },
];
