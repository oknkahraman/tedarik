import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Star, Phone, Mail, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Progress } from '../components/ui/progress';
import { suppliersApi, staticDataApi } from '../lib/api';
import { getScoreClass, getScoreStars, cn } from '../lib/utils';
import { toast } from 'sonner';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [methods, setMethods] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    specializations: [],
    payment_terms: 30,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [suppliersRes, methodsRes] = await Promise.all([
        suppliersApi.getAll(),
        staticDataApi.getManufacturingMethods()
      ]);
      setSuppliers(suppliersRes.data);
      setMethods(methodsRes.data);
    } catch (error) {
      toast.error('Tedarikçiler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!formData.name || !formData.contact_person || !formData.email) {
      toast.error('Firma adı, yetkili kişi ve e-posta zorunludur');
      return;
    }

    try {
      await suppliersApi.create(formData);
      toast.success('Tedarikçi başarıyla eklendi');
      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Tedarikçi eklenirken hata oluştu');
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (!window.confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) return;
    
    try {
      await suppliersApi.delete(supplierId);
      toast.success('Tedarikçi silindi');
      loadData();
    } catch (error) {
      toast.error('Tedarikçi silinirken hata oluştu');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      tax_id: '',
      specializations: [],
      payment_terms: 30,
      notes: ''
    });
  };

  const toggleSpecialization = (code) => {
    const current = formData.specializations;
    if (current.includes(code)) {
      setFormData({...formData, specializations: current.filter(c => c !== code)});
    } else {
      setFormData({...formData, specializations: [...current, code]});
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group methods by category
  const methodsByCategory = Object.values(methods).reduce((acc, method) => {
    if (!acc[method.category]) acc[method.category] = [];
    acc[method.category].push(method);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in" data-testid="suppliers-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Tedarikçiler</h1>
          <p className="text-muted-foreground">Tedarikçi veritabanı ve performans takibi</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="add-supplier-btn">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Tedarikçi
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Tedarikçi ara..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="search-input"
        />
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-heading text-lg font-semibold mb-2">Tedarikçi Bulunamadı</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery ? 'Arama kriterlerine uygun tedarikçi bulunamadı.' : 'Henüz tedarikçi eklenmemiş.'}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                İlk Tedarikçiyi Ekle
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => {
            const score = supplier.performance?.total_score || 0;
            return (
              <Card 
                key={supplier.id} 
                className="hover:shadow-md transition-shadow"
                data-testid={`supplier-card-${supplier.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => { setSelectedSupplier(supplier); setShowDetailDialog(true); }}
                    >
                      <CardTitle className="font-heading text-lg">{supplier.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{supplier.contact_person}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn('score-badge', getScoreClass(score))}>
                        {Math.round(score)}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedSupplier(supplier); setShowDetailDialog(true); }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Detaylar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-muted-foreground">Performans:</span>
                      <span>{getScoreStars(score)}</span>
                    </div>
                    {supplier.specializations?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {supplier.specializations.slice(0, 3).map(code => (
                          <Badge key={code} variant="outline" className="text-xs">
                            {methods[code]?.name || code}
                          </Badge>
                        ))}
                        {supplier.specializations.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{supplier.specializations.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Supplier Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="create-supplier-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Yeni Tedarikçi Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Firma Adı *</Label>
                <Input 
                  placeholder="Örn: ABC Torna"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  data-testid="supplier-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Yetkili Kişi *</Label>
                <Input 
                  placeholder="İsim Soyisim"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  data-testid="contact-person-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-posta *</Label>
                <Input 
                  type="email"
                  placeholder="info@firma.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  data-testid="email-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input 
                  placeholder="0312 XXX XX XX"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adres</Label>
              <Textarea 
                placeholder="Firma adresi"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vergi No</Label>
                <Input 
                  placeholder="12345678901"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Ödeme Vadesi (gün)</Label>
                <Input 
                  type="number"
                  min="0"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({...formData, payment_terms: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            
            {/* Specializations */}
            <div className="space-y-2">
              <Label>Uzmanlık Alanları</Label>
              <div className="border rounded-sm p-4 max-h-48 overflow-y-auto space-y-4">
                {Object.entries(methodsByCategory).map(([category, categoryMethods]) => (
                  <div key={category}>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{category}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {categoryMethods.map((method) => (
                        <div key={method.code} className="flex items-center gap-2">
                          <Checkbox 
                            id={`spec-${method.code}`}
                            checked={formData.specializations.includes(method.code)}
                            onCheckedChange={() => toggleSpecialization(method.code)}
                          />
                          <Label htmlFor={`spec-${method.code}`} className="text-sm cursor-pointer">
                            <span className="font-mono text-xs text-muted-foreground mr-1">{method.code}</span>
                            {method.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea 
                placeholder="Tedarikçi hakkında notlar"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>İptal</Button>
            <Button onClick={handleCreateSupplier} data-testid="submit-supplier-btn">Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-lg" data-testid="supplier-detail-dialog">
          {selectedSupplier && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading">{selectedSupplier.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Performance Score */}
                <div className="bg-secondary/50 rounded-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium">Performans Skoru</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {Math.round(selectedSupplier.performance?.total_score || 0)}/100
                      </span>
                      <span>{getScoreStars(selectedSupplier.performance?.total_score || 0)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Termin Performansı</span>
                        <span>{selectedSupplier.performance?.delivery_score || 0}/40</span>
                      </div>
                      <Progress value={(selectedSupplier.performance?.delivery_score || 0) * 2.5} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Kalite Skoru</span>
                        <span>{selectedSupplier.performance?.quality_score || 0}/30</span>
                      </div>
                      <Progress value={(selectedSupplier.performance?.quality_score || 0) * 3.33} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Fiyat Rekabetçiliği</span>
                        <span>{selectedSupplier.performance?.price_score || 0}/20</span>
                      </div>
                      <Progress value={(selectedSupplier.performance?.price_score || 0) * 5} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Ödeme Koşulları</span>
                        <span>{selectedSupplier.performance?.payment_score || 0}/10</span>
                      </div>
                      <Progress value={(selectedSupplier.performance?.payment_score || 0) * 10} />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <h4 className="font-medium">İletişim Bilgileri</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Yetkili:</span> {selectedSupplier.contact_person}</p>
                    <p><span className="text-muted-foreground">E-posta:</span> {selectedSupplier.email}</p>
                    {selectedSupplier.phone && <p><span className="text-muted-foreground">Telefon:</span> {selectedSupplier.phone}</p>}
                    {selectedSupplier.address && <p><span className="text-muted-foreground">Adres:</span> {selectedSupplier.address}</p>}
                  </div>
                </div>

                {/* Specializations */}
                {selectedSupplier.specializations?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Uzmanlık Alanları</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedSupplier.specializations.map(code => (
                        <Badge key={code} variant="outline">
                          {methods[code]?.name || code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-secondary/50 rounded-sm p-3">
                    <p className="text-2xl font-bold">{selectedSupplier.performance?.total_orders || 0}</p>
                    <p className="text-xs text-muted-foreground">Toplam Sipariş</p>
                  </div>
                  <div className="bg-secondary/50 rounded-sm p-3">
                    <p className="text-2xl font-bold">{selectedSupplier.performance?.on_time_deliveries || 0}</p>
                    <p className="text-xs text-muted-foreground">Zamanında</p>
                  </div>
                  <div className="bg-secondary/50 rounded-sm p-3">
                    <p className="text-2xl font-bold">{selectedSupplier.payment_terms || 30}</p>
                    <p className="text-xs text-muted-foreground">Gün Vade</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Kapat</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SuppliersPage;
