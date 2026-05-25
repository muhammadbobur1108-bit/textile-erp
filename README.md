# 🧵 Textile ERP — Birlashtirilgan Tizim

Ikki loyiha bitta tizimga birlashtirildi:
- **Chust Textile ERP** (login, xodimlar, KPI, davomat...)
- **Textile System** (nastil, razdacha, buyurtma hisoboti...)

---

## 🗂️ Tizim tuzilmasi

```
/dashboard
├── Nastil & Razdacha
│   ├── /nastil        ← Nastil hisoboti (28k+ qator)
│   ├── /buyurtma      ← Buyurtmalar jadvali
│   ├── /razdacha      ← Razdacha/vozvrat
│   ├── /metochilar    ← Metochilar hisobi
│   └── /hisobot       ← Grafiklar va tahlil
│
└── ERP Modullari
    ├── /orders        ← Buyurtmalar (ERP)
    ├── /staff         ← Xodimlar
    ├── /attendance    ← Davomat
    ├── /kpi           ← KPI & Ustalar
    ├── /quality       ← OTK Nazorat
    ├── /warehouse     ← Ombor
    ├── /tasks         ← Shogird vazifalari
    ├── /matrix        ← Size Matrix
    ├── /qr            ← QR Generator
    ├── /disputes      ← Nizolar
    ├── /reports       ← Hisobotlar
    ├── /import        ← Excel import
    └── /settings      ← Sozlamalar
```

---

## 🚀 O'rnatish

### 1. Supabase (Auth + ERP database)
1. https://supabase.com → New Project → "textile-erp"
2. SQL Editor → scripts/chust_schema.sql ni ishga tushiring
3. Authentication → Settings → Email confirmations → **OFF**
4. Authentication → Users → Admin user qo'shing
5. Settings → API → URL va anon key ni saqlang

### 2. Neon (Nastil/Razdacha database)
1. https://neon.tech → New Project → "textile-nastil"
2. Connection string ni saqlang

### 3. GitHub
1. Yangi repo yarating: `textile-erp`
2. Fayllarni yuklang (ZIP ichidagi barcha fayllar)

### 4. Vercel Deploy
1. vercel.com → New Project → GitHub repo ni tanlang
2. Environment Variables qo'shing:
```
NEXT_PUBLIC_SUPABASE_URL     = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbG...
DATABASE_URL                 = postgresql://...neon.tech/...
```
3. Deploy bosing!

### 5. Nastil ma'lumotlarini import qilish
Deploy bo'lgandan keyin:
- `/dashboard/import` sahifasiga kiring
- Excel faylni yuklang → avtomatik import bo'ladi

---

## 👥 Foydalanuvchilar (Supabase da yarating)

```
bobirjon@chusttextile.uz  → Superadmin
aziz.admin@chusttextile.uz → Admin
```

---

## ⚠️ Eslatmalar

- `.env.local` faylini **hech qachon** GitHub ga yuklamang
- Supabase database parolini xavfsiz saqlang
- Nastil ma'lumotlari Neon da, ERP ma'lumotlari Supabase da saqlanadi
