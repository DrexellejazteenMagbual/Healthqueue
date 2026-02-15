// Settings Manager - Centralized settings storage and retrieval

export interface AppSettings {
  notifications: {
    queueUpdates: boolean;
    newPatients: boolean;
    systemAlerts: boolean;
  };
  display: {
    autoRefresh: boolean;
    refreshInterval: number;
    showPriority: boolean;
    maxDisplayItems: number;
  };
  queue: {
    priorityForSeniors: boolean;
    priorityForPWD: boolean;
    priorityForPregnant: boolean;
    autoAdvance: boolean;
  };
  system: {
    backupFrequency: 'hourly' | 'daily' | 'weekly';
    dataRetention: number;
    auditLog: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    queueUpdates: true,
    newPatients: true,
    systemAlerts: false
  },
  display: {
    autoRefresh: true,
    refreshInterval: 30,
    showPriority: true,
    maxDisplayItems: 15
  },
  queue: {
    priorityForSeniors: true,
    priorityForPWD: true,
    priorityForPregnant: true,
    autoAdvance: false
  },
  system: {
    backupFrequency: 'daily',
    dataRetention: 365,
    auditLog: true
  }
};

const SETTINGS_STORAGE_KEY = 'healthqueue_settings';

export const settingsManager = {
  // Load settings from localStorage
  load(): AppSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return {
          notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
          display: { ...DEFAULT_SETTINGS.display, ...parsed.display },
          queue: { ...DEFAULT_SETTINGS.queue, ...parsed.queue },
          system: { ...DEFAULT_SETTINGS.system, ...parsed.system }
        };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return DEFAULT_SETTINGS;
  },

  // Save settings to localStorage
  save(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  // Get default settings
  getDefaults(): AppSettings {
    return { ...DEFAULT_SETTINGS };
  },

  // Subscribe to settings changes
  subscribe(callback: (settings: AppSettings) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<AppSettings>;
      callback(customEvent.detail);
    };
    window.addEventListener('settingsChanged', handler);
    return () => window.removeEventListener('settingsChanged', handler);
  }
};
