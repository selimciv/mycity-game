const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
    try {
        console.log('Veritabanı migrasyonu başlatılıyor...');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('schema.sql okundu, çalıştırılıyor...');
        await db.query(sql);

        console.log('Tablolar başarıyla oluşturuldu/güncellendi.');
    } catch (err) {
        console.error('Migrasyon hatası:', err);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

migrate();
