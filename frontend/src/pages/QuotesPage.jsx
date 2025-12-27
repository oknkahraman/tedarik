import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Package, CheckCircle, XCircle, Mail, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { quotesApi, partsApi, suppliersApi, ordersApi, staticDataApi } from '../lib/api';
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, getScoreClass, cn } from '../lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function QuotesPage() {
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [showAddResponseDialog, setShowAddResponseDialog] = useState(false);
  const [showSendEmailDialog, setShowSendEmailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [parts, setParts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [methods, setMethods] = useState({});
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailSuppliers, setEmailSuppliers] = useState([]);

  const [requestForm, setRequestForm] = useState({
    part_id: '',
    supplier_ids: [],
    manufacturing_method: '',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notes: ''
  });

  const [responseForm, setResponseForm] = useState({
    quote_request_id: '',
    supplier_id: '',
    unit_price: 0,
    currency: 'TRY',
    total_price: 0,
    delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    payment_terms: 30,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [requestsRes, partsRes, suppliersRes, methodsRes] = await Promise.all([
        quotesApi.getRequests(),
        partsApi.getAll(),
        suppliersApi.getAll(),
        staticDataApi.getManufacturingMethods()
      ]);
      setQuoteRequests(requestsRes.data);
      setParts(partsRes.data);
      setSuppliers(suppliersRes.data);
      setMethods(methodsRes.data);
    } catch (error) {
      toast.error('Teklifler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!requestForm.part_id || requestForm.supplier_ids.length === 0 || !requestForm.manufacturing_method) {
      toast.error('Parça, tedarikçi ve imalat yöntemi seçimi zorunludur');
      return;
    }

    try {
      await quotesApi.createRequest({
        ...requestForm,
        deadline: requestForm.deadline.toISOString()
      });
      toast.success('Teklif talebi oluşturuldu');
      setShowCreateDialog(false);
      setRequestForm({
        part_id: '',
        supplier_ids: [],
        manufacturing_method: '',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: ''
      });
      loadData();
    } catch (error) {
      toast.error('Teklif talebi oluşturulurken hata oluştu');
    }
  };

  const handleViewComparison = async (request) => {
    setSelectedRequest(request);
    try {
      const response = await quotesApi.getComparison(request.id);
      setComparison(response.data);
      setShowComparisonDialog(true);
    } catch (error) {
      toast.error('Teklif karşılaştırması yüklenirken hata oluştu');
    }
  };

  const handleAddResponse = (request) => {
    setSelectedRequest(request);
    setResponseForm({
      ...responseForm,
      quote_request_id: request.id
    });
    setShowAddResponseDialog(true);
  };

  const handleSubmitResponse = async () => {
    if (!responseForm.supplier_id || responseForm.unit_price <= 0) {
      toast.error('Tedarikçi ve fiyat bilgisi zorunludur');
      return;
    }

    try {
      await quotesApi.createResponse({
        ...responseForm,
        delivery_date: responseForm.delivery_date.toISOString()
      });
      toast.success('Teklif yanıtı eklendi');
      setShowAddResponseDialog(false);
      loadData();
    } catch (error) {
      toast.error('Teklif yanıtı eklenirken hata oluştu');
    }
  };

  const handleApproveQuote = async (quoteResponse) => {
    const part = parts.find(p => p.id === selectedRequest.part_id);
    if (!part) return;

    try {
      await ordersApi.create({
        quote_response_id: quoteResponse.response.id,
        part_id: selectedRequest.part_id,
        supplier_id: quoteResponse.response.supplier_id,
        quantity: part.quantity,
        unit_price: quoteResponse.response.unit_price,
        currency: quoteResponse.response.currency,
        total_price: quoteResponse.response.total_price,
        expected_delivery: quoteResponse.response.delivery_date
      });
      toast.success('Sipariş oluşturuldu');
      setShowComparisonDialog(false);
      loadData();
    } catch (error) {
      toast.error('Sipariş oluşturulurken hata oluştu');
    }
  };

  const handleOpenSendEmail = (request) => {
    setSelectedRequest(request);
    setEmailSuppliers(request.supplier_ids || []);
    setShowSendEmailDialog(true);
  };

  const handleSendEmails = async () => {
    if (emailSuppliers.length === 0) {
      toast.error('En az bir tedarikçi seçin');
      return;
    }

    setSendingEmails(true);
    try {
      const response = await quotesApi.sendEmails({
        quote_request_id: selectedRequest.id,
        supplier_ids: emailSuppliers
      });
      
      if (response.data.sent && response.data.sent.length > 0) {
        toast.success(`${response.data.sent.length} tedarikçiye e-posta gönderildi`);
      }
      if (response.data.failed && response.data.failed.length > 0) {
        toast.warning(`${response.data.failed.length} e-posta gönderilemedi`);
      }
      setShowSendEmailDialog(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'E-posta gönderilemedi');
    } finally {
      setSendingEmails(false);
    }
  };

  const toggleEmailSupplier = (supplierId) => {
    if (emailSuppliers.includes(supplierId)) {
      setEmailSuppliers(emailSuppliers.filter(id => id !== supplierId));
    } else {
      setEmailSuppliers([...emailSuppliers, supplierId]);
    }
  };

  const toggleSupplier = (supplierId) => {
    const current = requestForm.supplier_ids;
    if (current.includes(supplierId)) {
      setRequestForm({...requestForm, supplier_ids: current.filter(id => id !== supplierId)});
    } else {
      setRequestForm({...requestForm, supplier_ids: [...current, supplierId]});
    }
  };

  const getSupplierName = (id) => suppliers.find(s => s.id === id)?.name || id;
  const getPartInfo = (id) => parts.find(p => p.id === id);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="quotes-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Teklifler</h1>
          <p className="text-muted-foreground">Teklif talepleri ve karşılaştırmalar</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="create-quote-btn">
          <Plus className="h-4 w-4 mr-2" />
          Teklif Talebi Oluştur
        </Button>
      </div>

      {/* Quote Requests List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : quoteRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-heading text-lg font-semibold mb-2">Teklif Talebi Bulunamadı</h3>
            <p className="text-muted-foreground text-center">
              Henüz teklif talebi oluşturulmamış.
            </p>
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              İlk Teklif Talebini Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quoteRequests.map((request) => {
            const part = getPartInfo(request.part_id);
            return (
              <Card key={request.id} data-testid={`quote-request-${request.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{part?.name || 'Bilinmeyen Parça'}</span>
                        <span className="font-mono text-sm text-muted-foreground">{part?.code}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        İşlem: {methods[request.manufacturing_method]?.name || request.manufacturing_method}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tedarikçiler: {request.supplier_ids.map(getSupplierName).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Son: {formatDate(request.deadline)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenSendEmail(request)}
                          data-testid={`send-email-${request.id}`}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          E-posta Gönder
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAddResponse(request)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Yanıt Ekle
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleViewComparison(request)}
                        >
                          Karşılaştır
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Quote Request Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg" data-testid="create-quote-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Teklif Talebi Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Parça *</Label>
              <Select 
                value={requestForm.part_id} 
                onValueChange={(v) => setRequestForm({...requestForm, part_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Parça seçin" />
                </SelectTrigger>
                <SelectContent>
                  {parts.map(part => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.code} - {part.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>İmalat Yöntemi *</Label>
              <Select 
                value={requestForm.manufacturing_method} 
                onValueChange={(v) => setRequestForm({...requestForm, manufacturing_method: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="İmalat yöntemi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(methods).map(method => (
                    <SelectItem key={method.code} value={method.code}>
                      {method.code} - {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tedarikçiler *</Label>
              <div className="border rounded-sm p-3 max-h-40 overflow-y-auto space-y-2">
                {suppliers.map(supplier => (
                  <div key={supplier.id} className="flex items-center gap-2">
                    <Checkbox 
                      id={`supplier-${supplier.id}`}
                      checked={requestForm.supplier_ids.includes(supplier.id)}
                      onCheckedChange={() => toggleSupplier(supplier.id)}
                    />
                    <Label htmlFor={`supplier-${supplier.id}`} className="text-sm cursor-pointer flex-1">
                      {supplier.name}
                    </Label>
                    <span className={cn('text-xs px-2 py-0.5 rounded', getScoreClass(supplier.performance?.total_score || 0))}>
                      {Math.round(supplier.performance?.total_score || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Teklif Son Tarihi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {format(requestForm.deadline, 'dd MMM yyyy', { locale: tr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={requestForm.deadline}
                    onSelect={(date) => date && setRequestForm({...requestForm, deadline: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>İptal</Button>
            <Button onClick={handleCreateRequest}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Response Dialog */}
      <Dialog open={showAddResponseDialog} onOpenChange={setShowAddResponseDialog}>
        <DialogContent className="sm:max-w-lg" data-testid="add-response-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Teklif Yanıtı Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tedarikçi *</Label>
              <Select 
                value={responseForm.supplier_id} 
                onValueChange={(v) => setResponseForm({...responseForm, supplier_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tedarikçi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {selectedRequest?.supplier_ids?.map(id => {
                    const supplier = suppliers.find(s => s.id === id);
                    return supplier ? (
                      <SelectItem key={id} value={id}>{supplier.name}</SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Birim Fiyat *</Label>
                <Input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={responseForm.unit_price}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0;
                    const part = getPartInfo(selectedRequest?.part_id);
                    setResponseForm({
                      ...responseForm, 
                      unit_price: price,
                      total_price: price * (part?.quantity || 1)
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Select 
                  value={responseForm.currency} 
                  onValueChange={(v) => setResponseForm({...responseForm, currency: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">TRY (₺)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Toplam Tutar</Label>
              <Input 
                value={formatCurrency(responseForm.total_price, responseForm.currency)}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teslimat Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {format(responseForm.delivery_date, 'dd MMM yyyy', { locale: tr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={responseForm.delivery_date}
                      onSelect={(date) => date && setResponseForm({...responseForm, delivery_date: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Ödeme Vadesi (gün)</Label>
                <Input 
                  type="number"
                  min="0"
                  value={responseForm.payment_terms}
                  onChange={(e) => setResponseForm({...responseForm, payment_terms: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddResponseDialog(false)}>İptal</Button>
            <Button onClick={handleSubmitResponse}>Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comparison Dialog */}
      <Dialog open={showComparisonDialog} onOpenChange={setShowComparisonDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="comparison-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Teklif Karşılaştırma</DialogTitle>
            <CardDescription>
              {getPartInfo(selectedRequest?.part_id)?.name} - {methods[selectedRequest?.manufacturing_method]?.name}
            </CardDescription>
          </DialogHeader>
          <div className="py-4">
            {comparison?.comparison?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Henüz teklif yanıtı alınmamış</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comparison?.comparison?.map((item, index) => (
                  <Card 
                    key={item.response.id} 
                    className={cn(index === 0 && 'border-2 border-emerald-500')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            {index === 0 && <Badge className="bg-emerald-500">1. Önerilen</Badge>}
                            {index === 1 && <Badge variant="secondary">2.</Badge>}
                            {index === 2 && <Badge variant="outline">3.</Badge>}
                            <span className="font-medium">{item.supplier?.name}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Fiyat</p>
                              <p className="font-medium">{formatCurrency(item.response.total_price, item.response.currency)}</p>
                              <p className="text-xs text-muted-foreground">
                                ({formatCurrency(item.price_try, 'TRY')})
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Teslimat</p>
                              <p className="font-medium">{formatDate(item.response.delivery_date)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Vade</p>
                              <p className="font-medium">{item.response.payment_terms} gün</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Skor</p>
                              <p className={cn('font-bold text-lg', getScoreClass(item.scores?.total || 0))}>
                                {item.scores?.total || 0}/100
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => handleApproveQuote(item)}
                          data-testid={`approve-quote-${item.response.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Onayla
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComparisonDialog(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={showSendEmailDialog} onOpenChange={setShowSendEmailDialog}>
        <DialogContent className="sm:max-w-md" data-testid="send-email-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Teklif E-postası Gönder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-sm p-4 text-sm">
              <p className="font-medium mb-2">Seçilen tedarikçilere teklif formu linki içeren e-posta gönderilecek.</p>
              <p className="text-muted-foreground">Tedarikçiler formu doldurarak teklif verebilecek.</p>
            </div>

            <div className="space-y-2">
              <Label>Tedarikçileri Seçin</Label>
              <div className="border rounded-sm p-3 max-h-48 overflow-y-auto space-y-2">
                {selectedRequest?.supplier_ids?.map(id => {
                  const supplier = suppliers.find(s => s.id === id);
                  if (!supplier) return null;
                  return (
                    <div key={id} className="flex items-center gap-2">
                      <Checkbox 
                        id={`email-${id}`}
                        checked={emailSuppliers.includes(id)}
                        onCheckedChange={() => toggleEmailSupplier(id)}
                      />
                      <Label htmlFor={`email-${id}`} className="text-sm cursor-pointer flex-1">
                        {supplier.name}
                      </Label>
                      <span className="text-xs text-muted-foreground">{supplier.email}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {emailSuppliers.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {emailSuppliers.length} tedarikçiye e-posta gönderilecek
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendEmailDialog(false)}>İptal</Button>
            <Button onClick={handleSendEmails} disabled={sendingEmails || emailSuppliers.length === 0}>
              {sendingEmails ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  E-posta Gönder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default QuotesPage;
