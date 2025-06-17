
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  Settings as SettingsIcon,
  Printer,
  Bell,
  Database,
  Download,
  Upload,
  Trash2,
  Save
} from "lucide-react";
import { enhancedDB } from "@/services/enhancedDatabase";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Restaurant Settings
  const [restaurantSettings, setRestaurantSettings] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    taxRate: 18
  });

  // Printing Settings
  const [printingSettings, setPrintingSettings] = useState({
    enabled: false,
    printerName: '',
    paperSize: '80mm',
    printLogo: false,
    printFooter: true,
    autoKotPrint: true,
    autoBillPrint: false,
    kotCopies: 1,
    billCopies: 1
  });

  // Order Settings
  const [orderSettings, setOrderSettings] = useState({
    autoConfirm: false,
    defaultPreparationTime: 15,
    allowEditAfterConfirm: true,
    requireWaiterName: false,
    enablePriority: true,
    maxOrdersPerTable: 5
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    soundEnabled: true,
    newOrderAlert: true,
    readyOrderAlert: true,
    lowStockAlert: true,
    reservationReminder: true,
    soundVolume: 0.8,
    emailNotifications: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await enhancedDB.getData('settings');
      settings.forEach((setting: any) => {
        switch (setting.key) {
          case 'restaurant':
            setRestaurantSettings(setting.value);
            break;
          case 'printing':
            setPrintingSettings(setting.value);
            break;
          case 'orders':
            setOrderSettings(setting.value);
            break;
          case 'notifications':
            setNotificationSettings(setting.value);
            break;
        }
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (key: string, value: any) => {
    try {
      setLoading(true);
      await enhancedDB.updateItem('settings', key, { key, value });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const data = await enhancedDB.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `restaurant-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await enhancedDB.importData(text);
      toast.success('Data imported successfully');
      loadSettings();
    } catch (error) {
      console.error('Failed to import data:', error);
      toast.error('Failed to import data');
    }
  };

  const clearAllData = async () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        await enhancedDB.clearAllData();
        toast.success('All data cleared successfully');
        loadSettings();
      } catch (error) {
        console.error('Failed to clear data:', error);
        toast.error('Failed to clear data');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="mr-3"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-r from-gray-500 to-gray-700">
                  <SettingsIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold">Settings</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">Configure your restaurant system</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <Tabs defaultValue="restaurant" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
            <TabsTrigger value="printing">Printing</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          {/* Restaurant Settings */}
          <TabsContent value="restaurant">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="restaurantName">Restaurant Name</Label>
                    <Input
                      id="restaurantName"
                      value={restaurantSettings.name}
                      onChange={(e) => setRestaurantSettings(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter restaurant name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={restaurantSettings.phone}
                      onChange={(e) => setRestaurantSettings(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={restaurantSettings.address}
                    onChange={(e) => setRestaurantSettings(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter restaurant address"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={restaurantSettings.email}
                      onChange={(e) => setRestaurantSettings(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={restaurantSettings.currency} onValueChange={(value) => setRestaurantSettings(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      value={restaurantSettings.taxRate}
                      onChange={(e) => setRestaurantSettings(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <Button onClick={() => saveSettings('restaurant', restaurantSettings)} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Restaurant Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Printing Settings */}
          <TabsContent value="printing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Printer className="h-5 w-5 mr-2" />
                  Printing Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={printingSettings.enabled}
                    onCheckedChange={(checked) => setPrintingSettings(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label>Enable Printing</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="printerName">Printer Name</Label>
                    <Input
                      id="printerName"
                      value={printingSettings.printerName}
                      onChange={(e) => setPrintingSettings(prev => ({ ...prev, printerName: e.target.value }))}
                      placeholder="Enter printer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paperSize">Paper Size</Label>
                    <Select value={printingSettings.paperSize} onValueChange={(value) => setPrintingSettings(prev => ({ ...prev, paperSize: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="80mm">80mm</SelectItem>
                        <SelectItem value="58mm">58mm</SelectItem>
                        <SelectItem value="A4">A4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={printingSettings.autoKotPrint}
                      onCheckedChange={(checked) => setPrintingSettings(prev => ({ ...prev, autoKotPrint: checked }))}
                    />
                    <Label>Auto-print Kitchen Orders (KOT)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={printingSettings.autoBillPrint}
                      onCheckedChange={(checked) => setPrintingSettings(prev => ({ ...prev, autoBillPrint: checked }))}
                    />
                    <Label>Auto-print Bills</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={printingSettings.printLogo}
                      onCheckedChange={(checked) => setPrintingSettings(prev => ({ ...prev, printLogo: checked }))}
                    />
                    <Label>Print Restaurant Logo</Label>
                  </div>
                </div>
                
                <Button onClick={() => saveSettings('printing', printingSettings)} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Printing Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order Settings */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={orderSettings.autoConfirm}
                      onCheckedChange={(checked) => setOrderSettings(prev => ({ ...prev, autoConfirm: checked }))}
                    />
                    <Label>Auto-confirm Orders</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={orderSettings.allowEditAfterConfirm}
                      onCheckedChange={(checked) => setOrderSettings(prev => ({ ...prev, allowEditAfterConfirm: checked }))}
                    />
                    <Label>Allow Editing After Confirmation</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={orderSettings.requireWaiterName}
                      onCheckedChange={(checked) => setOrderSettings(prev => ({ ...prev, requireWaiterName: checked }))}
                    />
                    <Label>Require Waiter Name</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={orderSettings.enablePriority}
                      onCheckedChange={(checked) => setOrderSettings(prev => ({ ...prev, enablePriority: checked }))}
                    />
                    <Label>Enable Order Priority</Label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultPrepTime">Default Preparation Time (minutes)</Label>
                    <Input
                      id="defaultPrepTime"
                      type="number"
                      min="1"
                      value={orderSettings.defaultPreparationTime}
                      onChange={(e) => setOrderSettings(prev => ({ ...prev, defaultPreparationTime: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxOrders">Max Orders per Table</Label>
                    <Input
                      id="maxOrders"
                      type="number"
                      min="1"
                      value={orderSettings.maxOrdersPerTable}
                      onChange={(e) => setOrderSettings(prev => ({ ...prev, maxOrdersPerTable: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <Button onClick={() => saveSettings('orders', orderSettings)} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Order Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.soundEnabled}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, soundEnabled: checked }))}
                    />
                    <Label>Enable Sound Notifications</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.newOrderAlert}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, newOrderAlert: checked }))}
                    />
                    <Label>New Order Alerts</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.readyOrderAlert}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, readyOrderAlert: checked }))}
                    />
                    <Label>Order Ready Alerts</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.lowStockAlert}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, lowStockAlert: checked }))}
                    />
                    <Label>Low Stock Alerts</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                    <Label>Email Notifications</Label>
                  </div>
                </div>
                
                <Button onClick={() => saveSettings('notifications', notificationSettings)} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={exportData} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="hidden"
                      id="import-file"
                    />
                    <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                  </div>
                  
                  <Button onClick={clearAllData} variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </Button>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Export data regularly to backup your information</li>
                    <li>• Import will overwrite existing data</li>
                    <li>• Clear all data cannot be undone</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
