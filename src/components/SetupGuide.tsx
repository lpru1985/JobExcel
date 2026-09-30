import { useState, useEffect } from 'react';
import {
  Terminal,
  Copy,
  Check,
  ChevronRight,
  FolderOpen,
  Download,
  Play,
  Globe,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Circle,
  Monitor,
  Apple,
  Server,
  ExternalLink,
} from 'lucide-react';

type OS = 'windows' | 'macos' | 'linux';

interface Step {
  id: number;
  title: string;
  description: string;
  commands?: { label: string; command: string }[];
  tip?: string;
  warning?: string;
  link?: { url: string; label: string };
}

export function SetupGuide() {
  const [detectedOS, setDetectedOS] = useState<OS>('windows');
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Определяем ОС пользователя
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) setDetectedOS('windows');
    else if (ua.includes('mac')) setDetectedOS('macos');
    else setDetectedOS('linux');
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const toggleStep = (id: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalSteps = 8;
  const progress = Math.round((completedSteps.size / totalSteps) * 100);

  const getSteps = (): Step[] => [
    {
      id: 1,
      title: 'Распакуйте архив',
      description: 'Распакуйте скачанный ZIP-архив в удобную папку на вашем компьютере.',
      commands: detectedOS === 'windows' ? [
        { label: 'Через PowerShell', command: 'Expand-Archive -Path .\\excel-sync-system.zip -DestinationPath .\\excel-sync-system' }
      ] : [
        { label: 'В терминале', command: 'unzip excel-sync-system.zip -d excel-sync-system' }
      ],
      tip: 'Или просто правой кнопкой → "Извлечь всё" (Windows) / двойной клик (macOS)',
    },
    {
      id: 2,
      title: 'Установите Python 3.11+',
      description: 'Скачайте и установите Python с официального сайта. При установке обязательно отметьте "Add Python to PATH".',
      link: { url: 'https://www.python.org/downloads/', label: 'python.org/downloads' },
      commands: [
        { label: 'Проверить версию', command: 'python --version' }
      ],
      warning: 'Если команда не найдена — Python не добавлен в PATH. Переустановите с галочкой "Add to PATH".',
    },
    {
      id: 3,
      title: 'Откройте терминал в папке проекта',
      description: 'Перейдите в папку backend/ внутри распакованного проекта.',
      commands: detectedOS === 'windows' ? [
        { label: 'Перейти в папку', command: 'cd C:\\путь\\к\\проекту\\backend' }
      ] : [
        { label: 'Перейти в папку', command: 'cd ~/путь/к/проекту/backend' }
      ],
      tip: 'В Windows можно Shift+ПКМ в папке → "Открыть окно PowerShell здесь"',
    },
    {
      id: 4,
      title: 'Создайте виртуальное окружение',
      description: 'Изолированное окружение Python для проекта (чтобы не засорять систему).',
      commands: [
        { label: 'Создать venv', command: 'python -m venv venv' }
      ],
      tip: 'После выполнения в папке backend/ появится папка venv/',
    },
    {
      id: 5,
      title: 'Активируйте окружение',
      description: 'Активируйте виртуальное окружение перед установкой зависимостей.',
      commands: detectedOS === 'windows' ? [
        { label: 'Windows (CMD)', command: 'venv\\Scripts\\activate.bat' },
        { label: 'Windows (PowerShell)', command: 'venv\\Scripts\\Activate.ps1' }
      ] : [
        { label: 'macOS / Linux', command: 'source venv/bin/activate' }
      ],
      tip: 'После активации в начале строки терминала появится (venv)',
      warning: 'Если PowerShell выдаёт ошибку выполнения скриптов, выполните: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned',
    },
    {
      id: 6,
      title: 'Установите зависимости',
      description: 'Установите все необходимые Python-библиотеки из requirements.txt.',
      commands: [
        { label: 'Установка', command: 'pip install -r requirements.txt' }
      ],
      tip: 'Это установит FastAPI, SQLAlchemy, Pandas, Watchdog и другие библиотеки. Может занять 1-3 минуты.',
    },
    {
      id: 7,
      title: 'Создайте рабочие директории и запустите сервер',
      description: 'Создайте необходимые папки и запустите FastAPI-сервер.',
      commands: detectedOS === 'windows' ? [
        { label: 'Создать папки', command: 'mkdir incoming_data processed logs data' },
        { label: 'Запустить сервер', command: 'python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000' }
      ] : [
        { label: 'Создать папки', command: 'mkdir -p incoming_data processed logs data' },
        { label: 'Запустить сервер', command: 'python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000' }
      ],
      tip: 'Вы должны увидеть: "Uvicorn running on http://0.0.0.0:8000"',
    },
    {
      id: 8,
      title: 'Откройте в браузере и тестируйте!',
      description: 'Откройте фронтенд и API-документацию. Положите Excel-файл в incoming_data/ для проверки.',
      commands: [
        { label: 'Фронтенд (откройте файл)', command: 'dist/index.html' },
        { label: 'API документация (Swagger)', command: 'http://localhost:8000/docs' },
        { label: 'Или запустите фронтенд-сервер', command: 'cd ../dist && python -m http.server 3000' }
      ],
      tip: 'Создайте тестовый Excel с колонкой "Номер УС" и положите в папку incoming_data/',
    },
  ];

  const steps = getSteps();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Play className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Пошаговый запуск</h2>
            <p className="text-indigo-200 text-sm">Следуйте инструкции для запуска системы на вашем ПК</p>
          </div>
        </div>

        {/* OS Selector */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-indigo-200">Ваша ОС:</span>
          {[
            { id: 'windows' as OS, icon: Monitor, label: 'Windows' },
            { id: 'macos' as OS, icon: Apple, label: 'macOS' },
            { id: 'linux' as OS, icon: Server, label: 'Linux' },
          ].map(os => (
            <button
              key={os.id}
              onClick={() => setDetectedOS(os.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                detectedOS === os.id
                  ? 'bg-white text-indigo-700 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <os.icon className="w-4 h-4" />
              {os.label}
            </button>
          ))}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Прогресс</span>
            <span className="font-mono">{completedSteps.size}/{totalSteps} шагов</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2.5">
            <div
              className="bg-white h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isNext = !isCompleted && (index === 0 || completedSteps.has(steps[index - 1].id));

          return (
            <div
              key={step.id}
              className={`
                rounded-xl border-2 transition-all duration-300 overflow-hidden
                ${isCompleted
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : isNext
                    ? 'border-indigo-300 bg-white shadow-md ring-2 ring-indigo-100'
                    : 'border-gray-200 bg-white opacity-75'
                }
              `}
            >
              {/* Step Header */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => toggleStep(step.id)}
              >
                {/* Checkbox */}
                <button
                  className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all
                    ${isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isNext
                        ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-300'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-sm font-bold">{step.id}</span>}
                </button>

                {/* Title */}
                <div className="flex-1">
                  <h3 className={`font-semibold ${isCompleted ? 'text-emerald-800 line-through' : 'text-gray-900'}`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                </div>

                {/* Arrow */}
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isNext ? 'rotate-90' : ''}`} />
              </div>

              {/* Step Content (expanded for next/current) */}
              {(isNext || isCompleted) && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  {/* Commands */}
                  {step.commands?.map((cmd, i) => (
                    <div key={i} className="space-y-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{cmd.label}</span>
                      <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-3 group">
                        <Terminal className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <code className="flex-1 text-sm text-slate-200 font-mono overflow-x-auto">
                          {cmd.command}
                        </code>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(cmd.command, `${step.id}-${i}`); }}
                          className="flex-shrink-0 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                          title="Копировать"
                        >
                          {copiedCmd === `${step.id}-${i}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Link */}
                  {step.link && (
                    <a
                      href={step.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {step.link.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {/* Tip */}
                  {step.tip && (
                    <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                      <span>{step.tip}</span>
                    </div>
                  )}

                  {/* Warning */}
                  {step.warning && (
                    <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                      <span>{step.warning}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Reference */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          Быстрый старт (все команды)
        </h3>
        <div className="space-y-2 font-mono text-sm">
          {[
            'cd backend',
            detectedOS === 'windows' ? 'python -m venv venv' : 'python3 -m venv venv',
            detectedOS === 'windows' ? 'venv\\Scripts\\activate' : 'source venv/bin/activate',
            'pip install -r requirements.txt',
            detectedOS === 'windows' ? 'mkdir incoming_data processed logs data' : 'mkdir -p incoming_data processed logs data',
            'python -m uvicorn app.main:app --reload --port 8000',
          ].map((cmd, i) => (
            <div key={i} className="flex items-center gap-3 group">
              <span className="text-slate-500 select-none w-5 text-right">{i + 1}</span>
              <code className="flex-1 text-emerald-300">{cmd}</code>
              <button
                onClick={() => copyToClipboard(cmd, `quick-${i}`)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 transition-all"
              >
                {copiedCmd === `quick-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Test Data */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          Тестовый Excel-файл
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Создайте файл <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">test_data.xlsx</code> со следующим содержимым
          и положите в папку <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">incoming_data/</code>:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Номер УС</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Название</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Адрес</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Телефон</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-2 font-mono text-blue-600">УС-001</td>
                <td className="px-4 py-2">ООО "Тестовая компания"</td>
                <td className="px-4 py-2 text-gray-600">г. Москва, ул. Примерная 1</td>
                <td className="px-4 py-2 font-mono text-gray-600">+7(495)1234567</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-2 font-mono text-blue-600">УС-002</td>
                <td className="px-4 py-2">ИП Петров А.А.</td>
                <td className="px-4 py-2 text-gray-600">г. СПб, Невский пр. 10</td>
                <td className="px-4 py-2 font-mono text-gray-600">+7(812)9876543</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-blue-600">УС-003</td>
                <td className="px-4 py-2">ЗАО "Инновации"</td>
                <td className="px-4 py-2 text-gray-600">г. Казань, ул. Баумана 5</td>
                <td className="px-4 py-2 font-mono text-gray-600">+7(843)5551234</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          ⚠️ Столбец <strong>"Номер УС"</strong> обязателен — это Primary Business Key для синхронизации.
        </p>
      </div>

      {/* Troubleshooting */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Частые проблемы
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs flex-shrink-0 h-fit">ERR 1</span>
            <div>
              <p className="font-medium text-amber-900">"python" не является командой</p>
              <p className="text-amber-700">→ Python не добавлен в PATH. Переустановите с галочкой "Add Python to PATH" или используйте <code className="bg-amber-100 px-1 rounded">python3</code></p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs flex-shrink-0 h-fit">ERR 2</span>
            <div>
              <p className="font-medium text-amber-900">Port 8000 already in use</p>
              <p className="text-amber-700">→ Другой процесс занимает порт. Используйте другой: <code className="bg-amber-100 px-1 rounded">--port 8001</code></p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs flex-shrink-0 h-fit">ERR 3</span>
            <div>
              <p className="font-medium text-amber-900">Столбец "Номер УС" не найден</p>
              <p className="text-amber-700">→ Проверьте точное название столбца в Excel. Регистр и пробелы имеют значение.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs flex-shrink-0 h-fit">ERR 4</span>
            <div>
              <p className="font-medium text-amber-900">PermissionError при чтении Excel</p>
              <p className="text-amber-700">→ Закройте файл в Excel. Система автоматически копирует файл в temp-папку.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
