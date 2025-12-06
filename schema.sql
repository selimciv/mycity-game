-- Veritabanı Şeması Oluşturma Komutları

-- 1. Oyuncular Tablosu (Giriş ve Güvenlik)
CREATE TABLE IF NOT EXISTS oyuncular (
    id SERIAL PRIMARY KEY,
    eposta VARCHAR(255) UNIQUE NOT NULL,
    sifre_hash VARCHAR(255) NOT NULL,
    olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Karakterler Tablosu (Oyun İçi Veriler)
CREATE TABLE IF NOT EXISTS karakterler (
    id SERIAL PRIMARY KEY,
    oyuncu_id INTEGER REFERENCES oyuncular(id) ON DELETE CASCADE,
    karakter_adi VARCHAR(50) UNIQUE NOT NULL,
    mevcut_x DOUBLE PRECISION DEFAULT 400.0,
    mevcut_y DOUBLE PRECISION DEFAULT 300.0,
    oyun_parasi INTEGER DEFAULT 0,
    deneyim_puani INTEGER DEFAULT 0,
    beceri_agaci JSONB DEFAULT '{}'::jsonb
);

-- 3. Emlak Tablosu (Mülkler ve Konumlar)
CREATE TABLE IF NOT EXISTS emlak (
    id SERIAL PRIMARY KEY,
    ad VARCHAR(100) NOT NULL,
    sahip_karakter_id INTEGER REFERENCES karakterler(id) ON DELETE SET NULL,
    mapbox_id VARCHAR(255) UNIQUE, -- Mapbox bina ID'si
    lat DOUBLE PRECISION, -- Binanın enlem koordinatı
    lon DOUBLE PRECISION, -- Binanın boylam koordinatı
    fiyat INTEGER DEFAULT 10, -- Binanın değeri (Şimdilik varsayılan 10)
    -- Geriye dönük uyumluluk için x/y tutuyoruz ama harita dışı binalar için
    x DOUBLE PRECISION DEFAULT 0,
    y DOUBLE PRECISION DEFAULT 0,
    kira_geliri INTEGER DEFAULT 0
);
