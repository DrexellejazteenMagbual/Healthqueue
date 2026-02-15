import React, { useState, useEffect, createContext, useContext } from 'react';
import Toast from '../components/Toast';
import { notificationService } from './notificationService';

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastData['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {}
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [nextId, setNextId] = useState(0);

  // Subscribe to notification service
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification) => {
      showToast(notification.message, notification.type, notification.duration);
    });

    return unsubscribe;
  }, []);

  const showToast = (message: string, type: ToastData['type'], duration: number = 3000) => {
    const id = nextId;
    setNextId(prev => prev + 1);
    
    const newToast: ToastData = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
