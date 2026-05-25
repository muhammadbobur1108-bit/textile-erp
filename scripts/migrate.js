// scripts/migrate.js
// Run: node scripts/migrate.js
// Bu script barcha jadvallarni PostgreSQL (Neon) da yaratadi

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('🚀 Jadvallar yaratilmoqda...');

  // 1. NASTIL jadvali (Отчет по настилу)
  await sql`
    CREATE TABLE IF NOT EXISTS nastil (
      id SERIAL PRIMARY KEY,
      buyurtma VARCHAR(100),
      model VARCHAR(200),
      rang VARCHAR(100),
      be_kod VARCHAR(300),
      sana DATE,
      nastil_no INTEGER,
      rost VARCHAR(50),
      razmer VARCHAR(50),
      unik_kod VARCHAR(500),
      kroy_kilindi INTEGER DEFAULT 0,
      metochi VARCHAR(100),
      meto_kilindi INTEGER DEFAULT 0,
      patoka_berildi INTEGER DEFAULT 0,
      razdacha INTEGER DEFAULT 0,
      meto INTEGER DEFAULT 0,
      razdacha_koldi INTEGER DEFAULT 0,
      ombor_qoldiq INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('✅ nastil jadvali yaratildi');

  // 2. BUYURTMA jadvali (Отчет по заказу)
  await sql`
    CREATE TABLE IF NOT EXISTS buyurtma (
      id SERIAL PRIMARY KEY,
      buyurtma VARCHAR(100),
      model VARCHAR(200),
      rang VARCHAR(100),
      unik_kod2 VARCHAR(300),
      buyurtmachi VARCHAR(100),
      rost VARCHAR(50),
      razmer VARCHAR(50),
      unik_kod VARCHAR(500),
      buyurtma_son INTEGER DEFAULT 0,
      kroy_kilindi INTEGER DEFAULT 0,
      meto_kilindi INTEGER DEFAULT 0,
      patoka_berildi INTEGER DEFAULT 0,
      razdacha_1 INTEGER DEFAULT 0,
      razdacha_2 INTEGER DEFAULT 0,
      brak_vozvrat INTEGER DEFAULT 0,
      kesim_brak INTEGER DEFAULT 0,
      umumi_qoldi INTEGER DEFAULT 0,
      potok_orkasi INTEGER DEFAULT 0,
      kesim_qoldi INTEGER DEFAULT 0,
      meto_qoldi INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('✅ buyurtma jadvali yaratildi');

  // 3. METOCHILAR jadvali
  await sql`
    CREATE TABLE IF NOT EXISTS metochilar (
      id SERIAL PRIMARY KEY,
      sana DATE,
      buyurtma VARCHAR(100),
      model VARCHAR(200),
      rang VARCHAR(100),
      nastil_no VARCHAR(50),
      rost VARCHAR(50),
      razmer VARCHAR(50),
      tekshirish VARCHAR(50),
      unik_kod VARCHAR(500),
      son INTEGER DEFAULT 0,
      brak INTEGER DEFAULT 0,
      meto_kiligan_son INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('✅ metochilar jadvali yaratildi');

  // 4. RAZDACHA jadvali
  await sql`
    CREATE TABLE IF NOT EXISTS razdacha (
      id SERIAL PRIMARY KEY,
      sana DATE,
      buyurtma VARCHAR(100),
      model VARCHAR(200),
      rang VARCHAR(100),
      nastil_no VARCHAR(50),
      rost VARCHAR(50),
      razmer VARCHAR(50),
      tekshirish VARCHAR(50),
      unik_kod VARCHAR(500),
      sort INTEGER DEFAULT 1,
      potok VARCHAR(100),
      razdacha_son INTEGER DEFAULT 0,
      brak_vozvrat INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('✅ razdacha jadvali yaratildi');

  // 5. Indexlar (tezlik uchun)
  await sql`CREATE INDEX IF NOT EXISTS idx_nastil_buyurtma ON nastil(buyurtma)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_nastil_sana ON nastil(sana)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_nastil_rang ON nastil(rang)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_buyurtma_buyurtma ON buyurtma(buyurtma)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_razdacha_sana ON razdacha(sana)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_metochilar_sana ON metochilar(sana)`;

  console.log('✅ Indexlar yaratildi');
  console.log('🎉 Migratsiya muvaffaqiyatli tugadi!');
}

migrate().catch(err => {
  console.error('❌ Xato:', err);
  process.exit(1);
});
