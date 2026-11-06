# PORTAL REP (Pusat Operasional Rumah Terpadu Aplikasi Layanan REP)

<p align="center">
  <img src="public/images/rep-logo.jpg" alt="Logo Yayasan Rumah Etnik Papua" width="160" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  <strong>Single Sign-On (SSO) Hub & Pusat Operasional Digital Terintegrasi</strong><br>
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

## 📖 1. Latar Belakang & Tujuan

**Yayasan Rumah Etnik Papua (REP)** merupakan destinasi wisata budaya dan edukasi terintegrasi di Sorong, Papua Barat Daya. Untuk mendukung operasional harian, terdapat empat sistem manajemen inti:
1. **Sistem Manajemen Reservasi**: Booking kamar homestay etnik dan tiket destinasi wisata.
2. **SIK-REP (Sistem Informasi Keuangan)**: Pembukuan akuntansi terpadu dan laporan arus kas yayasan.
3. **POS Kasir & OMG (Operasional Manajemen Gudang)**: Komputerisasi kasir Yaswar Cafe, pencatatan otomatis produk keluar, dan inventaris stok suvenir.
4. **zeestudio**: Dokumentasi media audio-visual, materi promosi budaya, dan aset digital.

**PORTAL REP** berfungsi sebagai satu pintu masuk utama (*Single Source of Truth*) yang aman, cepat, dan modern: login staf berbasis whitelist, masuk otomatis (SSO) ke sub-aplikasi, data real-time di Firestore, dan dukungan Progressive Web App (PWA).

---

## 🌟 2. Fitur Utama

- 🔐 **Login & otorisasi berbasis whitelist** — Firebase Authentication (email terverifikasi) + role dari Firestore, ditegakkan oleh Security Rules. Kata sandi dibuat sendiri oleh staf lewat "Lupa kata sandi".
- 🔑 **Masuk otomatis (SSO) ke sub-aplikasi** — staf yang login langsung masuk ke aplikasi yang sudah menerapkan [kontrak integrasi](docs/KONTRAK_INTEGRASI.md).
- 📊 **Dasbor eksekutif live** — angka langsung dari sub-aplikasi; aplikasi yang belum terhubung ditandai jelas, tanpa angka contoh.
- 📢 **Papan pengumuman real-time** — prioritas & sematan, **konfirmasi "sudah dibaca"**, dan **notifikasi push** untuk instruksi mendesak / pengingat ke yang belum membaca.
- 📅 **Agenda budaya & 📁 Pusat Dokumen SOP** (Google Drive) — dokumen rahasia hanya untuk staf terdaftar.
- ⚙️ **Panel admin** — kelola pengumuman, agenda, dokumen, whitelist karyawan, permohonan akses, modul aplikasi, info yayasan, dan audit log (append-only).
- 📱 **Ramah HP & sederhana** — satu menu bawah berisi 5 tombol (Beranda, Aplikasi, Pengumuman, Dokumen, Lainnya), tanpa header menu di atas; tombol kelola hanya tampil untuk pimpinan/IT.
- 📲 **PWA** — dapat dipasang di HP; halaman yang pernah dibuka tetap tampil saat offline.
- 🕒 Jam real-time WIT & widget cuaca Sorong.

---

## 👥 3. Struktur Akun & Peran Pengguna (Role-Based Access)

| Peran (Role) | Pejabat / Pengguna | Akses & Wewenang |
| :--- | :--- | :--- |
| **IT Developer (Super Admin)** | **Ridwan Elly** | Pengelolaan Whitelist, konfigurasi URL aplikasi, audit log, dan broadcast instruksi. |
| **Manajemen Eksekutif** | **Bpk. Fricky Mosche Burdam** (Ketua)<br>**Ibu Mitshi Wanma** (Pengurus) | Memantau seluruh sistem, menyiarkan instruksi pimpinan, dan meninjau SOP yayasan. |
| **Staf Operasional & Frontdesk** | Staf Frontdesk & Kasir Yaswar Cafe | Reservasi homestay, tiket masuk wisata, dan kasir POS cafe. |
| **Staf Keuangan & Gudang** | Staf Pembukuan & Logistik | Modul akuntansi SIK-REP dan manajemen gudang suvenir OMG. |

---

## 🚀 4. Panduan Menjalankan Proyek

### Prasyarat
- Node.js 20+
- Java 11+ (hanya untuk Firebase Emulator: `npm run emulators` / `npm run test:rules`)

### Tiga mode berjalan

| Mode | Cara mengaktifkan | Data & login |
| :--- | :--- | :--- |
| **Demo** | `npm run dev` tanpa `.env.local` | Data contoh di localStorage browser. Login cukup dengan email dari whitelist contoh (`lib/seed-data.ts`), kata sandi apa pun. **Hanya aktif di `next dev`** — build produksi tanpa Firebase tidak menyediakan login sama sekali. |
| **Emulator** | Terminal 1: `npm run emulators` · Terminal 2: `NEXT_PUBLIC_FIREBASE_EMULATOR=true npm run dev` | Firestore & Auth lokal (UI emulator di http://127.0.0.1:4000). Ideal untuk menguji login, role, dan Security Rules tanpa menyentuh data produksi. |
| **Produksi** | Isi `.env.local` / Environment Variables Vercel (lihat bagian 5) | Firebase Auth + Firestore, otorisasi ditegakkan Security Rules. |

```bash
npm install
npm run dev          # http://localhost:3008
npm run test:rules   # uji Firestore Security Rules di emulator
```

---

## ⚙️ 5. Konfigurasi Firebase Produksi

### 5.1 Environment variables
Buat `.env.local` (dan isi juga di Vercel → Settings → Environment Variables):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=portal-rep-yayasan.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=portal-rep-yayasan
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=portal-rep-yayasan.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# --- Server (JANGAN diberi awalan NEXT_PUBLIC_) ---
# Project settings → Service accounts → Generate new private key → tempel seluruh JSON dalam satu baris
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# --- Notifikasi push (opsional) ---
# Project settings → Cloud Messaging → Web Push certificates → Key pair
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BExxxx...

# --- Integrasi sub-aplikasi (isi per aplikasi yang sudah menerapkan kontrak) ---
INTEGRATION_POS_URL=https://rep-pos-app.vercel.app
INTEGRATION_POS_SECRET=<openssl rand -hex 32>
# INTEGRATION_RESERVASI_URL / _SECRET, INTEGRATION_SIKREP_URL / _SECRET, INTEGRATION_ZEEY_URL / _SECRET
```

### 5.2 Langkah penyiapan pertama kali (sekali saja)
1. **Firebase Console → Authentication → Sign-in method:** aktifkan **Email/Password**.
2. **Firestore Database:** buat database (mode produksi).
3. **Deploy Security Rules:**
   ```bash
   npx firebase-tools@14 login
   npx firebase-tools@14 deploy --only firestore:rules --project <PROJECT_ID>
   ```
4. **Daftarkan IT Admin pertama** (rules mencegah siapa pun menulis whitelist sebelum ada admin):
   - Authentication → Users → **Add user** (email + kata sandi sementara).
   - Firestore → koleksi `whitelist` → dokumen dengan **ID = email huruf kecil**, berisi:
     | field | tipe | nilai |
     | :--- | :--- | :--- |
     | `email` | string | sama dengan ID dokumen |
     | `name` | string | Ridwan Elly |
     | `role` | string | `IT_ADMIN` |
     | `roleTitle` | string | IT Developer & Superadmin |
     | `department` | string | Teknologi Informasi & Sistem |
     | `active` | boolean | `true` |
     | `addedAt` | string | 2026-11-06T00:00:00Z |
     | `addedBy` | string | Firebase Console |
5. **Login pertama:** buka `/dashboard/admin/login`. Akun Email/Password wajib **email terverifikasi** — pada login pertama sistem mengirim tautan verifikasi; buka tautannya lalu login lagi. Gunakan "Lupa kata sandi" untuk mengganti kata sandi sementara.
6. **Isi data awal:** Panel Admin → tab **8. Audit Logs** → **Inisialisasi Data Awal Firestore → Jalankan**. Hanya koleksi yang masih kosong yang diisi (modul aplikasi, pengumuman, agenda, dokumen contoh, info yayasan, metrik).

### 5.3 Menghubungkan sub-aplikasi (metrik live & SSO)
Spesifikasi lengkap untuk pengembang sub-aplikasi: [`docs/KONTRAK_INTEGRASI.md`](docs/KONTRAK_INTEGRASI.md).
1. Buat secret: `openssl rand -hex 32`.
2. Di sub-aplikasi: isi `PORTAL_INTEGRATION_SECRET=<secret>` (POS juga membutuhkan `FIREBASE_SERVICE_ACCOUNT_JSON` miliknya sendiri).
3. Di portal: isi `INTEGRATION_<KUNCI>_URL` dan `INTEGRATION_<KUNCI>_SECRET` dengan secret yang sama, lalu redeploy.
4. Buka `/eksekutif` — kartu aplikasi berlabel **Live**. Kartu yang belum terhubung ditutup dengan keterangan, tidak pernah menampilkan angka contoh.

**SSO:** staf yang login di portal dan memiliki akun dengan **email yang sama** di sub-aplikasi langsung masuk saat membuka aplikasi. Role di sub-aplikasi tetap ditentukan sub-aplikasi itu. Bila tidak punya akun, portal membuka halaman login biasa dengan pemberitahuan.

| Sub-aplikasi | Status kontrak |
| :--- | :--- |
| POS Kasir & OMG | ✅ diterapkan (repo `rep-pos-app`, branch `feat/integrasi-portal-rep`) |
| Reservasi Homestay, SIK-REP, Zeey Studio | ⏳ belum — kartu tampil "belum terhubung" |

### 5.4 Notifikasi push & konfirmasi baca
- Staf yang login mendapat ajakan **"Aktifkan notifikasi"** (hanya build produksi, butuh `NEXT_PUBLIC_FIREBASE_VAPID_KEY`). Di iPhone, portal harus dipasang ke layar utama (iOS 16.4+).
- Pengumuman berprioritas **MENDESAK** otomatis dikirim sebagai push.
- Setiap pengumuman punya tombol **"Saya sudah membaca & memahami"**. Pimpinan melihat siapa yang sudah/belum membaca dan dapat **mengirim pengingat push hanya ke yang belum membaca**.

### 5.5 Menambahkan staf baru
1. Tambahkan email di Panel Admin → **Whitelist Karyawan** (atau setujui permohonan di tab **Permohonan Akses**).
2. Buat akunnya di Firebase Console → Authentication → **Add user** dengan kata sandi acak (jangan dibagikan).
3. Kirim pesan WhatsApp dari tombol **Kirim WA** — isinya meminta staf membuat kata sandinya sendiri lewat **"Lupa kata sandi"**. Kata sandi tidak pernah dikirim lewat portal.

---

## 🏗️ 6. Struktur Direktori Proyek

```text
portal-rep/
├── app/
│   ├── page.tsx                  # Beranda publik: aplikasi, pengumuman, agenda, cuaca
│   ├── apps/ agenda/ dokumen/    # Katalog aplikasi, agenda budaya, pusat dokumen
│   ├── eksekutif/                # Dasbor eksekutif (pimpinan & IT)
│   ├── dashboard/
│   │   ├── notices/              # Papan pengumuman + konfirmasi baca
│   │   └── admin/                # Panel admin (shell) + login/
│   └── api/
│       ├── metrics/              # Agregasi metrik dari sub-aplikasi
│       ├── sso/[app]/            # Tiket masuk otomatis ke sub-aplikasi
│       └── notify/               # Kirim notifikasi push pengumuman
├── components/
│   ├── admin/
│   │   ├── tabs/                 # 8 tab panel admin (Notices, Events, Documents, Whitelist, …)
│   │   ├── permissions.ts        # Tab yang boleh dilihat tiap role
│   │   └── useAdminData.ts       # Data panel admin (reaktif, real-time)
│   ├── RoleGuard.tsx             # Penjaga halaman berdasarkan role
│   ├── NoticeReadPanel.tsx       # Konfirmasi baca & status baca untuk pimpinan
│   ├── SourceStatus.tsx          # Lencana/overlay status sumber data (Live, belum terhubung)
│   └── …                         # Navbar, modal, widget, motif Papua
├── lib/
│   ├── storage.ts                # Lapisan data: Firestore real-time / localStorage (demo)
│   ├── auth-context.tsx          # Sesi & role pengguna
│   ├── integration-contract.ts   # Skema kontrak integrasi sub-aplikasi
│   ├── live-metrics.ts           # Hook metrik eksekutif
│   ├── push.ts                   # Notifikasi push (FCM)
│   └── server/                   # Admin SDK, verifikasi pemanggil API, klien integrasi
├── public/sw.js · offline.html   # Service worker & halaman offline
├── docs/KONTRAK_INTEGRASI.md     # Spesifikasi untuk pengembang sub-aplikasi
├── firestore.rules               # Security Rules (otorisasi berbasis role)
├── tests/
│   ├── unit/                     # Vitest
│   ├── rules/                    # Uji Security Rules (emulator)
│   └── e2e/                      # Playwright (emulator + sub-aplikasi tiruan)
└── .github/workflows/ci.yml      # CI: lint, typecheck, unit, build, rules, e2e
```

---

## 🔒 7. Keamanan & Otorisasi

Aturan lengkap ada di [`firestore.rules`](firestore.rules) dan diuji otomatis oleh [`tests/rules/firestore.rules.test.mjs`](tests/rules/firestore.rules.test.mjs) (`npm run test:rules`).

| Data | Publik (tanpa login) | Staf aktif | EXECUTIVE | IT_ADMIN |
| :--- | :---: | :---: | :---: | :---: |
| Modul aplikasi | baca | baca | baca | baca + tulis |
| Pengumuman, agenda, info yayasan | baca | baca | baca + tulis | baca + tulis |
| Dokumen non-rahasia | baca | baca | baca + tulis | baca + tulis |
| Dokumen rahasia | — | baca | baca + tulis | baca + tulis |
| Metrik eksekutif (`/api/metrics`, langsung dari sub-aplikasi) | — | — | baca | baca |
| Permohonan akses | kirim | kirim | baca + putuskan | baca + putuskan |
| Whitelist karyawan | cek diri sendiri | cek diri sendiri | lihat + tambah staf biasa | penuh |
| Konfirmasi baca pengumuman | — | tulis milik sendiri | lihat semua | lihat semua |
| Token notifikasi push | — | daftar/hapus perangkat sendiri | sama | sama (hanya server yang membaca) |
| Audit log | — | tulis (atas nama sendiri) | tulis | baca + tulis |

Prinsip utama:
- **Role berasal dari `whitelist/{email}` di Firestore**, bukan dari data di browser. Mengubah localStorage tidak memberi hak apa pun.
- **Email wajib terverifikasi** — mencegah orang mendaftarkan akun Email/Password memakai email pimpinan.
- **Admin tidak dapat mengunci dirinya sendiri** (menurunkan role, menonaktifkan, atau menghapus akunnya).
- **Audit log append-only** dengan `actorEmail` yang dicocokkan ke akun login; tidak dapat diubah/dihapus siapa pun.
- Penjaga halaman di klien (`RoleGuard`) hanya untuk tampilan; perlindungan data sebenarnya ada di Security Rules.

---

## 🧪 8. Pengujian & CI

| Perintah | Isi | Kebutuhan |
| :--- | :--- | :--- |
| `npm run lint` | ESLint, **0 warning** diizinkan | — |
| `npm run typecheck` | TypeScript | — |
| `npm test` | Unit test (Vitest): otorisasi API, kontrak integrasi, SSO, redirect aman | — |
| `npm run test:rules` | Firestore Security Rules di emulator | Java 11+ |
| `npm run test:e2e` | Playwright: login, role, panel admin, real-time, metrik live, SSO, konfirmasi baca, PWA offline, **tampilan HP** (360 & 390px: tanpa geser samping, konten tidak tertutup menu bawah) | Java 11+, browser Playwright (`npx playwright install chromium`) atau `PW_CHANNEL=chrome` |

Uji e2e memakai build produksi di folder `.next-e2e` sehingga **aman dijalankan bersamaan dengan `npm run dev`**. Semua uji memakai emulator — tidak menyentuh data produksi.

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) menjalankan semuanya pada setiap push ke `main` dan setiap pull request.

---

## 🚢 9. Deployment ke Vercel

1. Impor repository ke [Vercel](https://vercel.com).
2. Isi seluruh `NEXT_PUBLIC_FIREBASE_*` di Environment Variables. **Tanpa variabel ini, build produksi tidak menyediakan login** (portal publik tetap tampil dengan data contoh).
3. Tambahkan domain Vercel di Firebase Console → Authentication → Settings → **Authorized domains**.
4. Deploy, lalu pastikan `firestore.rules` terbaru sudah di-deploy (bagian 5.2 langkah 3).

---

<p align="center">
  <strong>Yayasan Rumah Etnik Papua © 2026</strong><br>
  <em>Dikembangkan oleh: Ridwan Elly (IT Developer Internal)</em>
</p>
