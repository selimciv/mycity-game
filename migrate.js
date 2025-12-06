const db = require('./db');

async function migrate() {
    try {
        console.log('Migrating database...');

        // Add new columns
        await db.query('ALTER TABLE emlak ADD COLUMN IF NOT EXISTS mapbox_id VARCHAR(255) UNIQUE;');
        await db.query('ALTER TABLE emlak ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;');
        await db.query('ALTER TABLE emlak ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION;');
        await db.query('ALTER TABLE emlak ADD COLUMN IF NOT EXISTS fiyat INTEGER DEFAULT 10;');

        // Modify existing columns
        await db.query('ALTER TABLE emlak ALTER COLUMN x SET DEFAULT 0;');
        await db.query('ALTER TABLE emlak ALTER COLUMN y SET DEFAULT 0;');

        // Drop NOT NULL constraints if they exist (Postgres doesn't support IF EXISTS for constraints easily in ALTER COLUMN, 
        // but dropping NOT NULL is safe even if it's already nullable usually, or we catch error)
        try { await db.query('ALTER TABLE emlak ALTER COLUMN x DROP NOT NULL;'); } catch (e) { console.log('x constraint update info:', e.message); }
        try { await db.query('ALTER TABLE emlak ALTER COLUMN y DROP NOT NULL;'); } catch (e) { console.log('y constraint update info:', e.message); }

        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
