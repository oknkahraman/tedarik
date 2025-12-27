import React, { useState, useEffect } from 'react';
import { Settings, Save, Building, Mail, Phone, MapPin, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { settingsApi, currencyApi } from '../lib/api';
import { formatDateTime } from '../lib/utils';
import { toast } from 'sonner';

export function SettingsPage() {
  const [settings, setSettings] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: ''
  });
  const [currencyRates, setCurrencyRates] = useState({
    usd_to_try: 33.0,
    eur_to_try: 36.5,
    updated_at: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsRes, ratesRes] = await Promise.all([
        settingsApi.get(),
        currencyApi.getRates()
      ]);
      setSettings(settingsRes.data);
      setCurrencyRates(ratesRes.data);
    } catch (error) {
      toast.error('Ayarlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await settingsApi.update(settings);
      toast.success('Ayarlar kaydedildi');
    } catch (error) {
      toast.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCurrencyRates = async () => {
    setSaving(true);
    try {
      const response = await currencyApi.updateRates({
        usd_to_try: currencyRates.usd_to_try,
        eur_to_try: currencyRates.eur_to_try
      });
      setCurrencyRates(response.data);
      toast.success('Döviz kurları güncellendi');
    } catch (error) {
      toast.error('Döviz kurları güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground">Sistem ve şirket ayarlarını yönetin</p>
      </div>

      {/* Company Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Building className="h-5 w-5" />
            Şirket Bilgileri
          </CardTitle>
          <CardDescription>
            Şirket iletişim bilgileri ve genel ayarlar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Şirket Adı</Label>
              <Input 
                id="company_name"
                placeholder="Şirket adı"
                value={settings.company_name || ''}
                onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                data-testid="company-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_email">E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="company_email"
                  type="email"
                  placeholder="info@sirket.com"
                  value={settings.company_email || ''}
                  onChange={(e) => setSettings({...settings, company_email: e.target.value})}
                  className="pl-10"
                  data-testid="company-email-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_phone">Telefon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="company_phone"
                  placeholder="0312 XXX XX XX"
                  value={settings.company_phone || ''}
                  onChange={(e) => setSettings({...settings, company_phone: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_address">Adres</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="company_address"
                  placeholder="Şirket adresi"
                  value={settings.company_address || ''}
                  onChange={(e) => setSettings({...settings, company_address: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving} data-testid="save-settings-btn">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Currency Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Döviz Kurları
          </CardTitle>
          <CardDescription>
            Manuel döviz kuru girişi (TCMB API kullanılmıyor)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usd_rate">1 USD = TRY</Label>
              <Input 
                id="usd_rate"
                type="number"
                step="0.01"
                min="0"
                value={currencyRates.usd_to_try}
                onChange={(e) => setCurrencyRates({...currencyRates, usd_to_try: parseFloat(e.target.value) || 0})}
                data-testid="usd-rate-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eur_rate">1 EUR = TRY</Label>
              <Input 
                id="eur_rate"
                type="number"
                step="0.01"
                min="0"
                value={currencyRates.eur_to_try}
                onChange={(e) => setCurrencyRates({...currencyRates, eur_to_try: parseFloat(e.target.value) || 0})}
                data-testid="eur-rate-input"
              />
            </div>
          </div>
          {currencyRates.updated_at && (
            <p className="text-sm text-muted-foreground">
              Son güncelleme: {formatDateTime(currencyRates.updated_at)}
            </p>
          )}
          <div className="flex justify-end">
            <Button onClick={handleSaveCurrencyRates} disabled={saving} data-testid="save-rates-btn">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Kaydediliyor...' : 'Kurları Güncelle'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contabo Deployment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Contabo Kurulum Bilgileri</CardTitle>
          <CardDescription>
            Sistemi Contabo VPS'e kurmak için gerekli bilgiler
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-sm p-4 font-mono text-sm space-y-2">
            <p className="font-bold text-foreground"># 1. Gereksinimler</p>
            <p>- Ubuntu 22.04 LTS</p>
            <p>- Node.js 18+</p>
            <p>- Python 3.10+</p>
            <p>- MongoDB 6.0+</p>
            <p>- Nginx</p>
            
            <Separator className="my-4" />
            
            <p className="font-bold text-foreground"># 2. MongoDB Kurulumu</p>
            <p>wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -</p>
            <p>echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list</p>
            <p>sudo apt update && sudo apt install -y mongodb-org</p>
            <p>sudo systemctl enable mongod && sudo systemctl start mongod</p>
            
            <Separator className="my-4" />
            
            <p className="font-bold text-foreground"># 3. Backend Kurulumu</p>
            <p>cd /var/www/promanufakt/backend</p>
            <p>python3 -m venv venv</p>
            <p>source venv/bin/activate</p>
            <p>pip install -r requirements.txt</p>
            <p>uvicorn server:app --host 0.0.0.0 --port 8001</p>
            
            <Separator className="my-4" />
            
            <p className="font-bold text-foreground"># 4. Frontend Kurulumu</p>
            <p>cd /var/www/promanufakt/frontend</p>
            <p>yarn install</p>
            <p>yarn build</p>
            
            <Separator className="my-4" />
            
            <p className="font-bold text-foreground"># 5. Nginx Konfigürasyonu</p>
            <p>sudo nano /etc/nginx/sites-available/promanufakt</p>
          </div>
          
          <div className="bg-muted rounded-sm p-4 font-mono text-sm">
            <p className="text-muted-foreground"># Nginx Config Örneği:</p>
            <pre className="mt-2 text-xs">{`server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/promanufakt/frontend/build;
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
