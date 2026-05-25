// scripts/import-excel.js
// Run: node scripts/import-excel.js ./your-file.xlsm
// Bu script Excel fayldan barcha ma'lumotlarni PostgreSQL ga import qiladi

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const XLSX = require('xlsx');
const path = require('path');

const sql = neon(process.env.DATABASE_URL);
const filePath = process.argv[2] || './data.xlsm';

function excelDateToJS(serial) {
  if (!serial || isNaN(serial)) return null;
  const date = new Date((serial - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

function safeInt(val) {
  const n = parseInt(val);
  return isNaN(n) ? 0 : n;
}

function safeStr(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

async function importNastil(wb) {
  console.log('\n📋 Nastil importi boshlandi...');
  const ws = wb.Sheets['Отчет по настилу'];
  if (!ws) { console.log('❌ Sheet topilmadi'); return; }

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  // Header 2-qatorda (index 1)
  let imported = 0;
  const batchSize = 500;
  let batch = [];

  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r[2]) continue; // buyurtma bo'lmasa o'tkazib yubor

    batch.push({
      buyurtma: safeStr(r[2]),
      model: safeStr(r[3]),
      rang: safeStr(r[4]),
      be_kod: safeStr(r[5]),
      sana: excelDateToJS(r[6]),
      nastil_no: safeInt(r[7]),
      rost: safeStr(r[8]),
      razmer: safeStr(r[9]),
      unik_kod: safeStr(r[10]),
      kroy_kilindi: safeInt(r[11]),
      metochi: safeStr(r[12]),
      meto_kilindi: safeInt(r[13]),
      patoka_berildi: safeInt(r[14]),
      razdacha: safeInt(r[15]),
      meto: safeInt(r[16]),
      razdacha_koldi: safeInt(r[17]),
      ombor_qoldiq: safeInt(r[18]),
    });

    if (batch.length >= batchSize) {
      await insertNastilBatch(batch);
      imported += batch.length;
      console.log(`  ${imported} qator import qilindi...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertNastilBatch(batch);
    imported += batch.length;
  }

  console.log(`✅ Nastil: ${imported} qator import qilindi`);
}

async function insertNastilBatch(rows) {
  for (const r of rows) {
    await sql`
      INSERT INTO nastil (buyurtma, model, rang, be_kod, sana, nastil_no, rost, razmer, unik_kod,
        kroy_kilindi, metochi, meto_kilindi, patoka_berildi, razdacha, meto, razdacha_koldi, ombor_qoldiq)
      VALUES (${r.buyurtma}, ${r.model}, ${r.rang}, ${r.be_kod}, ${r.sana}, ${r.nastil_no},
        ${r.rost}, ${r.razmer}, ${r.unik_kod}, ${r.kroy_kilindi}, ${r.metochi}, ${r.meto_kilindi},
        ${r.patoka_berildi}, ${r.razdacha}, ${r.meto}, ${r.razdacha_koldi}, ${r.ombor_qoldiq})
    `;
  }
}

async function importBuyurtma(wb) {
  console.log('\n📦 Buyurtma importi boshlandi...');
  const ws = wb.Sheets['Отчет по заказу'];
  if (!ws) { console.log('❌ Sheet topilmadi'); return; }

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  let imported = 0;

  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r[1]) continue;

    await sql`
      INSERT INTO buyurtma (buyurtma, model, rang, unik_kod2, buyurtmachi, rost, razmer, unik_kod,
        buyurtma_son, kroy_kilindi, meto_kilindi, patoka_berildi, razdacha_1, razdacha_2,
        brak_vozvrat, kesim_brak, umumi_qoldi, potok_orkasi, kesim_qoldi, meto_qoldi)
      VALUES (${safeStr(r[1])}, ${safeStr(r[2])}, ${safeStr(r[3])}, ${safeStr(r[4])},
        ${safeStr(r[5])}, ${safeStr(r[6])}, ${safeStr(r[7])}, ${safeStr(r[8])},
        ${safeInt(r[9])}, ${safeInt(r[10])}, ${safeInt(r[11])}, ${safeInt(r[12])},
        ${safeInt(r[13])}, ${safeInt(r[14])}, ${safeInt(r[15])}, ${safeInt(r[16])},
        ${safeInt(r[17])}, ${safeInt(r[18])}, ${safeInt(r[19])}, ${safeInt(r[20])})
    `;
    imported++;
    if (imported % 500 === 0) console.log(`  ${imported} qator...`);
  }
  console.log(`✅ Buyurtma: ${imported} qator import qilindi`);
}

async function importMetochilar(wb) {
  console.log('\n🧵 Metochilar importi boshlandi...');
  const ws = wb.Sheets['меточила'];
  if (!ws) { console.log('❌ Sheet topilmadi'); return; }

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  let imported = 0;

  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r[2]) continue;

    await sql`
      INSERT INTO metochilar (sana, buyurtma, model, rang, nastil_no, rost, razmer, tekshirish, unik_kod, son, brak, meto_kiligan_son)
      VALUES (${excelDateToJS(r[1])}, ${safeStr(r[2])}, ${safeStr(r[3])}, ${safeStr(r[4])},
        ${safeStr(r[5])}, ${safeStr(r[6])}, ${safeStr(r[7])}, ${safeStr(r[8])}, ${safeStr(r[9])},
        ${safeInt(r[10])}, ${safeInt(r[11])}, ${safeInt(r[14])})
    `;
    imported++;
  }
  console.log(`✅ Metochilar: ${imported} qator import qilindi`);
}

async function importRazdacha(wb) {
  console.log('\n🎁 Razdacha importi boshlandi...');
  const ws = wb.Sheets['Раздача-Возврат'];
  if (!ws) { console.log('❌ Sheet topilmadi'); return; }

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  let imported = 0;

  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r[2]) continue;

    await sql`
      INSERT INTO razdacha (sana, buyurtma, model, rang, nastil_no, rost, razmer, tekshirish, unik_kod, sort, potok, razdacha_son, brak_vozvrat)
      VALUES (${excelDateToJS(r[1])}, ${safeStr(r[2])}, ${safeStr(r[3])}, ${safeStr(r[4])},
        ${safeStr(r[5])}, ${safeStr(r[6])}, ${safeStr(r[7])}, ${safeStr(r[8])}, ${safeStr(r[9])},
        ${safeInt(r[11])}, ${safeStr(r[12])}, ${safeInt(r[15])}, ${safeInt(r[16])})
    `;
    imported++;
  }
  console.log(`✅ Razdacha: ${imported} qator import qilindi`);
}

async function main() {
  console.log(`📂 Fayl o'qilmoqda: ${filePath}`);
  const wb = XLSX.readFile(filePath);
  console.log(`📊 Sheetlar: ${wb.SheetNames.join(', ')}`);

  // Avval eski ma'lumotlarni o'chirish (ixtiyoriy)
  const args = process.argv;
  if (args.includes('--clear')) {
    console.log('\n🗑️  Eski ma\'lumotlar o\'chirilmoqda...');
    await sql`TRUNCATE TABLE nastil, buyurtma, metochilar, razdacha RESTART IDENTITY`;
    console.log('✅ O\'chirildi');
  }

  await importNastil(wb);
  await importBuyurtma(wb);
  await importMetochilar(wb);
  await importRazdacha(wb);

  console.log('\n🎉 Barcha ma\'lumotlar import qilindi!');
}

main().catch(err => {
  console.error('❌ Xato:', err);
  process.exit(1);
});
