import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Factory, Package, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { quotesApi } from '../lib/api';
import { formatDate, formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function QuoteFormPage() {
  const { requestId } = useParams();
  const [searchParams] = useSearchParams();
  const supplierId = searchParams.get('supplier');
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(null);
  
  const [response, setResponse] = useState({
    unit_price: 0,
    currency: 'TRY',
    delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    payment_terms: 30,
    notes: ''
  });

  useEffect(() => {
    loadFormData();
  }, [requestId, supplierId, token]);

  const loadFormData = async () => {
    try {
      const res = await quotesApi.getFormData(requestId, supplierId, token);
      setFormData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Form yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (response.unit_price <= 0) {
      toast.error('Birim fiyat giriniz');
      return;
    }

    setSubmitting(true);
    try {
      await quotesApi.submitForm({
        quote_request_id: requestId,
        supplier_id: supplierId,
        token: token,
        unit_price: response.unit_price,
        currency: response.currency,
        delivery_date: response.delivery_date.toISOString(),
        payment_terms: response.payment_terms,
        notes: response.notes || null
      });
      setSubmitted(true);
      toast.success('Teklifiniz başarıyla gönderildi!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Teklif gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Hata</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Teklif Gönderildi!</h2>
            <p className="text-muted-foreground">
              Teklifiniz başarıyla alındı. Değerlendirme sonucunda sizinle iletişime geçilecektir.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Bu sayfayı kapatabilirsiniz.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { quote_request, part, project, supplier, method, material } = formData || {};
  const quantity = part?.quantity || 1;
  const totalPrice = response.unit_price * quantity;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="quote-form-page">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-6">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <Factory className="h-8 w-8 text-orange-500" />
            <span className="font-heading font-bold text-xl">ProManufakt</span>
          </div>
          <h1 className="text-2xl font-bold mt-4">Teklif Formu</h1>
          <p className="text-primary-foreground/80">Lütfen aşağıdaki formu doldurun</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Request Info */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Teklif Detayları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Proje</p>
                <p className="font-medium">{project?.name || '-'}</p>
                <p className="text-xs text-muted-foreground font-mono">{project?.code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tedarikçi</p>
                <p className="font-medium">{supplier?.name}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Parça Bilgileri</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Parça Adı</p>
                  <p className="font-medium">{part?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Parça Kodu</p>
                  <p className="font-medium font-mono">{part?.code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Miktar</p>
                  <p className="font-medium">{quantity} adet</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Malzeme</p>
                  <p className="font-medium">{material?.name || part?.material || '-'}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">İstenen İşlem</p>
              <p className="font-medium">{method?.code} - {method?.name}</p>
              <p className="text-sm text-muted-foreground">{method?.description}</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">Teklif Son Tarihi</p>
              <p className="font-medium">{formatDate(quote_request?.deadline)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Response Form */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Teklif Bilgileri</CardTitle>
            <CardDescription>Fiyat ve teslimat bilgilerinizi girin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Birim Fiyat *</Label>
                <Input 
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={response.unit_price || ''}
                  onChange={(e) => setResponse({...response, unit_price: parseFloat(e.target.value) || 0})}
                  data-testid="unit-price-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Select 
                  value={response.currency} 
                  onValueChange={(v) => setResponse({...response, currency: v})}
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

            <div className="bg-muted/50 rounded-sm p-4">
              <p className="text-sm text-muted-foreground">Toplam Tutar ({quantity} adet)</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPrice, response.currency)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teslimat Tarihi *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {format(response.delivery_date, 'dd MMMM yyyy', { locale: tr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={response.delivery_date}
                      onSelect={(date) => date && setResponse({...response, delivery_date: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Ödeme Vadesi (gün)</Label>
                <Select 
                  value={String(response.payment_terms)} 
                  onValueChange={(v) => setResponse({...response, payment_terms: parseInt(v)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Peşin</SelectItem>
                    <SelectItem value="15">15 gün</SelectItem>
                    <SelectItem value="30">30 gün</SelectItem>
                    <SelectItem value="60">60 gün</SelectItem>
                    <SelectItem value="90">90 gün</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notlar / Özel Koşullar</Label>
              <Textarea 
                placeholder="Varsa eklemek istediğiniz notlar..."
                value={response.notes}
                onChange={(e) => setResponse({...response, notes: e.target.value})}
                rows={3}
              />
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleSubmit}
              disabled={submitting || response.unit_price <= 0}
              data-testid="submit-quote-btn"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Teklifi Gönder
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          © 2025 ProManufakt - Tüm hakları saklıdır
        </p>
      </div>
    </div>
  );
}

export default QuoteFormPage;
