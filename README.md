# ESG Checker (GRI 14)

Web app untuk menilai disclosure sustainability emiten pertambangan Indonesia berbasis **GRI 14: Mining Sector 2024**, dengan skor per topik, checklist, insight (strengths, weaknesses, overall assessment, future interpretation), dan profil perusahaan.

## Tech stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma 7
- Data scoring: Google Sheet publik (sync script)
- Profil emiten: cache DB + sync IDX (fallback seed)

## Quick start (local)

### 1. Prerequisites

- Node.js 20+
- Docker Desktop (untuk PostgreSQL lokal)

### 2. Install

```bash
npm install
cp .env.example .env
```

### 3. Database

**Opsi A - Docker** (jika Docker Desktop terpasang):

```bash
npm run db:up
npm run db:push
```

**Opsi B - Prisma Dev** (tanpa Docker):

```bash
npx prisma dev -d
```

Salin `DATABASE_URL` yang ditampilkan ke `.env`, lalu:

```bash
npm run db:push
npm run db:seed
npm run sync:all
```

`sync:all` menarik skor dari [Google Sheet](https://docs.google.com/spreadsheets/d/1ev1efBxnUBTbxZwgPwUgTm2MsuYXUNo5dVvaiogJS7I/edit) dan memperbarui profil emiten.

### 4. Development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run db:up` | Start Postgres (Docker) |
| `npm run db:push` | Apply Prisma schema |
| `npm run db:seed` | Seed GRI topics + fallback profiles |
| `npm run sync:sheet` | Import scores from Google Sheet |
| `npm run sync:idx` | Refresh company profiles (IDX/fallback) |
| `npm run sync:all` | Sheet + IDX sync |

## Menambah emiten baru

1. Tambahkan blok di Google Sheet: baris header `,TICKER,,,,,,` lalu 25 baris topik GRI 14 (format sama dengan MDKA/ANTM).
2. Jalankan `npm run sync:sheet`.
3. Opsional: `npm run sync:idx` untuk profil.

## Deploy (Vercel + Neon)

1. Buat database PostgreSQL di [Neon](https://neon.tech) atau Supabase.
2. Set environment variables di Vercel:
   - `DATABASE_URL` - connection string Postgres
   - `GOOGLE_SHEET_ID` - default sudah di `.env.example`
3. Deploy repo ke Vercel.
4. Setelah deploy pertama, jalankan migrasi dan sync (dari mesin lokal atau CI):

```bash
npx prisma db push
npm run sync:all
```

Atau gunakan Vercel Postgres integration + `postinstall` (`prisma generate`).

## API

- `GET /api/companies` - daftar emiten + skor agregat
- `GET /api/companies/[ticker]?locale=id|en` - detail lengkap
- `GET /api/companies/[ticker]/insights?locale=id|en`
- `GET /api/companies/[ticker]/profile`
- `GET /api/compare?tickers=MDKA,ANTM&locale=id`

## Disclaimer

Informasi di situs ini **bukan saran investasi**. Penilaian berdasarkan disclosure publik dan metodologi internal GRI 14.
