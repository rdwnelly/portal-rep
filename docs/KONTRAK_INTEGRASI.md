# Kontrak Integrasi PORTAL REP ↔ Sub-Aplikasi (v1)

Dokumen ini untuk pengembang **Reservasi Homestay, SIK-REP, POS Kasir & OMG, dan Zeey Studio**.
Dengan menerapkan kontrak ini, sub-aplikasi:

1. tampil **live** di Dasbor Eksekutif portal (tanpa angka contoh), dan
2. mendukung **masuk otomatis (SSO)**: staf yang sudah login di portal langsung masuk tanpa login ulang.

> Implementasi acuan lengkap: repo `rep-pos-app`, branch `feat/integrasi-portal-rep`
> (`src/lib/portal-integration.ts`, `app/api/portal/**`, `app/sso/page.tsx`).

---

## 1. Secret bersama

Portal memanggil sub-aplikasi **dari server ke server** dengan header:

```
Authorization: Bearer <PORTAL_INTEGRATION_SECRET>
```

| Di mana | Variabel | Nilai |
| :--- | :--- | :--- |
| Sub-aplikasi | `PORTAL_INTEGRATION_SECRET` | secret acak ≥ 32 karakter (`openssl rand -hex 32`) |
| Portal | `INTEGRATION_<KUNCI>_SECRET` | **nilai yang sama** |
| Portal | `INTEGRATION_<KUNCI>_URL` | URL dasar sub-aplikasi, mis. `https://rep-pos-app.vercel.app` |

`<KUNCI>`: `RESERVASI`, `SIKREP`, `POS`, `ZEEY`. Satu secret berbeda untuk tiap sub-aplikasi.

Wajib:
- Bandingkan secret dengan perbandingan *constant-time* (`crypto.timingSafeEqual`).
- Jika `PORTAL_INTEGRATION_SECRET` kosong / < 32 karakter → tolak semua permintaan (integrasi mati).
- Endpoint `/api/portal/*` dikecualikan dari middleware/proxy autentikasi pengguna (mereka memverifikasi pemanggilnya sendiri).

---

## 2. Ringkasan metrik — `GET /api/portal/summary?period=…`

`period`: `TODAY` | `THIS_WEEK` (Senin s.d. hari ini) | `THIS_MONTH` (tanggal 1 s.d. hari ini). Zona waktu **Asia/Jayapura (WIT)**.

Respons `200`:

```json
{
  "contractVersion": 1,
  "period": "TODAY",
  "generatedAt": "2026-11-06T05:00:00.000Z",
  "data": { "...": "lihat skema per aplikasi" }
}
```

Hanya **angka agregat** — jangan kirim data pelanggan atau transaksi individual. Portal menolak respons yang tidak memenuhi skema dan menampilkannya sebagai "Gangguan". Batas waktu respons: **8 detik**.

### Skema `data` per aplikasi

**Reservasi** (`reservasi`)

| field | tipe | arti |
| :--- | :--- | :--- |
| `totalHomestay` | number | jumlah kamar |
| `occupiedHomestay` | number | kamar terisi saat ini |
| `occupancyRate` | number | persen, 0–100 |
| `activeGuestsToday` | number | tamu menginap |
| `upcomingBookings` | number | reservasi mendatang |
| `totalTicketsSold` | number | tiket wisata terjual dalam periode |
| `revenueEstimated` | number | pendapatan periode (IDR) |
| `trendGuests` | string | mis. `"+14,2% vs pekan lalu"` |

**SIK-REP** (`keuangan`)

| field | tipe | arti |
| :--- | :--- | :--- |
| `totalCashBalance` | number | saldo kas (IDR) |
| `monthlyIncome` / `monthlyExpense` / `netCashFlow` | number | penerimaan / pengeluaran / arus bersih periode |
| `pendingReimbursementsCount` | number | kasbon/reimburse menunggu |
| `pendingReimbursementTotal` | number | nilainya (IDR) |
| `reconciliationStatus` | string | `RECONCILED` \| `PENDING` \| `IN_PROGRESS` |
| `trendRevenue` | string | perbandingan dengan periode lalu |

**POS & Gudang** (`posGudang`) — *sudah diterapkan di rep-pos-app*

| field | tipe | arti |
| :--- | :--- | :--- |
| `dailySalesVolume` | number | penjualan bersih periode (kotor − retur) |
| `dailyTransactionsCount` | number | jumlah transaksi penjualan |
| `totalMonitoredItems` | number | jumlah produk |
| `lowStockAlerts` | array | `{ itemName, currentStock, minThreshold, category, unit }`, maks. 10 |
| `popularItemToday` | string | produk terlaris periode |
| `settlementStatus` | string | `SETTLED` \| `OPEN` \| `SHIFT_2_ACTIVE` |
| `trendSales` | string | perbandingan dengan periode lalu |

**Zeey Studio** (`zeeyStudio`)

| field | tipe | arti |
| :--- | :--- | :--- |
| `totalMediaAssets` | number | total berkas |
| `newAssetsThisWeek` | number | berkas baru pekan ini |
| `highResPhotosCount` / `culturalVideosCount` | number | jumlah foto / video |
| `cloudStorageUsedGb` / `totalCloudStorageGb` | number | pemakaian / kuota penyimpanan |
| `latestUploadTitle` | string | judul unggahan terbaru |

---

## 3. Masuk otomatis (SSO)

Portal hanya menjamin **identitas** (email terverifikasi & staf aktif di whitelist portal). **Hak akses di sub-aplikasi tetap mengikuti role akun di sub-aplikasi itu** — portal tidak pernah memberi role.

```
Staf klik aplikasi di portal
  → server portal: POST {sub-app}/api/portal/sso/ticket   (secret bersama) { email }
  ← { url: "{sub-app}/sso?ticket=<64 hex>" }
  → browser membuka url tersebut
  → halaman /sso: POST /api/portal/sso/redeem { ticket }  ← { customToken }
  → signInWithCustomToken(auth, customToken)
```

### `POST /api/portal/sso/ticket` (secret bersama)
Body `{ "email": "...", "name": "...", "portalRole": "..." }`.
- Cari akun berdasarkan email. Tidak ada → `404 { "error": "...", "code": "NO_ACCOUNT" }`. Dinonaktifkan → `403 { "code": "DISABLED" }`.
- Buat tiket acak 32 byte (hex), simpan di server dengan masa berlaku **60 detik**.
- Balas `{ "url": "<origin>/sso?ticket=<tiket>" }`. Portal menolak `url` di luar `INTEGRATION_<KUNCI>_URL`.

### `POST /api/portal/sso/redeem` (publik)
Body `{ "ticket": "<64 hex>" }`.
- Ambil & **hapus** tiket dalam satu transaksi (sekali pakai). Tidak ada / kedaluwarsa → `410`.
- Balas `{ "customToken": "..." }` dari `admin.auth().createCustomToken(uid)`.

### Halaman `/sso`
- Baca `ticket` dari URL lalu **segera** `history.replaceState` agar tiket tidak tersimpan di riwayat.
- Tukar tiket, `signInWithCustomToken`, lalu arahkan ke halaman utama aplikasi.
- Bila gagal, tampilkan pesan dan tautan login manual.

Koleksi/tabel tiket **tidak boleh** dapat dibaca klien (Firestore rules: `allow read, write: if false`).

---

## 4. Checklist uji

- [ ] `curl -H "Authorization: Bearer <secret>" "<url>/api/portal/summary?period=TODAY"` → 200 + `contractVersion: 1`
- [ ] Tanpa header / secret salah → 401
- [ ] Tiket SSO kedua kali dipakai → 410; setelah 60 detik → 410
- [ ] Email tanpa akun → 404 `NO_ACCOUNT` (portal membuka halaman login biasa)
- [ ] Di portal, kartu aplikasi di `/eksekutif` berlabel **Live**
