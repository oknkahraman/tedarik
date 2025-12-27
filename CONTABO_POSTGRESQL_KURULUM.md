# ProManufakt - Contabo VPS + PostgreSQL Kurulum Rehberi

Bu rehber, ProManufakt uygulamasını Contabo VPS sunucusuna PostgreSQL veritabanı ile kurmanızı sağlar.

---

## 📋 Gereksinimler

- Contabo VPS (Ubuntu 22.04 LTS önerilir)
- Root veya sudo erişimi
- Domain adı (opsiyonel, SSL için gerekli)

---

## 1️⃣ Sunucu Hazırlığı

### SSH ile Bağlanma
```bash
ssh root@YOUR_SERVER_IP
```

### Sistem Güncelleme
```bash
apt update && apt upgrade -y
```

### Temel Paketleri Yükleme
```bash
apt install -y curl wget git nginx certbot python3-certbot-nginx
```

---

## 2️⃣ PostgreSQL Kurulumu

### PostgreSQL 16 Yükleme
```bash
# PostgreSQL repository ekle
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update

# PostgreSQL 16 yükle
apt install -y postgresql-16 postgresql-contrib-16
```

### PostgreSQL Başlatma
```bash
systemctl start postgresql
systemctl enable postgresql
```

### Veritabanı ve Kullanıcı Oluşturma
```bash
sudo -u postgres psql << EOF
-- Veritabanı kullanıcısı oluştur
CREATE USER promanufakt_user WITH PASSWORD 'GÜÇLÜ_ŞİFRE_BURAYA';

-- Veritabanı oluştur
CREATE DATABASE promanufakt_db OWNER promanufakt_user;

-- İzinleri ver
GRANT ALL PRIVILEGES ON DATABASE promanufakt_db TO promanufakt_user;
EOF
```

### Uzak Bağlantı İzni (Opsiyonel)
Eğer veritabanına dışarıdan erişim gerekiyorsa:

```bash
# postgresql.conf düzenle
nano /etc/postgresql/16/main/postgresql.conf
# listen_addresses = '*' satırını ekle/düzenle

# pg_hba.conf düzenle
nano /etc/postgresql/16/main/pg_hba.conf
# Aşağıdaki satırı ekle (güvenlik için IP sınırlaması önerilir):
# host    promanufakt_db    promanufakt_user    YOUR_IP/32    scram-sha-256

# Servisi yeniden başlat
systemctl restart postgresql
```

---

## 3️⃣ Python ve Node.js Kurulumu

### Python 3.11 Kurulumu
```bash
apt install -y python3.11 python3.11-venv python3-pip
```

### Node.js 20 LTS Kurulumu
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g yarn
```

---

## 4️⃣ Uygulama Kurulumu

### Proje Dizini Oluşturma
```bash
mkdir -p /var/www/promanufakt
cd /var/www/promanufakt
```

### Kaynak Kodu Yükleme
```bash
# Git ile klonla (veya dosyaları SCP ile yükle)
git clone YOUR_REPO_URL .

# Veya SCP ile:
# scp -r /local/path/to/app/* root@YOUR_SERVER_IP:/var/www/promanufakt/
```

### Backend Kurulumu
```bash
cd /var/www/promanufakt/backend

# Virtual environment oluştur
python3.11 -m venv venv
source venv/bin/activate

# Bağımlılıkları yükle
pip install --upgrade pip
pip install -r requirements.txt

# PostgreSQL driver'ı ekle (MongoDB yerine)
pip install asyncpg databases[postgresql] sqlalchemy
```

### Backend .env Dosyası
```bash
cat > /var/www/promanufakt/backend/.env << EOF
# PostgreSQL Bağlantısı
DATABASE_URL=postgresql://promanufakt_user:GÜÇLÜ_ŞİFRE_BURAYA@localhost:5432/promanufakt_db

# Uygulama Ayarları
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=false

# Email Ayarları (Resend)
RESEND_API_KEY=your_resend_api_key
SENDER_EMAIL=noreply@yourdomain.com
EOF
```

### Frontend Kurulumu
```bash
cd /var/www/promanufakt/frontend

# Bağımlılıkları yükle
yarn install

# Production build
yarn build
```

### Frontend .env Dosyası
```bash
cat > /var/www/promanufakt/frontend/.env << EOF
REACT_APP_BACKEND_URL=https://yourdomain.com
EOF
```

---

## 5️⃣ Backend'i PostgreSQL'e Geçirme

Mevcut uygulama MongoDB kullanıyor. PostgreSQL'e geçiş için `server.py` dosyasında değişiklik yapmanız gerekiyor.

### Örnek PostgreSQL Bağlantısı
```python
# server.py başında MongoDB yerine:
from databases import Database
from sqlalchemy import create_engine, MetaData

DATABASE_URL = os.environ.get("DATABASE_URL")
database = Database(DATABASE_URL)

# Uygulama başlatma
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
```

### SQL Tabloları Oluşturma
```sql
-- PostgreSQL'de tablolar oluştur
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'planning',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    quantity INTEGER DEFAULT 1,
    material VARCHAR(50),
    form_type VARCHAR(50),
    dimensions JSONB,
    manufacturing_methods TEXT[],
    status VARCHAR(50) DEFAULT 'waiting',
    notes TEXT,
    technical_drawing_filename VARCHAR(255),
    technical_drawing_original_name VARCHAR(255),
    technical_drawing_uploaded_at TIMESTAMP,
    additional_documents JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    specialization TEXT[],
    performance_score DECIMAL(3,2) DEFAULT 0,
    delivery_score DECIMAL(3,2) DEFAULT 0,
    quality_score DECIMAL(3,2) DEFAULT 0,
    price_score DECIMAL(3,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
    supplier_ids UUID[],
    requested_delivery_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quote_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_request_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    price DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'TRY',
    delivery_date DATE,
    payment_terms VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_response_id UUID REFERENCES quote_responses(id),
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE currency_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usd_to_try DECIMAL(10,4) DEFAULT 0,
    eur_to_try DECIMAL(10,4) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX idx_parts_project ON parts(project_id);
CREATE INDEX idx_quote_requests_part ON quote_requests(part_id);
CREATE INDEX idx_quote_responses_request ON quote_responses(quote_request_id);
CREATE INDEX idx_orders_quote ON orders(quote_response_id);
```

---

## 6️⃣ Systemd Servisleri

### Backend Servisi
```bash
cat > /etc/systemd/system/promanufakt-backend.service << EOF
[Unit]
Description=ProManufakt Backend API
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/promanufakt/backend
Environment="PATH=/var/www/promanufakt/backend/venv/bin"
ExecStart=/var/www/promanufakt/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

### Servisleri Etkinleştirme
```bash
systemctl daemon-reload
systemctl enable promanufakt-backend
systemctl start promanufakt-backend
```

---

## 7️⃣ Nginx Yapılandırması

### Site Konfigürasyonu
```bash
cat > /etc/nginx/sites-available/promanufakt << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React build)
    root /var/www/promanufakt/frontend/build;
    index index.html;

    # Frontend routes
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Dosya yükleme limiti
        client_max_body_size 50M;
    }

    # Yüklenen dosyalar
    location /uploads {
        alias /var/www/promanufakt/backend/uploads;
    }
}
EOF

# Site'ı etkinleştir
ln -sf /etc/nginx/sites-available/promanufakt /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx'i test et ve yeniden başlat
nginx -t && systemctl restart nginx
```

---

## 8️⃣ SSL Sertifikası (Let's Encrypt)

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 9️⃣ Güvenlik Duvarı (UFW)

```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

---

## 🔟 Yedekleme

### PostgreSQL Otomatik Yedekleme
```bash
# Yedekleme scripti
cat > /usr/local/bin/backup-promanufakt.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/promanufakt"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# PostgreSQL yedekle
pg_dump -U promanufakt_user promanufakt_db > "$BACKUP_DIR/db_$DATE.sql"

# Yüklenen dosyaları yedekle
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /var/www/promanufakt/backend/uploads

# 7 günden eski yedekleri sil
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-promanufakt.sh

# Cron job ekle (her gün gece 3'te)
echo "0 3 * * * /usr/local/bin/backup-promanufakt.sh >> /var/log/promanufakt-backup.log 2>&1" | crontab -
```

---

## 📊 Durum Kontrolü

```bash
# Servis durumları
systemctl status postgresql
systemctl status promanufakt-backend
systemctl status nginx

# Loglar
journalctl -u promanufakt-backend -f
tail -f /var/log/nginx/error.log

# PostgreSQL bağlantı testi
psql -U promanufakt_user -d promanufakt_db -c "SELECT 1;"
```

---

## ⚠️ Önemli Notlar

1. **Şifreleri Değiştirin**: Tüm örnek şifreleri güçlü şifrelerle değiştirin.
2. **Domain Ayarlayın**: `yourdomain.com` yerine gerçek domain adınızı yazın.
3. **Firewall**: Sadece gerekli portları açık tutun.
4. **Yedekleme**: Düzenli yedekleme yapın ve test edin.
5. **MongoDB → PostgreSQL**: Mevcut kod MongoDB kullanıyor, PostgreSQL'e geçiş için kod değişikliği gerekli.

---

## 🆘 Sorun Giderme

### Backend başlamıyor
```bash
journalctl -u promanufakt-backend -n 50
```

### PostgreSQL bağlantı hatası
```bash
# Kullanıcı ve veritabanını kontrol et
sudo -u postgres psql -c "\du"
sudo -u postgres psql -c "\l"
```

### Nginx 502 hatası
```bash
# Backend çalışıyor mu?
curl http://localhost:8001/api/health

# Nginx yapılandırmasını kontrol et
nginx -t
```

---

**Hazırlayan**: ProManufakt Geliştirme Ekibi  
**Tarih**: Aralık 2025
