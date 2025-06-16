
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { enhancedDB } from '@/services/enhancedDatabase';

interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
  taxRate: number;
  serviceCharge?: number;
  logo?: string;
}

interface PrintingSettings {
  enabled: boolean;
  printerName: string;
  paperSize: string;
  printLogo: boolean;
  printFooter: boolean;
  autoKotPrint: boolean;
  autoBillPrint: boolean;
  kotCopies: number;
  billCopies: number;
}

interface OrderSettings {
  autoConfirm: boolean;
  defaultPreparationTime: number;
  allowEditAfterConfirm: boolean;
  requireWaiterName: boolean;
  enablePriority: boolean;
  maxOrdersPerTable: number;
}

interface NotificationSettings {
  soundEnabled: boolean;
  newOrderAlert: boolean;
  readyOrderAlert: boolean;
  lowStockAlert: boolean;
  reservationReminder: boolean;
  soundVolume: number;
  emailNotifications: boolean;
}

interface Settings {
  restaurant: RestaurantSettings;
  printing: PrintingSettings;
  orders: OrderSettings;
  notifications: NotificationSettings;
}

interface SettingsContextType {
  settings: Settings;
  updateRestaurantSettings: (updates: Partial<RestaurantSettings>) => Promise<void>;
  updatePrintingSettings: (updates: Partial<PrintingSettings>) => Promise<void>;
  updateOrderSettings: (updates: Partial<OrderSettings>) => Promise<void>;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  getSetting: (key: string) => any;
  setSetting: (key: string, value: any) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  exportSettings: () => Promise<string>;
  importSettings: (settingsJson: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  restaurant: {
    name: '',
    address: '',
    phone: '',
    email: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    taxRate: 18
  },
  printing: {
    enabled: false,
    printerName: '',
    paperSize: '80mm',
    printLogo: false,
    printFooter: true,
    autoKotPrint: true,
    autoBillPrint: false,
    kotCopies: 1,
    billCopies: 1
  },
  orders: {
    autoConfirm: false,
    defaultPreparationTime: 15,
    allowEditAfterConfirm: true,
    requireWaiterName: false,
    enablePriority: true,
    maxOrdersPerTable: 5
  },
  notifications: {
    soundEnabled: true,
    newOrderAlert: true,
    readyOrderAlert: true,
    lowStockAlert: true,
    reservationReminder: true,
    soundVolume: 0.8,
    emailNotifications: false
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    refreshSettings();
  }, []);

  const refreshSettings = async () => {
    try {
      const settingsData = await enhancedDB.getData('settings');
      const settingsMap = new Map(settingsData.map((item: any) => [item.key, item.value]));
      
      if (settingsMap.size > 0) {
        setSettings({
          restaurant: settingsMap.get('restaurant') || defaultSettings.restaurant,
          printing: settingsMap.get('printing') || defaultSettings.printing,
          orders: settingsMap.get('orders') || defaultSettings.orders,
          notifications: settingsMap.get('notifications') || defaultSettings.notifications
        });
      }
    } catch (error) {
      console.error('Failed to refresh settings:', error);
    }
  };

  const saveSettingValue = async (key: string, value: any) => {
    try {
      await enhancedDB.updateItem('settings', key, { key, value });
    } catch (error) {
      // If update fails, try adding
      try {
        await enhancedDB.addItem('settings', { key, value });
      } catch (addError) {
        console.error('Failed to save setting:', addError);
        throw addError;
      }
    }
  };

  const updateRestaurantSettings = async (updates: Partial<RestaurantSettings>) => {
    try {
      const newSettings = { ...settings.restaurant, ...updates };
      await saveSettingValue('restaurant', newSettings);
      setSettings(prev => ({ ...prev, restaurant: newSettings }));
    } catch (error) {
      console.error('Failed to update restaurant settings:', error);
      throw error;
    }
  };

  const updatePrintingSettings = async (updates: Partial<PrintingSettings>) => {
    try {
      const newSettings = { ...settings.printing, ...updates };
      await saveSettingValue('printing', newSettings);
      setSettings(prev => ({ ...prev, printing: newSettings }));
    } catch (error) {
      console.error('Failed to update printing settings:', error);
      throw error;
    }
  };

  const updateOrderSettings = async (updates: Partial<OrderSettings>) => {
    try {
      const newSettings = { ...settings.orders, ...updates };
      await saveSettingValue('orders', newSettings);
      setSettings(prev => ({ ...prev, orders: newSettings }));
    } catch (error) {
      console.error('Failed to update order settings:', error);
      throw error;
    }
  };

  const updateNotificationSettings = async (updates: Partial<NotificationSettings>) => {
    try {
      const newSettings = { ...settings.notifications, ...updates };
      await saveSettingValue('notifications', newSettings);
      setSettings(prev => ({ ...prev, notifications: newSettings }));
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  };

  const getSetting = (key: string) => {
    const keys = key.split('.');
    let value: any = settings;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  };

  const setSetting = async (key: string, value: any) => {
    try {
      await saveSettingValue(key, value);
      await refreshSettings();
    } catch (error) {
      console.error('Failed to set setting:', error);
      throw error;
    }
  };

  const resetToDefaults = async () => {
    try {
      await enhancedDB.setData('settings', []);
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  };

  const exportSettings = async () => {
    try {
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  };

  const importSettings = async (settingsJson: string) => {
    try {
      const importedSettings = JSON.parse(settingsJson);
      
      for (const [key, value] of Object.entries(importedSettings)) {
        await saveSettingValue(key, value);
      }
      
      await refreshSettings();
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateRestaurantSettings,
      updatePrintingSettings,
      updateOrderSettings,
      updateNotificationSettings,
      getSetting,
      setSetting,
      resetToDefaults,
      exportSettings,
      importSettings,
      refreshSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
