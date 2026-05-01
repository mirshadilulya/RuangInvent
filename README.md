# RuangInvent 📦
**Sistem Inventaris Sekolah** — berbasis web, tanpa backend, data tersimpan di Google Drive.

🌐 **Live:** [https://mirshadilulya.github.io/RuangInvent/](https://mirshadilulya.github.io/RuangInvent/)

---

## ✨ Fitur Lengkap

| Modul | Fitur |
|-------|-------|
| 📦 **Manajemen Barang** | Tambah, edit, hapus, filter, foto, QR Code |
| 🔄 **Barang Masuk & Keluar** | Pencatatan + stok otomatis + riwayat |
| 📋 **Peminjaman** | Form lengkap + deteksi terlambat otomatis |
| ↩️ **Pengembalian** | Proses + catatan kondisi + riwayat |
| 🏫 **Ruangan** | Kelola lokasi + jumlah barang per ruangan |
| 🏷️ **Kategori** | Kelola kategori + jumlah per kategori |
| 📊 **Laporan PDF** | 5 jenis laporan + cetak PDF |
| ⚙️ **Pengaturan** | Profil + kelola role user + statistik |

## 👥 Sistem Role
- 👑 Super Admin — akses penuh
- 🔧 Operator — kelola barang & transaksi
- 👁️ Viewer — lihat & ajukan peminjaman

## 🛠️ Teknologi
Vanilla JS · Google OAuth 2.0 · Google Drive API · QRCode.js · GitHub Pages

## 📁 Struktur File
```
RuangInvent/
├── index.html / login.html / config.js
├── css/style.css
└── js/
    ├── app.js · auth.js · drive.js
    ├── barang.js · kategori.js · ruangan.js
    ├── transaksi.js · peminjaman.js
    ├── laporan.js · pengaturan.js
```
