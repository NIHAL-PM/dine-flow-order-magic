
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ArrowLeft,
  Settings as SettingsIcon,
  Printer,
  Store,
  Bell,
  Users,
  Shield,
  Palette
} from "lucide-react";
import { printService } from "@/services/printService";

const Settings = () => {
  const navigate = useNavigate();
  
  const [restaurantSettings, setRestaurantSettings] = useState({
    name: "My Restaurant",
    address: "123 Main Street, City, State 12345",
    phone: "+91 9876543210",
    email: "contact@myrestaurant.com",
    gstNumber: "22ABCDE1234F1Z5",
    currency: "INR",
    taxRate: 18,
    serviceCharge: 10
  });

  const [printerSettings, setPrinterSettings] = useState({
    kotPrinter: "Kitchen Printer",
    billPrinter: "Counter Printer",
    autoPrintKot: true,
    autoPrintBill: false,
    thermalWidth: "80mm"
  });

  const [notificationSettings, setNotificationSettings] = useState({
    orderAlerts: true,
    lowStockAlerts: true,
    emailNotifications: false,
    soundNotifications: true
  });

  const [userSettings, setUserSettings] = useState({
    theme: "light",
    language: "en",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h"
  });

  const handleSaveRestaurant = () => {
    // Save restaurant settings
    localStorage.setItem('restaurantSettings', JSON.stringify(restaurantSettings));
    toast.success("Restaurant settings saved successfully");
  };

  const handleSavePrinter = () => {
    // Save printer settings
    localStorage.setItem('printerSettings', JSON.stringify(printerSettings));
    toast.success("Printer settings saved successfully");
  };

  const handleTestPrinter = async () => {
    try {
      const testOrder = {
        tokenNumber: "TEST-001",
        orderType: "dine-in" as const,
        tableNumber: 1,
        items: [{ id: "1", name: "Test Item", quantity: 1, price: 100, total: 100 }],
        subtotal: 100,
        discount: 0,
        tax: 18,
        total: 118,
        paymentMethod: "cash" as const,
        timestamp: new Date(),
        customerName: "Test Customer",
        waiterName: "Test Waiter"
      };

      await printService.printThermal(testOrder, 'bill');
      toast.success("Test print successful");
    } catch (error) {
      toast.error("Test print failed: " + (error as Error).message);
    }
  };

  const handleSaveNotifications = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    toast.success("Notification settings saved successfully");
  };

  const handleSaveUser = () => {
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
    toast.success("User settings saved successfully");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
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
                <div className="p-2 rounded-xl bg-gradient-to-r from-gray-500 to-slate-500">
                  <SettingsIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold">Settings</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">Configure your restaurant</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <Tabs defaultValue="restaurant" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
            <TabsTrigger value="printer">Printer</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="user">User</TabsTrigger>
          </TabsList>

          <TabsContent value="restaurant" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Restaurant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="restaurant-name">Restaurant Name</Label>
                    <Input
                      id="restaurant-name"
                      value={restaurantSettings.name}
                      onChange={(e) => setRestaurantSettings(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={restaurantSettings.phone}
                      onChange={(e) => setRestaurantSettings(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={restaurantSettings.address}
                    onChange={(e) => setRestaurantSettings(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={restaurantSettings.email}
                      onChange={(e) => setRestaurantSettings(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gst">GST Number</Label>
                    <Input
                      id="gst"
                      value={restaurantSettings.gstNumber}
                      onChange={(e) => setRestaurantSettings(prev => ({ ...prev, gstNumber: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      value={restaurantSettings.taxRate}
                      onChange={(e) => setRestaurantSettings(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-charge">Service Charge (%)</Label>
                    <Input
                      id="service-charge"
                      type="number"
                      value={restaurantSettings.serviceCharge}
                      onChange={(e) => setRestaurantSettings(prev => ({ ...prev, serviceCharge: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <Button onClick={handleSaveRestaurant} className="w-full">
                  Save Restaurant Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="printer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Printer Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kot-printer">KOT Printer</Label>
                    <Select value={printerSettings.kotPrinter} onValueChange={(value) => setPrinterSettings(prev => ({ ...prev, kotPrinter: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kitchen Printer">Kitchen Printer</SelectItem>
                        <SelectItem value="Main Printer">Main Printer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bill-printer">Bill Printer</Label>
                    <Select value={printerSettings.billPrinter} onValueChange={(value) => setPrinterSettings(prev => ({ ...prev, billPrinter: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Counter Printer">Counter Printer</SelectItem>
                        <SelectItem value="Main Printer">Main Printer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="thermal-width">Thermal Printer Width</Label>
                  <Select value={printerSettings.thermalWidth} onValueChange={(value) => setPrinterSettings(prev => ({ ...prev, thermalWidth: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">58mm</SelectItem>
                      <SelectItem value="80mm">80mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-kot">Auto Print KOT</Label>
                    <Switch
                      id="auto-kot"
                      checked={printerSettings.autoPrintKot}
                      onCheckedChange={(checked) => setPrinterSettings(prev => ({ ...prev, autoPrintKot: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-bill">Auto Print Bill</Label>
                    <Switch
                      id="auto-bill"
                      checked={printerSettings.autoPrintBill}
                      onCheckedChange={(checked) => setPrinterSettings(prev => ({ ...prev, autoPrintBill: checked }))}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleSavePrinter} className="flex-1">
                    Save Printer Settings
                  </Button>
                  <Button onClick={handleTestPrinter} variant="outline">
                    Test Print
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="order-alerts">Order Alerts</Label>
                    <Switch
                      id="order-alerts"
                      checked={notificationSettings.orderAlerts}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, orderAlerts: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound-notifications">Sound Notifications</Label>
                    <Switch
                      id="sound-notifications"
                      checked={notificationSettings.soundNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, soundNotifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                </div>
                
                <Button onClick={handleSaveNotifications} className="w-full">
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={userSettings.theme} onValueChange={(value) => setUserSettings(prev => ({ ...prev, theme: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select value={userSettings.language} onValueChange={(value) => setUserSettings(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select value={userSettings.dateFormat} onValueChange={(value) => setUserSettings(prev => ({ ...prev, dateFormat: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="time-format">Time Format</Label>
                    <Select value={userSettings.timeFormat} onValueChange={(value) => setUserSettings(prev => ({ ...prev, timeFormat: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12 Hour</SelectItem>
                        <SelectItem value="24h">24 Hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button onClick={handleSaveUser} className="w-full">
                  Save User Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
