import { useState, useEffect, useCallback } from 'react';
import { ToastNotification, SyncEvent } from '../types';
import { simulatedSyncEvents } from '../data/mockData';

export function useToast() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((toast: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const id = crypto.randomUUID();
    const newToast: ToastNotification = {
      ...toast,
      id,
      timestamp: Date.now(),
    };
    setToasts(prev => [...prev, newToast]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

export function useSyncSimulation(onEvent: (event: SyncEvent) => void) {
  const [isRunning, setIsRunning] = useState(false);
  const [processedEvents, setProcessedEvents] = useState<number>(0);

  const startSimulation = useCallback(() => {
    setIsRunning(true);
    setProcessedEvents(0);

    simulatedSyncEvents.forEach((event, index) => {
      setTimeout(() => {
        onEvent({
          type: event.type,
          record: event.record,
          timestamp: new Date().toISOString(),
        });
        setProcessedEvents(index + 1);
        if (index === simulatedSyncEvents.length - 1) {
          setTimeout(() => setIsRunning(false), 1000);
        }
      }, event.delay);
    });
  }, [onEvent]);

  return { isRunning, processedEvents, startSimulation };
}

export function useSyncStatus() {
  const [status, setStatus] = useState<'idle' | 'watching' | 'processing'>('watching');
  const [lastCheck, setLastCheck] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastCheck(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return { status, lastCheck };
}
