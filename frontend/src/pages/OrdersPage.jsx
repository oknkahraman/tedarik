import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { ordersApi, partsApi, suppliersApi } from '../lib/api';
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, calculateDaysRemaining, cn } from '../lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [parts, setParts] = useState({});
  const [suppliers, setSuppliers] = useState({});
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    actual_delivery: new Date()
  });

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const [ordersRes, partsRes, suppliersRes] = await Promise.all([
        ordersApi.getAll(status),
        partsApi.getAll(),
        suppliersApi.getAll()
      ]);
      
      setOrders(ordersRes.data);
      
      // Create lookup maps
      const partsMap = {};
      partsRes.data.forEach(p => { partsMap[p.id] = p; });
      setParts(partsMap);
      
      const suppliersMap = {};
      suppliersRes.data.forEach(s => { suppliersMap[s.id] = s; });
      setSuppliers(suppliersMap);
    } catch (error) {
      toast.error('Siparişler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    try {
      const updateData = { status: updateForm.status };
      if (updateForm.status === 'delivered') {
        updateData.actual_delivery = updateForm.actual_delivery.toISOString();
      }
      
      await ordersApi.update(selectedOrder.id, updateData);
      toast.success('Sipariş güncellendi');
      setShowUpdateDialog(false);
      loadData();
    } catch (error) {
      toast.error('Sipariş güncellenirken hata oluştu');
    }
  };

  const openUpdateDialog = (order) => {
    setSelectedOrder(order);
    setUpdateForm({
      status: order.status,
      actual_delivery: order.actual_delivery ? new Date(order.actual_delivery) : new Date()
    });
    setShowUpdateDialog(true);
  };

  const filteredOrders = orders.filter(order => {
    const part = parts[order.part_id];
    const supplier = suppliers[order.supplier_id];
    const searchLower = searchQuery.toLowerCase();
    
    return order.code.toLowerCase().includes(searchLower) ||
      part?.name.toLowerCase().includes(searchLower) ||
      supplier?.name.toLowerCase().includes(searchLower);
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock;
      case 'confirmed': return Package;
      case 'in_production': return Package;
      case 'shipped': return Truck;
      case 'delivered': return CheckCircle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="orders-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Siparişler</h1>
          <p className="text-muted-foreground">Sipariş takibi ve yönetimi</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Sipariş ara..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="status-filter">
            <SelectValue placeholder="Durum filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="pending">Bekliyor</SelectItem>
            <SelectItem value="confirmed">Onaylandı</SelectItem>
            <SelectItem value="in_production">Üretimde</SelectItem>
            <SelectItem value="shipped">Sevk Edildi</SelectItem>
            <SelectItem value="delivered">Teslim Edildi</SelectItem>
            <SelectItem value="cancelled">İptal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-heading text-lg font-semibold mb-2">Sipariş Bulunamadı</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery ? 'Arama kriterlerine uygun sipariş bulunamadı.' : 'Henüz sipariş oluşturulmamış.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-sm overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sipariş Kodu</th>
                <th>Parça</th>
                <th>Tedarikçi</th>
                <th>Miktar</th>
                <th>Tutar</th>
                <th>Termin</th>
                <th>Durum</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const part = parts[order.part_id];
                const supplier = suppliers[order.supplier_id];
                const daysRemaining = calculateDaysRemaining(order.expected_delivery);
                const StatusIcon = getStatusIcon(order.status);
                
                return (
                  <tr key={order.id} data-testid={`order-row-${order.id}`}>
                    <td className="font-mono font-medium">{order.code}</td>
                    <td>
                      <div>
                        <p className="font-medium">{part?.name || '-'}</p>
                        <p className="text-xs text-muted-foreground">{part?.code}</p>
                      </div>
                    </td>
                    <td>{supplier?.name || '-'}</td>
                    <td>{order.quantity}</td>
                    <td className="font-medium">{formatCurrency(order.total_price, order.currency)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span>{formatDate(order.expected_delivery)}</span>
                        {order.status !== 'delivered' && order.status !== 'cancelled' && daysRemaining !== null && (
                          <Badge variant={daysRemaining <= 2 ? 'destructive' : daysRemaining <= 5 ? 'warning' : 'secondary'}>
                            {daysRemaining > 0 ? `${daysRemaining} gün` : 'Bugün'}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn('h-4 w-4', order.status === 'delivered' ? 'text-emerald-500' : 'text-muted-foreground')} />
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </td>
                    <td>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openUpdateDialog(order)}
                      >
                        Güncelle
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Update Order Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="sm:max-w-md" data-testid="update-order-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Sipariş Güncelle</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-sm p-4 space-y-2">
                <p className="font-mono font-medium">{selectedOrder.code}</p>
                <p className="text-sm text-muted-foreground">
                  {parts[selectedOrder.part_id]?.name} - {suppliers[selectedOrder.supplier_id]?.name}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Durum</Label>
                <Select 
                  value={updateForm.status} 
                  onValueChange={(v) => setUpdateForm({...updateForm, status: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Bekliyor</SelectItem>
                    <SelectItem value="confirmed">Onaylandı</SelectItem>
                    <SelectItem value="in_production">Üretimde</SelectItem>
                    <SelectItem value="shipped">Sevk Edildi</SelectItem>
                    <SelectItem value="delivered">Teslim Edildi</SelectItem>
                    <SelectItem value="cancelled">İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {updateForm.status === 'delivered' && (
                <div className="space-y-2">
                  <Label>Gerçek Teslim Tarihi</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {format(updateForm.actual_delivery, 'dd MMM yyyy', { locale: tr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={updateForm.actual_delivery}
                        onSelect={(date) => date && setUpdateForm({...updateForm, actual_delivery: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>İptal</Button>
            <Button onClick={handleUpdateOrder}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OrdersPage;
