# ProManufakt - İmalat Planlama ve Tedarik Zinciri Yönetim Sistemi

## Original Problem Statement
İmalat şirketlerinin üretim planlama ve tedarik zinciri süreçlerini yöneten profesyonel bir web uygulaması. 
- Proje yönetimi
- Malzeme planlaması
- Tedarikçi yönetimi ve performans skorlama
- Gantt chart ile zaman planlama
- Teklif alma/karşılaştırma
- Sipariş takibi
- Maliyet analizi

## User Personas
1. **Satın Alma Yöneticisi**: Tedarikçi seçimi, teklif karşılaştırma, sipariş oluşturma
2. **Üretim Planlama Mühendisi**: Proje planlama, parça tanımlama, imalat yöntemi seçimi
3. **Genel Müdür/İş Sahibi**: Dashboard görüntüleme, raporlar, maliyet analizi

## Core Requirements (Static)
- ✅ Türkçe arayüz
- ✅ Kimlik doğrulama yok
- ✅ Manuel döviz kuru girişi (TCMB API yok)
- ✅ E-posta bildirimleri (Resend entegrasyonu hazır, API key gerekli)
- ✅ Açık tema (Light theme)
- ✅ FastAPI + React + MongoDB stack

## What's Been Implemented (27 Aralık 2025)

### Backend (FastAPI)
- ✅ Proje CRUD API'ları (/api/projects)
- ✅ Parça CRUD API'ları (/api/parts) - malzeme, form tipi, imalat yöntemleri
- ✅ Tedarikçi CRUD API'ları (/api/suppliers) - performans skorlama sistemi
- ✅ Teklif sistemi (/api/quote-requests, /api/quote-responses, /api/quote-comparison)
- ✅ Sipariş sistemi (/api/orders)
- ✅ Bildirimler (/api/notifications)
- ✅ Döviz kurları - manuel güncelleme (/api/currency-rates)
- ✅ Ayarlar (/api/settings)
- ✅ Dashboard istatistikleri (/api/dashboard/stats)
- ✅ Gantt chart verileri (/api/dashboard/gantt/{project_id})
- ✅ Statik veriler (malzemeler, form tipleri, imalat yöntemleri)
- ✅ **Excel Import/Export** (/api/export/template, /api/export/parts/{id}, /api/import/parts/{id})
- ✅ **Teklif E-posta Sistemi** (/api/send-quote-emails, /api/quote-form/{id}, /api/quote-form/submit)

### Frontend (React)
- ✅ Dashboard sayfası - istatistikler, son projeler, yaklaşan terminler
- ✅ Projeler listesi - filtreleme, arama, oluşturma
- ✅ Proje detay - parça ekleme, **Excel import/export butonları**
- ✅ **Gelişmiş Gantt Chart** - zoom, scroll, tooltip, kategori renkleri
- ✅ Tedarikçiler - performans skorları, uzmanlık alanları
- ✅ Teklifler - teklif talebi oluşturma, karşılaştırma, **E-posta Gönder butonu**
- ✅ **Tedarikçi Teklif Formu** (/quote-form/:id) - public sayfa, form linki ile erişim
- ✅ Siparişler - liste, durum güncelleme
- ✅ Bildirimler - okundu işaretleme
- ✅ Ayarlar - şirket bilgileri, döviz kurları, Contabo kurulum kılavuzu

### Veritabanı Koleksiyonları (MongoDB)
- projects, parts, suppliers, quote_requests, quote_responses, orders, notifications, currency_rates, settings

### Sabit Veriler
- 14 ham malzeme tipi (Alüminyum, Çelik, Paslanmaz grupları)
- 3 form tipi (Prizmatik, Silindirik, Boru)
- 40+ imalat yöntemi (1001-9008 kodları)

## Prioritized Backlog

### P0 (Critical - Implemented ✅)
- ✅ Excel import/export fonksiyonu
- ⏳ E-posta gönderimi için Resend API key entegrasyonu (kod hazır, key gerekli)

### P1 (High Priority)
- ✅ Tedarikçiye otomatik teklif e-postası gönderme (form linki ile)
- ✅ Gelişmiş Gantt chart (interaktif, zoom, scroll)
- Maliyet analizi raporları
- Parça teknik resim yükleme

### P2 (Medium Priority)
- Tedarikçi performans trend analizi
- Proje bütçe takibi ve aşım uyarıları
- Haftalık/günlük e-posta özetleri

### P3 (Low Priority)
- Mobil responsive tasarım
- PDF rapor çıktıları
- Kullanıcı yetki sistemi (admin/user)
- Audit log (değişiklik geçmişi)

## Next Tasks
1. Resend API key alınıp .env'e eklenmeli (RESEND_API_KEY, SENDER_EMAIL)
2. Maliyet analizi rapor sayfası
3. Parça teknik resim yükleme (file upload)

## Architecture
```
/app
├── backend/
│   ├── server.py      # FastAPI routes + MongoDB
│   ├── data.py        # Static data (materials, methods)
│   ├── .env           # MONGO_URL, DB_NAME, RESEND_API_KEY
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   └── GanttChart.jsx  # Interactive Gantt
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── ProjectDetailPage.jsx  # Excel import/export
│   │   │   ├── SuppliersPage.jsx
│   │   │   ├── QuotesPage.jsx         # Email sending
│   │   │   ├── QuoteFormPage.jsx      # Public supplier form
│   │   │   ├── OrdersPage.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   └── lib/
│   │       ├── api.js
│   │       └── utils.js
│   └── .env           # REACT_APP_BACKEND_URL
└── memory/
    └── PRD.md
```

## Contabo Deployment Notes
Ayarlar sayfasında detaylı kurulum kılavuzu mevcut:
- MongoDB 6.0 kurulumu
- Backend (uvicorn) kurulumu
- Frontend (yarn build) kurulumu
- Nginx reverse proxy konfigürasyonu
