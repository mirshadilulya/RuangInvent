# RuangInvent 📦

Sistem Inventaris Sekolah berbasis web — dibangun dengan HTML, CSS, dan JavaScript murni. Data tersimpan di Google Drive, tanpa backend atau server tambahan.

## 🌐 Demo
[https://mirshadilulya.github.io/RuangInvent/](https://mirshadilulya.github.io/RuangInvent/)

## ✨ Fitur
- Manajemen barang (tambah, edit, hapus, filter, foto, QR code)
- Barang masuk & keluar dengan update stok otomatis
- Peminjaman & pengembalian lengkap dengan status terlambat
- Kelola ruangan & kategori
- 5 jenis laporan + cetak PDF
- Multi akun dengan sistem role (Super Admin, Operator, Viewer)
- Login via Google OAuth 2.0
- Data tersimpan di Google Drive pribadi

## 🛠️ Teknologi
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Auth**: Google Identity Services (OAuth 2.0)
- **Storage**: Google Drive API v3 (file JSON)
- **Hosting**: GitHub Pages

## 🚀 Setup & Penggunaan

### 1. Konfigurasi
Edit file `config.js` dan isi `CLIENT_ID` dengan Client ID Google Cloud-mu.

### 2. Google Cloud Console
- Aktifkan **Google Drive API** dan **Google People API**
- Tambahkan authorized origins: `https://mirshadilulya.github.io`
- Tambahkan authorized redirect URI: `https://mirshadilulya.github.io/RuangInvent/`

### 3. Deploy
Push ke branch `main` — GitHub Pages akan otomatis deploy.

## 📁 Struktur File
```
RuangInvent/
├── index.html       # Dashboard utama (SPA)
├── login.html       # Halaman login
├── config.js        # Konfigurasi CLIENT_ID
├── css/
│   └── style.css    # Styling global
└── js/
    ├── app.js       # Router & logika utama
    ├── auth.js      # OAuth & sistem role
    ├── drive.js     # Google Drive API
    ├── barang.js    # Manajemen barang
    ├── transaksi.js # Barang masuk/keluar
    ├── peminjaman.js# Peminjaman & pengembalian
    └── laporan.js   # Laporan & PDF
```

## 👥 Sistem Role
| Role | Akses |
|------|-------|
| Super Admin | Semua fitur + kelola user |
| Operator | Kelola barang, transaksi, peminjaman |
| Viewer | Hanya ajukan peminjaman |

Admin pertama yang login otomatis menjadi Super Admin.
