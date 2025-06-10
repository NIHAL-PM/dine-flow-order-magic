
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, Clock, Plus } from "lucide-react";

interface Table {
  id: number;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrder?: string;
  reservationName?: string;
  reservationTime?: string;
  occupiedSince?: Date;
}

const TableManagement = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([
    { id: 1, seats: 2, status: 'available' },
    { id: 2, seats: 4, status: 'occupied', currentOrder: 'D-001', occupiedSince: new Date(Date.now() - 45 * 60000) },
    { id: 3, seats: 2, status: 'available' },
    { id: 4, seats: 6, status: 'reserved', reservationName: 'Smith Family', reservationTime: '7:30 PM' },
    { id: 5, seats: 4, status: 'occupied', currentOrder: 'D-003', occupiedSince: new Date(Date.now() - 20 * 60000) },
    { id: 6, seats: 2, status: 'cleaning' },
    { id: 7, seats: 8, status: 'available' },
    { id: 8, seats: 4, status: 'available' },
    { id: 9, seats: 2, status: 'available' },
    { id: 10, seats: 4, status: 'reserved', reservationName: 'Johnson', reservationTime: '8:00 PM' },
    { id: 11, seats: 6, status: 'available' },
    { id: 12, seats: 2, status: 'available' },
    { id: 13, seats: 4, status: 'available' },
    { id: 14, seats: 2, status: 'occupied', currentOrder: 'D-005', occupiedSince: new Date(Date.now() - 15 * 60000) },
    { id: 15, seats: 6, status: 'available' }
  ]);

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [reservationForm, setReservationForm] = useState({
    name: '',
    time: '',
    guests: 2
  });

  const updateTableStatus = (tableId: number, newStatus: Table['status']) => {
    setTables(prev => 
      prev.map(table => 
        table.id === tableId 
          ? { ...table, status: newStatus, occupiedSince: newStatus === 'occupied' ? new Date() : undefined }
          : table
      )
    );
  };

  const makeReservation = (tableId: number) => {
    setTables(prev => 
      prev.map(table => 
        table.id === tableId 
          ? { 
              ...table, 
              status: 'reserved', 
              reservationName: reservationForm.name,
              reservationTime: reservationForm.time
            }
          : table
      )
    );
    setReservationForm({ name: '', time: '', guests: 2 });
  };

  const getTableColor = (status: Table['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-300 hover:bg-green-200';
      case 'occupied': return 'bg-red-100 border-red-300';
      case 'reserved': return 'bg-yellow-100 border-yellow-300';
      case 'cleaning': return 'bg-gray-100 border-gray-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getStatusBadge = (status: Table['status']) => {
    const configs = {
      available: { label: 'Available', variant: 'default' as const },
      occupied: { label: 'Occupied', variant: 'destructive' as const },
      reserved: { label: 'Reserved', variant: 'secondary' as const },
      cleaning: { label: 'Cleaning', variant: 'outline' as const }
    };
    
    return (
      <Badge variant={configs[status].variant}>
        {configs[status].label}
      </Badge>
    );
  };

  const getOccupiedDuration = (occupiedSince?: Date) => {
    if (!occupiedSince) return null;
    const minutes = Math.floor((Date.now() - occupiedSince.getTime()) / 60000);
    return `${minutes} min`;
  };

  const availableTables = tables.filter(t => t.status === 'available').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const reservedTables = tables.filter(t => t.status === 'reserved').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Table Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-green-600">Available: {availableTables}</span>
                <span className="text-red-600">Occupied: {occupiedTables}</span>
                <span className="text-yellow-600">Reserved: {reservedTables}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tables</p>
                  <p className="text-2xl font-bold">{tables.length}</p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-green-600">{availableTables}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Occupied</p>
                  <p className="text-2xl font-bold text-red-600">{occupiedTables}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Reserved</p>
                  <p className="text-2xl font-bold text-yellow-600">{reservedTables}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Layout */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Floor Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 p-4">
              {tables.map(table => (
                <Dialog key={table.id}>
                  <DialogTrigger asChild>
                    <Card 
                      className={`cursor-pointer transition-all duration-200 ${getTableColor(table.status)}`}
                      onClick={() => setSelectedTable(table)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="text-lg font-bold">T{table.id}</div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-1" />
                            {table.seats}
                          </div>
                          {getStatusBadge(table.status)}
                          {table.status === 'occupied' && table.occupiedSince && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {getOccupiedDuration(table.occupiedSince)}
                            </div>
                          )}
                          {table.status === 'reserved' && (
                            <div className="text-xs text-gray-600 text-center">
                              <div>{table.reservationName}</div>
                              <div>{table.reservationTime}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Table {table.id} - {table.seats} seats</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Current Status:</span>
                        {getStatusBadge(table.status)}
                      </div>
                      
                      {table.status === 'occupied' && (
                        <>
                          <div className="space-y-2">
                            <p>Order: {table.currentOrder}</p>
                            <p>Duration: {getOccupiedDuration(table.occupiedSince)}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => updateTableStatus(table.id, 'cleaning')}
                              variant="outline"
                              className="flex-1"
                            >
                              Mark for Cleaning
                            </Button>
                            <Button 
                              onClick={() => updateTableStatus(table.id, 'available')}
                              className="flex-1"
                            >
                              Make Available
                            </Button>
                          </div>
                        </>
                      )}
                      
                      {table.status === 'available' && (
                        <>
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="name">Customer Name</Label>
                              <Input
                                id="name"
                                value={reservationForm.name}
                                onChange={(e) => setReservationForm({...reservationForm, name: e.target.value})}
                                placeholder="Enter customer name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="time">Reservation Time</Label>
                              <Input
                                id="time"
                                type="time"
                                value={reservationForm.time}
                                onChange={(e) => setReservationForm({...reservationForm, time: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => updateTableStatus(table.id, 'occupied')}
                              variant="outline"
                              className="flex-1"
                            >
                              Seat Customers
                            </Button>
                            <Button 
                              onClick={() => makeReservation(table.id)}
                              className="flex-1"
                              disabled={!reservationForm.name || !reservationForm.time}
                            >
                              Make Reservation
                            </Button>
                          </div>
                        </>
                      )}
                      
                      {table.status === 'cleaning' && (
                        <Button 
                          onClick={() => updateTableStatus(table.id, 'available')}
                          className="w-full"
                        >
                          Cleaning Complete
                        </Button>
                      )}
                      
                      {table.status === 'reserved' && (
                        <>
                          <div className="space-y-2">
                            <p>Reserved for: {table.reservationName}</p>
                            <p>Time: {table.reservationTime}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => updateTableStatus(table.id, 'occupied')}
                              className="flex-1"
                            >
                              Seat Customers
                            </Button>
                            <Button 
                              onClick={() => updateTableStatus(table.id, 'available')}
                              variant="outline"
                              className="flex-1"
                            >
                              Cancel Reservation
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TableManagement;
