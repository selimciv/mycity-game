const { Pool } = require('pg');

// 1. Veritabanı bağlantı ayarları
const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL || `postgresql://db_user:db_password@localhost:5432/mycity_db`;

const pool = new Pool({
    connectionString: connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

// 2. Modül dışa aktarımı
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool: pool,
    testDbConnection: async () => {
        try {
            console.log('Veritabanı bağlantısı testi yapılıyor...');
            const res = await pool.query('SELECT NOW()');
            console.log('Veritabanı Bağlantısı BAŞARILI:', res.rows[0]);
            return true;
        } catch (err) {
            console.error('Veritabanı Bağlantı HATASI:', err.message);
            // Hata olsa bile sunucuyu durdurmuyoruz, sadece logluyoruz (geliştirme aşaması için)
            return false;
        }
    }
};
