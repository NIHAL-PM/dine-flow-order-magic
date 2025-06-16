
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/services/database';

interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
}

interface PrintingSettings {
  enabled: boolean;
  printerName: string;
  paperSize: string;
  printLogo: boolean;
  printFooter: boolean;
}

interface OrderSettings {
  autoConfirm: boolean;
  defaultPreparationTime: number;
  allowEditAfterConfirm: boolean;
  requireWaiterName: boolean;
}

interface NotificationSettings {
  soundEnabled: boolean;
  newOrderAlert: boolean;
  readyOrderAlert: boolean;
  lowStockAlert: boolean;
}

interface Settings {
  restaurant: RestaurantSettings;
  printing: PrintingSettings;
  orders: OrderSettings;
  notifications: NotificationSettings;
}

interface SettingsContextType {
  settings: Settings;
  updateRestaurantSettings: (updates: Partial<RestaurantSettings>) => void;
  updatePrintingSettings: (updates: Partial<PrintingSettings>) => void;
  updateOrderSettings: (updates: Partial<OrderSettings>) => void;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>({
    restaurant: {
      name: 'Restaurant Management System',
      address: '123 Main Street, City',
      phone: '+1 234 567 8900',
      email: 'info@restaurant.com',
      currency: 'INR',
      timezone: 'Asia/Kolkata'
    },
    printing: {
      enabled: true,
      printerName: 'Default Thermal Printer',
      paperSize: '80mm',
      printLogo: true,
      printFooter: true
    },
    orders: {
      autoConfirm: false,
      defaultPreparationTime: 15,
      allowEditAfterConfirm: true,
      requireWaiterName: false
    },
    notifications: {
      soundEnabled: true,
      newOrderAlert: true,
      readyOrderAlert: true,
      lowStockAlert: true
    }
  });

  useEffect(() => {
    // Load settings from database
    const savedSettings = db.getData('settings');
    if (savedSettings && Object.keys(savedSettings).length > 0) {
      setSettings(savedSettings);
    }

    // Subscribe to settings changes
    const unsubscribe = db.subscribe('settings', (newSettings) => {
      if (newSettings && Object.keys(newSettings).length > 0) {
        setSettings(newSettings);
      }
    });

    return unsubscribe;
  }, []);

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    db.setData('settings', newSettings);
  };

  const updateRestaurantSettings = (updates: Partial<RestaurantSettings>) => {
    const newSettings = {
      ...settings,
      restaurant: { ...settings.restaurant, ...updates }
    };
    saveSettings(newSettings);
  };

  const updatePrintingSettings = (updates: Partial<PrintingSettings>) => {
    const newSettings = {
      ...settings,
      printing: { ...settings.printing, ...updates }
    };
    saveSettings(newSettings);
  };

  const updateOrderSettings = (updates: Partial<OrderSettings>) => {
    const newSettings = {
      ...settings,
      orders: { ...settings.orders, ...updates }
    };
    saveSettings(newSettings);
  };

  const updateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    const newSettings = {
      ...settings,
      notifications: { ...settings.notifications, ...updates }
    };
    saveSettings(newSettings);
  };

  const resetToDefaults = () => {
    const defaultSettings: Settings = {
      restaurant: {
        name: 'Restaurant Management System',
        address: '123 Main Street, City',
        phone: '+1 234 567 8900',
        email: 'info@restaurant.com',
        currency: 'INR',
        timezone: 'Asia/Kolkata'
      },
      printing: {
        enabled: true,
        printerName: 'Default Thermal Printer',
        paperSize: '80mm',
        printLogo: true,
        printFooter: true
      },
      orders: {
        autoConfirm: false,
        defaultPreparationTime: 15,
        allowEditAfterConfirm: true,
        requireWaiterName: false
      },
      notifications: {
        soundEnabled: true,
        newOrderAlert: true,
        readyOrderAlert: true,
        lowStockAlert: true
      }
    };
    saveSettings(defaultSettings);
  };

  const exportSettings = () => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = (settingsJson: string) => {
    try {
      const importedSettings = JSON.parse(settingsJson);
      saveSettings(importedSettings);
    } catch (error) {
      throw new Error('Invalid settings format');
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateRestaurantSettings,
      updatePrintingSettings,
      updateOrderSettings,
      updateNotificationSettings,
      resetToDefaults,
      exportSettings,
      importSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
