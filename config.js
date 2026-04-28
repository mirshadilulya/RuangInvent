// ============================================================
//  RuangInvent — Konfigurasi Utama
//  Ganti nilai di bawah sesuai project Google Cloud kamu
// ============================================================

const CONFIG = {
  CLIENT_ID: '224157132359-0nlbg4en1qrpas8sf5cn0jblsplm0cvv.apps.googleusercontent.com',

  // Scope akses Google yang dibutuhkan aplikasi
  SCOPES: [
    'https://www.googleapis.com/auth/drive.file',        // baca/tulis file yang dibuat app ini
    'https://www.googleapis.com/auth/drive.appdata',     // folder tersembunyi app
    'https://www.googleapis.com/auth/userinfo.profile',  // nama & foto profil
    'https://www.googleapis.com/auth/userinfo.email',    // email user
  ].join(' '),

  // Nama folder utama di Google Drive user
  DRIVE_FOLDER_NAME: 'RuangInvent_Data',

  // Nama-nama file JSON yang dipakai sebagai database
  FILES: {
    USERS:       'users.json',
    BARANG:      'barang.json',
    KATEGORI:    'kategori.json',
    RUANGAN:     'ruangan.json',
    TRANSAKSI:   'transaksi.json',
    PEMINJAMAN:  'peminjaman.json',
  },

  // URL aplikasi (otomatis sesuai environment)
  APP_URL: window.location.hostname === 'localhost'
    ? 'http://localhost:5500'
    : 'https://mirshadilulya.github.io/RuangInvent',
};
