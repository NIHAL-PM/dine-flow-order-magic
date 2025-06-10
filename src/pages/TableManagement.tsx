
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Users, 
  Calendar, 
  Clock, 
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Coffee
} from "lucide-react";

interface Table {
  id: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrder?: string;
  reservedBy?: string;
  reservedTime?: Date;
  customerCount?: number;
}

interface Reservation {
  id: string;
  tableNumber: number;
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservationTime: Date;
  notes?: string;
}

const TableManagement = () => {
  const [tables, setTables] = useState<Table[]>([
    { id: 1, number: 1, capacity: 2, status: 'available' },
    { id: 2, number: 2, capacity: 4, status: 'occupied', currentOrder: 'D-001', customerCount: 3 },
    { id: 3, number: 3, capacity: 6, status: 'reserved', reservedBy: 'John Doe', reservedTime: new Date(Date.now() + 1800000) },
    { id: 4, number: 4, capacity: 2, status: 'cleaning' },
    { id: 5, number: 5, capacity: 4, status: 'available' },
    { id: 6, number: 6, capacity: 8, status: 'available' },
    { id: 7, number: 7, capacity: 4, status: 'occupied', currentOrder: 'D-003', customerCount: 4 },
    { id: 8, number: 8, capacity: 2, status: 'available' },
  ]);

  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: '1',
      tableNumber: 3,
      customerName: 'John Doe',
      customerPhone: '+91 9876543210',
      partySize: 4,
      reservationTime: new Date(Date.now() + 1800000),
      notes: 'Anniversary dinner'
    }
  ]);

  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [reservationForm, setReservationForm] = useState({
    customerName: '',
    customerPhone: '',
    partySize: 1,
    reservationTime: '',
    notes: ''
  });

  const updateTableStatus = (tableId: number, status: Table['status']) => {
    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { ...table, status, ...(status === 'available' ? { currentOrder: undefined, customerCount: undefined } : {}) }
        : table
    ));
    
    toast.success(`Table ${tables.find(t => t.id === tableId)?.number} marked as ${status}`);
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'reserved': return 'bg-blue-500';
      case 'cleaning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: Table['status']) => {
    switch (status) {
      case 'available': return CheckCircle2;
      case 'occupied': return Users;
      case 'reserved': return Calendar;
      case 'cleaning': return Coffee;
      default: return AlertCircle;
    }
  };

  const handleReservation = () => {
    if (!selectedTable || !reservationForm.customerName || !reservationForm.reservationTime) {
      toast.error("Please fill all required fields");
      return;
    }

    const newReservation: Reservation = {
      id: Date.now().toString(),
      tableNumber: selectedTable,
      customerName: reservationForm.customerName,
      customerPhone: reservationForm.customerPhone,
      partySize: reservationForm.partySize,
      reservationTime: new Date(reservationForm.reservationTime),
      notes: reservationForm.notes
    };

    setReservations(prev => [...prev, newReservation]);
    updateTableStatus(tables.find(t => t.number === selectedTable)?.id || 0, 'reserved');
    
    setTables(prev => prev.map(table => 
      table.number === selectedTable 
        ? { ...table, reservedBy: reservationForm.customerName, reservedTime: new Date(reservationForm.reservationTime) }
        : table
    ));

    setReservationForm({
      customerName: '',
      customerPhone: '',
      partySize: 1,
      reservationTime: '',
      notes: ''
    });
    
    setShowReservationDialog(false);
    setSelectedTable(null);
    toast.success("Reservation created successfully!");
  };

  const cancelReservation = (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (reservation) {
      updateTableStatus(tables.find(t => t.number === reservation.tableNumber)?.id || 0, 'available');
      setReservations(prev => prev.filter(r => r.id !== reservationId));
      toast.success("Reservation cancelled");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Enhanced Header */}
      <header className="glass-effect border-b-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center animate-fade-in">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Table Management
                </h1>
                <p className="text-xs text-gray-600">Real-time Table Status & Reservations</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 animate-fade-in">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>{tables.filter(t => t.status === 'available').length} Available</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>{tables.filter(t => t.status === 'occupied').length} Occupied</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table Layout */}
          <div className="lg:col-span-2">
            <Card className="glass-effect animate-fade-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Restaurant Floor Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {tables.map((table) => {
                    const StatusIcon = getStatusIcon(table.status);
                    
                    return (
                      <Card 
                        key={table.id} 
                        className={`hover-lift cursor-pointer transition-all duration-300 border-2 ${
                          table.status === 'available' ? 'hover:border-green-300' : ''
                        }`}
                      >
                        <CardContent className="p-4 text-center">
                          <div className={`w-16 h-16 rounded-full ${getStatusColor(table.status)} mx-auto mb-3 flex items-center justify-center`}>
                            <StatusIcon className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="font-semibold text-lg mb-1">Table {table.number}</h3>
                          <p className="text-sm text-gray-600 mb-2">Seats {table.capacity}</p>
                          <Badge 
                            variant="secondary" 
                            className={`${getStatusColor(table.status)} text-white capitalize`}
                          >
                            {table.status}
                          </Badge>
                          
                          {table.currentOrder && (
                            <p className="text-xs text-gray-600 mt-2">Order: {table.currentOrder}</p>
                          )}
                          
                          {table.reservedBy && (
                            <p className="text-xs text-gray-600 mt-2">Reserved: {table.reservedBy}</p>
                          )}
                          
                          <div className="flex gap-1 mt-3">
                            {table.status === 'available' && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => updateTableStatus(table.id, 'occupied')}
                                  className="flex-1 bg-red-500 hover:bg-red-600"
                                >
                                  Occupy
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedTable(table.number);
                                    setShowReservationDialog(true);
                                  }}
                                  className="flex-1"
                                >
                                  Reserve
                                </Button>
                              </>
                            )}
                            
                            {table.status === 'occupied' && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => updateTableStatus(table.id, 'available')}
                                  className="flex-1 bg-green-500 hover:bg-green-600"
                                >
                                  Free
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateTableStatus(table.id, 'cleaning')}
                                  className="flex-1"
                                >
                                  Clean
                                </Button>
                              </>
                            )}
                            
                            {table.status === 'cleaning' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateTableStatus(table.id, 'available')}
                                className="w-full bg-green-500 hover:bg-green-600"
                              >
                                Ready
                              </Button>
                            )}
                            
                            {table.status === 'reserved' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateTableStatus(table.id, 'occupied')}
                                className="w-full bg-blue-500 hover:bg-blue-600"
                              >
                                Seat Guests
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reservations Panel */}
          <div className="lg:col-span-1">
            <Card className="glass-effect animate-slide-in-right">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    Reservations
                  </div>
                  <Button size="sm" onClick={() => setShowReservationDialog(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <Card key={reservation.id} className="p-4 border-l-4 border-l-blue-500">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{reservation.customerName}</h4>
                          <p className="text-sm text-gray-600">Table {reservation.tableNumber}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => cancelReservation(reservation.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{reservation.partySize} guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{reservation.reservationTime.toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{reservation.reservationTime.toLocaleDateString()}</span>
                        </div>
                        {reservation.notes && (
                          <p className="text-orange-600 text-xs mt-2">Note: {reservation.notes}</p>
                        )}
                      </div>
                    </Card>
                  ))}
                  
                  {reservations.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No reservations today</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reservation Dialog */}
      <Dialog open={showReservationDialog} onOpenChange={setShowReservationDialog}>
        <DialogContent className="glass-effect">
          <DialogHeader>
            <DialogTitle>Make Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={reservationForm.customerName}
                  onChange={(e) => setReservationForm(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  value={reservationForm.customerPhone}
                  onChange={(e) => setReservationForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partySize">Party Size</Label>
                <Input
                  id="partySize"
                  type="number"
                  min="1"
                  value={reservationForm.partySize}
                  onChange={(e) => setReservationForm(prev => ({ ...prev, partySize: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="tableNumber">Table Number</Label>
                <Input
                  id="tableNumber"
                  type="number"
                  value={selectedTable || ''}
                  onChange={(e) => setSelectedTable(parseInt(e.target.value))}
                  placeholder="Select table"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="reservationTime">Reservation Time *</Label>
              <Input
                id="reservationTime"
                type="datetime-local"
                value={reservationForm.reservationTime}
                onChange={(e) => setReservationForm(prev => ({ ...prev, reservationTime: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Special Notes</Label>
              <Input
                id="notes"
                value={reservationForm.notes}
                onChange={(e) => setReservationForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Anniversary, birthday, dietary requirements..."
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleReservation} className="flex-1">
                Create Reservation
              </Button>
              <Button variant="outline" onClick={() => setShowReservationDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableManagement;
