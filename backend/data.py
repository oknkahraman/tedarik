# ProManufakt - Sabit Veriler (Static Data)
# İmalat Yöntemleri, Malzeme Tipleri, Form Tipleri

# HAM MALZEME TİPLERİ
MATERIALS = {
    # Alüminyum Grubu
    "AL5754": {"name": "AL5754", "group": "Alüminyum", "description": "Deniz kalitesi, kaynak kabiliyeti yüksek"},
    "AL7075": {"name": "AL7075", "group": "Alüminyum", "description": "Yüksek mukavemet, havacılık"},
    "AL6061": {"name": "AL6061", "group": "Alüminyum", "description": "Genel amaçlı, orta mukavemet"},
    "AL1050": {"name": "AL1050", "group": "Alüminyum", "description": "Yüksek işlenebilirlik, düşük mukavemet"},
    
    # Çelik Grubu
    "S700MC": {"name": "S700MC", "group": "Çelik", "description": "Yüksek mukavemet, soğuk şekillendirme"},
    "S690QL": {"name": "S690QL", "group": "Çelik", "description": "Temperlenmiş, yüksek tokluk"},
    "S355": {"name": "S355", "group": "Çelik", "description": "Yapısal çelik, genel amaçlı"},
    "S235": {"name": "S235", "group": "Çelik", "description": "Yumuşak çelik, kaynak uygun"},
    "HARDOX450": {"name": "HARDOX 450", "group": "Çelik", "description": "Aşınma direnci, sert"},
    "WELDOX": {"name": "WELDOX", "group": "Çelik", "description": "Yüksek mukavemet, kaynak uygun"},
    
    # Paslanmaz Çelik
    "AISI304": {"name": "AISI 304", "group": "Paslanmaz Çelik", "description": "18/8, genel amaçlı, manyetik değil"},
    "AISI316L": {"name": "AISI 316L", "group": "Paslanmaz Çelik", "description": "Asit direnci, deniz ortamı"},
    "AISI301": {"name": "AISI 301", "group": "Paslanmaz Çelik", "description": "Yaylık özellik, yüksek elastikiyet"},
    "AISI303": {"name": "AISI 303", "group": "Paslanmaz Çelik", "description": "Otomat çeliği, talaşlı işleme uygun"},
}

# FORM TİPLERİ
FORM_TYPES = {
    "prizmatik": {
        "name": "Prizmatik",
        "description": "Kare/Dikdörtgen Kesitli",
        "dimensions": ["width", "height", "length"],
        "dimension_labels": {"width": "Genişlik (mm)", "height": "Yükseklik (mm)", "length": "Uzunluk (mm)"}
    },
    "silindirik": {
        "name": "Silindirik Dolu",
        "description": "Yuvarlak Çubuk",
        "dimensions": ["diameter", "length"],
        "dimension_labels": {"diameter": "Çap (Ø mm)", "length": "Uzunluk (mm)"}
    },
    "boru": {
        "name": "Boru",
        "description": "İçi Boş Silindir",
        "dimensions": ["outer_diameter", "inner_diameter", "length"],
        "dimension_labels": {"outer_diameter": "Dış Çap (Ø mm)", "inner_diameter": "İç Çap (Ø mm)", "length": "Uzunluk (mm)"}
    }
}

# İMALAT YÖNTEMLERİ
MANUFACTURING_METHODS = {
    # Metal Şekillendirme (1000-1999)
    "1001": {"code": "1001", "name": "Lazer Kesim", "category": "Metal Şekillendirme", "description": "Hassas kesim, karmaşık geometri", "duration_days": 2},
    "1002": {"code": "1002", "name": "Abkant Büküm", "category": "Metal Şekillendirme", "description": "Sac büküm, köşe oluşturma", "duration_days": 1},
    "1003": {"code": "1003", "name": "Punch", "category": "Metal Şekillendirme", "description": "Delme/Şekillendirme", "duration_days": 1},
    "1004": {"code": "1004", "name": "Plazma Kesim", "category": "Metal Şekillendirme", "description": "Kalın sac kesim", "duration_days": 2},
    "1005": {"code": "1005", "name": "Su Jeti", "category": "Metal Şekillendirme", "description": "Yanma/ısı hasarı istenmeyen kesimler", "duration_days": 3},
    "1006": {"code": "1006", "name": "Giyotin", "category": "Metal Şekillendirme", "description": "Düz kesim, levha kesme", "duration_days": 1},
    "1007": {"code": "1007", "name": "Silindir Büküm", "category": "Metal Şekillendirme", "description": "Boru, silindir şekil verme", "duration_days": 2},
    "1008": {"code": "1008", "name": "Kordon", "category": "Metal Şekillendirme", "description": "Mukavemet artırıcı nervürler", "duration_days": 1},
    "1009": {"code": "1009", "name": "Sıvama", "category": "Metal Şekillendirme", "description": "Presle şekillendirme", "duration_days": 3},
    
    # Kaynak (2000-2999)
    "2001": {"code": "2001", "name": "MIG/MAG Kaynak", "category": "Kaynak", "description": "Hızlı, genel amaçlı kaynak", "duration_days": 2},
    "2002": {"code": "2002", "name": "TIG Kaynak", "category": "Kaynak", "description": "Hassas, kaliteli kaynak", "duration_days": 3},
    "2003": {"code": "2003", "name": "Elektrik Ark Kaynak", "category": "Kaynak", "description": "Saha kaynağı, kalın malzeme", "duration_days": 2},
    "2004": {"code": "2004", "name": "Punta Kaynak", "category": "Kaynak", "description": "Sac birleştirme, hızlı", "duration_days": 1},
    "2005": {"code": "2005", "name": "Robotik Kaynak", "category": "Kaynak", "description": "Seri üretim, yüksek tutarlılık", "duration_days": 2},
    "2006": {"code": "2006", "name": "Saplama Kaynağı", "category": "Kaynak", "description": "Cıvata/pim kaynatma", "duration_days": 1},
    
    # Talaşlı İmalat (3000-3999)
    "3001": {"code": "3001", "name": "CNC Torna", "category": "Talaşlı İmalat", "description": "Silindirik parçalar, vida/diş açma", "duration_days": 3},
    "3002": {"code": "3002", "name": "CNC Dik İşlem (3 Eksen)", "category": "Talaşlı İmalat", "description": "Düzlemsel işleme, delik, cep", "duration_days": 3},
    "3003": {"code": "3003", "name": "CNC Dik İşlem (4-5 Eksen)", "category": "Talaşlı İmalat", "description": "Karmaşık 3B geometri, kalıp", "duration_days": 5},
    "3004": {"code": "3004", "name": "Üniversal Torna", "category": "Talaşlı İmalat", "description": "Prototip, küçük parti", "duration_days": 2},
    "3005": {"code": "3005", "name": "Kayar Otomat", "category": "Talaşlı İmalat", "description": "Seri üretim, çubuk malzeme", "duration_days": 2},
    "3006": {"code": "3006", "name": "Tel Erozyon", "category": "Talaşlı İmalat", "description": "Sertleşmiş malzeme, hassas kesim", "duration_days": 4},
    "3007": {"code": "3007", "name": "Dalma Erozyon", "category": "Talaşlı İmalat", "description": "Kalıp boşluğu, karmaşık şekil", "duration_days": 5},
    "3008": {"code": "3008", "name": "Taşlama", "category": "Talaşlı İmalat", "description": "Yüzey düzleme, hassas ölçü", "duration_days": 2},
    "3009": {"code": "3009", "name": "Honlama", "category": "Talaşlı İmalat", "description": "İç silindir hassas işleme", "duration_days": 2},
    "3010": {"code": "3010", "name": "Broşlama", "category": "Talaşlı İmalat", "description": "Kamalama, diş profili", "duration_days": 2},
    
    # 3D Baskı (4000-4999)
    "4001": {"code": "4001", "name": "FDM 3D Baskı", "category": "3D Baskı", "description": "Termoplastik, prototip", "duration_days": 2},
    "4002": {"code": "4002", "name": "SLA 3D Baskı", "category": "3D Baskı", "description": "Reçine, hassas prototipler", "duration_days": 3},
    "4003": {"code": "4003", "name": "SLS 3D Baskı", "category": "3D Baskı", "description": "Fonksiyonel plastik parçalar", "duration_days": 4},
    "4004": {"code": "4004", "name": "DMLS Metal 3D Baskı", "category": "3D Baskı", "description": "Metal parça baskı", "duration_days": 7},
    
    # Yüzey İşlemleri (5000-5999)
    "5001": {"code": "5001", "name": "Eloksal", "category": "Yüzey İşlemi", "description": "Alüminyum yüzey sertleştirme", "duration_days": 3},
    "5002": {"code": "5002", "name": "Galvaniz", "category": "Yüzey İşlemi", "description": "Çinko kaplama, korozyon koruması", "duration_days": 3},
    "5003": {"code": "5003", "name": "Statik Boya", "category": "Yüzey İşlemi", "description": "Elektrostatik kaplama", "duration_days": 3},
    "5004": {"code": "5004", "name": "Yaş Boya", "category": "Yüzey İşlemi", "description": "Fırın boya, yüksek kalite", "duration_days": 4},
    "5005": {"code": "5005", "name": "Kumlama", "category": "Yüzey İşlemi", "description": "Pas sökme, yüzey hazırlık", "duration_days": 1},
    "5006": {"code": "5006", "name": "Nitrasyon", "category": "Yüzey İşlemi", "description": "Çelik yüzey sertleştirme", "duration_days": 3},
    "5007": {"code": "5007", "name": "Sementasyon", "category": "Yüzey İşlemi", "description": "Dişli, mil sertleştirme", "duration_days": 4},
    "5008": {"code": "5008", "name": "İndüksiyon Sertleştirme", "category": "Yüzey İşlemi", "description": "Lokal yüzey sertleştirme", "duration_days": 2},
    "5009": {"code": "5009", "name": "Isıl İşlem", "category": "Yüzey İşlemi", "description": "Tavlama/Sertleştirme", "duration_days": 3},
    
    # Hazır Malzeme (9000-9999)
    "9001": {"code": "9001", "name": "Rulman", "category": "Hazır Malzeme", "description": "Rulman tedarik", "duration_days": 5},
    "9002": {"code": "9002", "name": "Hırdavat/Cıvata", "category": "Hazır Malzeme", "description": "Cıvata, somun, pul", "duration_days": 3},
    "9003": {"code": "9003", "name": "Elektrik Malzemesi", "category": "Hazır Malzeme", "description": "Kablo, sigorta, röle", "duration_days": 5},
    "9004": {"code": "9004", "name": "Motor/Redüktör", "category": "Hazır Malzeme", "description": "Elektrik motorları", "duration_days": 10},
    "9005": {"code": "9005", "name": "Hidrolik/Pnömatik", "category": "Hazır Malzeme", "description": "Valf, silindir, pompa", "duration_days": 7},
    "9006": {"code": "9006", "name": "Otomasyon", "category": "Hazır Malzeme", "description": "PLC, sensör, enkoder", "duration_days": 7},
    "9007": {"code": "9007", "name": "Çelik Ham Malzeme", "category": "Hazır Malzeme", "description": "Yarı mamul çelik tedarik", "duration_days": 7},
    "9008": {"code": "9008", "name": "Alüminyum/Paslanmaz Ham Malzeme", "category": "Hazır Malzeme", "description": "Yarı mamul alüminyum/paslanmaz", "duration_days": 7},
}

# Proje Durumları
PROJECT_STATUSES = {
    "planning": {"name": "Planlama", "color": "#3b82f6"},
    "in_progress": {"name": "Devam Ediyor", "color": "#f59e0b"},
    "completed": {"name": "Tamamlandı", "color": "#10b981"},
    "on_hold": {"name": "Beklemede", "color": "#6b7280"},
    "cancelled": {"name": "İptal", "color": "#ef4444"},
}

# Parça Durumları
PART_STATUSES = {
    "pending": {"name": "Bekliyor", "color": "#6b7280"},
    "in_production": {"name": "Üretimde", "color": "#3b82f6"},
    "quality_check": {"name": "Kalite Kontrol", "color": "#f59e0b"},
    "completed": {"name": "Tamamlandı", "color": "#10b981"},
    "rejected": {"name": "Reddedildi", "color": "#ef4444"},
}

# Sipariş Durumları
ORDER_STATUSES = {
    "pending": {"name": "Bekliyor", "color": "#6b7280"},
    "confirmed": {"name": "Onaylandı", "color": "#3b82f6"},
    "in_production": {"name": "Üretimde", "color": "#f59e0b"},
    "shipped": {"name": "Sevk Edildi", "color": "#8b5cf6"},
    "delivered": {"name": "Teslim Edildi", "color": "#10b981"},
    "cancelled": {"name": "İptal", "color": "#ef4444"},
}

# Teklif Durumları
QUOTE_STATUSES = {
    "requested": {"name": "Talep Edildi", "color": "#6b7280"},
    "received": {"name": "Alındı", "color": "#3b82f6"},
    "approved": {"name": "Onaylandı", "color": "#10b981"},
    "rejected": {"name": "Reddedildi", "color": "#ef4444"},
    "expired": {"name": "Süresi Doldu", "color": "#f59e0b"},
}

# Para Birimleri
CURRENCIES = {
    "TRY": {"code": "TRY", "name": "Türk Lirası", "symbol": "₺"},
    "USD": {"code": "USD", "name": "Amerikan Doları", "symbol": "$"},
    "EUR": {"code": "EUR", "name": "Euro", "symbol": "€"},
}
