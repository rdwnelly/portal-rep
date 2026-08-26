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
  <img src="https://img.shields.io/badge/Next.js-15%2B-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?style=flat-square&logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/PWA-Ready-10B981?style=flat-square" alt="PWA" />
  <img src="https://img.shields.io/badge/Author-Ridwan%20Elly-amber?style=flat-square" alt="Author" />
</p>

---

## 📖 1. Latar Belakang & Tujuan

**Yayasan Rumah Etnik Papua (REP)** merupakan destinasi wisata budaya dan edukasi terintegrasi di Sorong, Papua Barat Daya. Untuk mendukung operasional harian, terdapat empat sistem manajemen inti:
1. **Sistem Manajemen Reservasi**: Booking kamar homestay etnik dan tiket destinasi wisata.
2. **SIK-REP (Sistem Informasi Keuangan)**: Pembukuan akuntansi terpadu dan laporan arus kas yayasan.
3. **POS Kasir & OMG (Operasional Manajemen Gudang)**: Komputerisasi kasir Yaswar Cafe, pencatatan otomatis produk keluar, dan inventaris stok suvenir.
4. **zeestudio**: Dokumentasi media audio-visual, materi promosi budaya, dan aset digital.

**PORTAL REP** berfungsi sebagai satu pintu masuk utama (*Single Source of Truth*) yang aman, cepat, dan modern berbasis Single Sign-On (Google SSO) dengan proteksi Whitelist ketat dan dukungan Progressive Web App (PWA).

---

## 🌟 2. Fitur Utama

- 🔐 **Single Sign-On (SSO) & Whitelist Shield**:
  - Login Google terpusat via Firebase Authentication.
  - Hanya email staf resmi yayasan yang terdaftar di Whitelist yang dapat masuk.
  - Tampilan otomatis *Access Denied* + formulir pengajuan akses staf baru.
- 📱 **Dashboard App Hub (Navigasi 2-Klik)**:
  - Antarmuka kartu grid beraksen kayu alami (*natural wood & deep emerald*).
  - Modal *handshake* verifikasi hak akses sebelum meluncurkan aplikasi tujuan.
- 📢 **Papan Pengumuman Real-Time (Notice Board)**:
  - Siaran instruksi pimpinan (Bpk. Fricky Mosche Burdam & Ibu Mitshi Wanma), SOP harian, dan agenda kunjungan budaya.
  - Fitur *Pin to Top*, badge prioritas (Normal, Tinggi, Mendesak), dan lampiran dokumen.
- 📲 **Progressive Web App (PWA Mobile Native)**:
  - Dapat diunduh (*Add to Home Screen*) di smartphone staf (Android/iOS) dan Desktop.
  - Caching offline via Service Worker.
- ⚙️ **Panel Admin & Whitelist Management**:
  - Tambah/Hapus email staf, atur hak akses per departemen, konfigurasi URL aplikasi, dan pantau *Audit Trail*.
- 🕒 **Indikator Waktu Nyata Sorong (WIT)**:
  - Jam digital real-time zona Papua Barat Daya (UTC+9).

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

### Prasyarat:
- Node.js versi 18+ atau 20+
- npm atau yarn / pnpm

### Langkah Instalasi & Menjalankan:
```bash
# 1. Masuk ke direktori proyek
cd /Users/ridwanelly/portal-rep

# 2. Instal dependensi
npm install

# 3. Jalankan server pengembang lokal
npm run dev
```

Buka browser di **[http://localhost:3000](http://localhost:3000)**.

---

## ⚙️ 5. Konfigurasi Lingkungan (.env.local)

Sistem telah dilengkapi **Built-in Dual Mode** (dapat langsung diuji coba dengan data demo). Untuk menghubungkan ke Google Firebase produksi:

Buat file `.env.local` pada *root* proyek:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=portal-rep-yayasan.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=portal-rep-yayasan
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=portal-rep-yayasan.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## 🏗️ 6. Struktur Direktori Proyek

```text
portal-rep/
├── app/
│   ├── layout.tsx              # Root Layout + Metadata PWA + AuthProvider
│   ├── page.tsx                # Halaman Login SSO + Quick Role Simulator
│   ├── globals.css             # Desain Sistem Etnik Papua + Glassmorphism
│   ├── dashboard/
│   │   ├── page.tsx            # Dashboard Utama (App Hub + Widget Pengumuman)
│   │   ├── notices/
│   │   │   └── page.tsx        # Papan Pengumuman Lengkap & Siaran Arahan
│   │   └── admin/
│   │       └── page.tsx        # Panel Whitelist Staf, URL Routing & Audit Log
├── components/
│   ├── Navbar.tsx              # Navigasi atas + Jam Real-time WIT + Profil
│   ├── AppCard.tsx             # Kartu interaktif 4 aplikasi inti
│   ├── AppLauncherModal.tsx    # Modal handshake SSO saat membuka aplikasi
│   ├── NoticeBoardWidget.tsx   # Widget ringkasan pengumuman di dashboard
│   ├── NoticeDetailModal.tsx   # Modal pembaca rincian pengumuman
│   ├── CreateNoticeModal.tsx   # Form pembuatan instruksi baru untuk pimpinan
│   ├── AccessDeniedModal.tsx   # Modal proteksi whitelist & pengajuan akses
│   ├── PWAInstallModal.tsx     # Panduan instalasi PWA ke HP/Desktop
│   ├── PapuanMotif.tsx         # Ornamen grafis geometris khas budaya Papua
│   └── PWARegister.tsx         # Service Worker registration
├── lib/
│   ├── types.ts                # TypeScript Interfaces & Model Data
│   ├── seed-data.ts            # Data awal staf yayasan & 4 aplikasi inti
│   ├── storage.ts              # Client Reactive Engine & Whitelist CRUD
│   ├── firebase.ts             # Inisialisasi Firebase Auth & Firestore
│   └── auth-context.tsx        # React Context Auth & Session Management
├── public/
│   ├── manifest.json           # Konfigurasi PWA Web App
│   ├── sw.js                   # Service Worker Offline Caching
│   ├── icons/                  # Icon aplikasi 192x192 & 512x512
│   └── images/                 # Logo Rumah Etnik Papua & Banner Budaya
├── next.config.ts              # Konfigurasi domain gambar Unsplash & Google
├── package.json
└── README.md
```

---

## 🔒 7. Aturan Keamanan (Firestore Security Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Pengumuman dapat dibaca oleh staf terautentikasi
    match /notices/{noticeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/whitelisted_users/$(request.auth.token.email)).data.role in ['EXECUTIVE', 'IT_ADMIN'];
    }
    // Whitelist hanya dapat dikelola oleh IT Developer (Ridwan Elly)
    match /whitelisted_users/{email} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/whitelisted_users/$(request.auth.token.email)).data.role == 'IT_ADMIN';
    }
  }
}
```

---

## 🚢 8. Deployment ke Vercel

1. Buat repository di GitHub atau GitLab.
2. Impor project ke dashboard [Vercel](https://vercel.com).
3. Masukkan *Environment Variables* Firebase jika ada.
4. Klik **Deploy** — aplikasi akan langsung aktif secara global dengan HTTPS otomatis.

---

<p align="center">
  <strong>Yayasan Rumah Etnik Papua © 2026</strong><br>
  <em>Dikembangkan oleh: Ridwan Elly (IT Developer Internal)</em>
</p>
