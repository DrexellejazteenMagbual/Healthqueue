// Notification Service - Manages toast notifications with settings
import { settingsManager } from './settingsManager';

export type NotificationType = 'queueUpdate' | 'newPatient' | 'systemAlert';
export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface NotificationOptions {
  message: string;
  type: ToastType;
  duration?: number;
}

class NotificationService {
  private listeners: Array<(notification: NotificationOptions) => void> = [];

  // Subscribe to notifications
  subscribe(callback: (notification: NotificationOptions) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Show a notification if enabled in settings
  private show(notificationType: NotificationType, options: NotificationOptions) {
    const settings = settingsManager.load();
    
    // Check if this type of notification is enabled
    let isEnabled = false;
    switch (notificationType) {
      case 'queueUpdate':
        isEnabled = settings.notifications.queueUpdates;
        break;
      case 'newPatient':
        isEnabled = settings.notifications.newPatients;
        break;
      case 'systemAlert':
        isEnabled = settings.notifications.systemAlerts;
        break;
    }

    if (isEnabled) {
      this.listeners.forEach(listener => listener(options));
    }
  }

  // Specific notification methods
  queueUpdate(message: string) {
    this.show('queueUpdate', {
      message,
      type: 'info',
      duration: 3000
    });
  }

  newPatient(message: string) {
    this.show('newPatient', {
      message,
      type: 'success',
      duration: 4000
    });
  }

  systemAlert(message: string, type: ToastType = 'warning') {
    this.show('systemAlert', {
      message,
      type,
      duration: 5000
    });
  }

  // Manual notification (always shows, bypasses settings)
  notify(options: NotificationOptions) {
    this.listeners.forEach(listener => listener(options));
  }
}

export const notificationService = new NotificationService();
