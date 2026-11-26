# PORTAL REP (Pusat Operasional Rumah Terpadu Aplikasi Layanan REP)

<p align="center">
  <img src="public/images/rep-logo.jpg" alt="Logo Yayasan Rumah Etnik Papua" width="160" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  <strong>Portal Aplikasi Kerja & Agenda Bersama</strong><br>
  <strong>Yayasan Rumah Etnik Papua</strong><br>
  <em>Jalan Baru Aimas - Klamono Km. 21, Kabupaten Sorong, Papua Barat Daya</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?style=flat-square&logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/PWA-Ready-10B981?style=flat-square" alt="PWA" />
  <img src="https://github.com/rdwnelly/portal-rep/actions/workflows/ci.yml/badge.svg" alt="CI" />
  <img src="https://img.shields.io/badge/Author-Ridwan%20Elly-amber?style=flat-square" alt="Author" />
</p>

---

## 📖 1. Tujuan

**PORTAL REP** adalah portal kerja Yayasan Rumah Etnik Papua (Sorong, Papua Barat Daya): beranda informasi harian (jam WIT, ramalan cuaca, agenda, libur nasional), **kumpulan link aplikasi kerja**, dan **agenda bersama** dengan kalender. Setiap aplikasi dibuka di tab baru dan memakai login miliknya sendiri:

1. **Sistem Manajemen Reservasi** — homestay etnik & tiket wisata.
2. **SIK-REP** — sistem informasi keuangan.
3. **Aplikasi Kasir (POS)** — Yaswar Cafe & kios suvenir.
4. **Sistem Operasional Manajemen Gudang (OMG)** — inventaris suvenir.
5. **Zeey Studio** — dokumentasi media & aset budaya.

---

## 🌟 2. Fitur

- 🏠 **Beranda** — sapaan & jam WIT, ramalan cuaca Sorong 7 hari, agenda mendatang, dan libur nasional berikutnya. Daftar aplikasi sengaja tidak ditampilkan di sini.
- 🔗 **Halaman Aplikasi** (`/apps`) — kartu besar yang mudah diketuk di HP; satu ketukan membuka aplikasinya.
- 📅 **Agenda bersama** dengan **kalender bulanan** yang menandai **libur nasional** (merah) dan **cuti bersama** (jingga). **Siapa saja bisa menambah, mengubah, dan menghapus agenda tanpa login.**
- 🌦️ **Ramalan cuaca** dari [Open-Meteo](https://open-meteo.com) (tanpa kunci API), termasuk peluang hujan per hari.
- 🇮🇩 **Libur nasional** dari kalender publik Google (mengikuti SKB 3 Menteri), diambil lewat `GET /api/libur?year=YYYY` dan di-cache 1 hari. Bila sumber tak terjangkau, portal menulis "belum dapat dimuat" — tidak pernah mengarang tanggal libur.
- 🛠️ **Panel admin** — hanya untuk mengelola link aplikasi (tambah, ubah, hapus). Satu-satunya fitur yang butuh login.
- 🧩 **Tampilan kartu (bento) seragam** dengan tema terang & gelap (`components/ui/Bento.tsx`).
- 📲 **PWA** — bisa dipasang di HP; halaman yang pernah dibuka tetap tampil saat offline.

---

## 👥 3. Siapa bisa apa

| | Pengunjung (tanpa login) | Admin (`IT_ADMIN`) |
| :--- | :---: | :---: |
| Melihat & membuka aplikasi | ✅ | ✅ |
| Melihat agenda | ✅ | ✅ |
| Menambah / mengubah / menghapus agenda | ✅ | ✅ |
| Mengelola link aplikasi | — | ✅ |

> ⚠️ **Agenda terbuka untuk siapa saja**, termasuk orang luar yang tahu alamat portal. Security Rules hanya memastikan bentuk datanya benar (field yang diizinkan, panjang teks, format tanggal & jam) — tidak mencegah orang mengubah atau menghapus agenda. Bila suatu saat ini disalahgunakan, ubah aturan `match /events` di [`firestore.rules`](firestore.rules) agar hanya `isAdmin()` yang boleh menulis.

---

## 🚀 4. Menjalankan Proyek

### Prasyarat
- Node.js 20+
- Java 11+ (hanya untuk Firebase Emulator: `npm run emulators`, `npm run test:rules`, `npm run test:e2e`)

### Tiga mode berjalan

| Mode | Cara mengaktifkan | Data & login |
| :--- | :--- | :--- |
| **Demo** | `npm run dev` tanpa `.env.local` | Data contoh di localStorage browser. Login admin cukup dengan email dari whitelist contoh (`lib/seed-data.ts`), kata sandi apa pun. Hanya aktif di `next dev`. |
| **Emulator** | Terminal 1: `npm run emulators` · Terminal 2: `NEXT_PUBLIC_FIREBASE_EMULATOR=true npm run dev` | Firestore & Auth lokal (UI di http://127.0.0.1:4000), tanpa menyentuh data produksi. |
| **Produksi** | Isi `.env.local` / Environment Variables Vercel (bagian 5) | Firebase Auth + Firestore, izin ditegakkan Security Rules. |

```bash
npm install
npm run dev          # http://localhost:3008
```

---

## ⚙️ 5. Konfigurasi Firebase Produksi

### 5.1 Environment variables
Hanya variabel publik Firebase. Satu-satunya kode server adalah `/api/libur`, yang tidak butuh kredensial:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<project>.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```
Variabel lama `FIREBASE_SERVICE_ACCOUNT_JSON`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY`, dan `INTEGRATION_*` tidak dipakai lagi dan sebaiknya dihapus dari Vercel.

### 5.2 Penyiapan pertama kali (sekali saja)
1. **Authentication → Sign-in method:** aktifkan **Email/Password**.
2. **Firestore Database:** buat database (mode produksi).
3. **Deploy Security Rules** — wajib, terutama agar agenda bisa diubah tanpa login:
   ```bash
   npx firebase-tools@14 login
   npx firebase-tools@14 deploy --only firestore:rules --project <PROJECT_ID>
   ```
4. **Daftarkan admin** — Authentication → **Add user**, lalu Firestore → koleksi `whitelist` → dokumen dengan **ID = email huruf kecil**:
   | field | tipe | nilai |
   | :--- | :--- | :--- |
   | `email` | string | sama dengan ID dokumen |
   | `name` | string | nama admin |
   | `role` | string | `IT_ADMIN` |
   | `roleTitle` | string | `IT Developer & Superadmin` |
   | `department` | string | `Teknologi Informasi & Sistem` |
   | `active` | **boolean** | `true` |
   | `addedAt` | string | `2026-11-27T00:00:00Z` |
   | `addedBy` | string | `Firebase Console` |

   Whitelist sengaja **tidak bisa diubah dari aplikasi** — menambah admin lain dilakukan dengan cara yang sama.
5. **Login pertama:** buka `/masuk`, isi email, klik **"Lupa kata sandi / buat kata sandi baru?"**, lalu buat kata sandi dari tautan di email. Langkah ini sekaligus memverifikasi email.
6. **Link aplikasi:** selama database belum berisi link, portal menampilkan daftar bawaan. Perubahan pertama di Panel Admin menyimpan seluruh daftar bawaan ke database sekaligus.

---

## 🏗️ 6. Struktur Direktori

```text
portal-rep/
├── app/
│   ├── page.tsx                  # Beranda: jam WIT, cuaca, agenda, libur nasional
│   ├── api/libur/                # Libur nasional dari kalender publik Google (cache 1 hari)
│   ├── apps/                     # Daftar aplikasi lengkap dengan keterangan
│   ├── agenda/                   # Kalender + agenda bersama (bisa diubah siapa saja)
│   ├── masuk/                    # Login admin
│   └── dashboard/admin/          # Panel admin: kelola link aplikasi
├── components/
│   ├── ui/Bento.tsx              # Kisi & kartu bento bersama
│   ├── admin/tabs/AppsTab.tsx    # Formulir kelola link aplikasi
│   ├── AppList.tsx               # Kartu-kartu aplikasi
│   ├── AgendaCalendar.tsx        # Kalender bulanan (libur & agenda)
│   ├── WeatherForecast.tsx       # Ramalan cuaca 7 hari
│   └── …                         # Navbar, modal agenda, RoleGuard, motif Papua
├── lib/
│   ├── storage.ts                # Data link aplikasi & agenda (Firestore / localStorage)
│   ├── auth-context.tsx          # Login admin (Firebase Auth + whitelist)
│   ├── weather.ts                # Open-Meteo: ambil & terjemahkan kode cuaca WMO
│   ├── holidays-ics.ts           # Pengurai kalender libur (.ics)
│   └── seed-data.ts              # Daftar aplikasi bawaan & data mode demo
├── firestore.rules               # Siapa boleh menulis apa
└── tests/                        # unit (Vitest), rules (node:test), e2e (Playwright)
```

---

## 🔒 7. Keamanan

- **Link aplikasi** hanya bisa diubah akun `IT_ADMIN` yang terverifikasi & aktif di whitelist; URL wajib `http(s)://` (mencegah tautan `javascript:`).
- **Agenda** terbuka untuk semua orang, dengan validasi bentuk data di Security Rules (lihat peringatan di bagian 3).
- **Whitelist** hanya bisa diubah lewat Firebase Console; setiap orang hanya bisa membaca entrinya sendiri.
- Koleksi lain (sisa fitur lama) ditutup sepenuhnya.
- Redirect setelah login hanya ke path internal (anti *open redirect*).

---

## 🧪 8. Pengujian & CI

| Perintah | Isi | Kebutuhan |
| :--- | :--- | :--- |
| `npm run lint` | ESLint, **0 warning** diizinkan | — |
| `npm run typecheck` | TypeScript | — |
| `npm test` | Unit test (Vitest): redirect aman, pengurai kalender libur, kode cuaca WMO | — |
| `npm run test:rules` | Firestore Security Rules: agenda publik + validasinya, link khusus admin, whitelist tertutup | Java 11+ |
| `npm run test:e2e` | Playwright: login admin, panel link, agenda tanpa login, kalender & libur, cuaca, PWA offline, tampilan HP 360 & 390px | Java 11+, `npx playwright install chromium` (atau `PW_CHANNEL=chrome`) |

Uji e2e memakai build produksi di folder `.next-e2e` dan emulator — tidak menyentuh data produksi. GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) menjalankan semuanya pada setiap push ke `main` dan setiap pull request.

---

## 🚢 9. Deployment ke Vercel

1. Impor repository ke [Vercel](https://vercel.com) dan isi variabel bagian 5.1.
2. Tambahkan domain Vercel di Firebase Console → Authentication → Settings → **Authorized domains**.
3. Deploy, lalu **deploy `firestore.rules`** (bagian 5.2 langkah 3). Vercel tidak men-deploy aturan Firestore — tanpa langkah ini, agenda tidak bisa diubah pengunjung.

---

<p align="center">
  <strong>Yayasan Rumah Etnik Papua © 2026</strong><br>
  <em>Dikembangkan oleh: Ridwan Elly (IT Developer Internal)</em>
</p>
