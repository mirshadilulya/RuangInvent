// ============================================================
//  RuangInvent — app.js
//  Router, inisialisasi, helper global, dan dashboard
// ============================================================

// ── State global aplikasi ────────────────────────────────
const App = {
  currentPage: 'dashboard',
  data: {
    barang:    [],
    kategori:  [],
    ruangan:   [],
    transaksi: [],
    peminjaman:[],
    users:     [],
  },
};

// ── Inisialisasi saat halaman dimuat ─────────────────────
window.addEventListener('load', async () => {
  // Guard: redirect ke login jika belum auth
  if (!Auth.requireAuth()) return;

  showLoading('Memuat aplikasi...');

  try {
    // Inisialisasi Google API & Drive
    await initGapi();

    // Tampilkan info user di sidebar
    renderUserInfo();

    // Load semua data awal
    await loadAllData();

    // Render dashboard
    await navigate('dashboard');

    // Cek peminjaman terlambat
    checkTerlambat();

  } catch (err) {
    console.error('App init error:', err);
    Toast.error('Gagal memuat aplikasi. Coba refresh halaman.');
  } finally {
    hideLoading();
  }
});

// ── Init Google API Client ───────────────────────────────
function initGapi() {
  return new Promise((resolve, reject) => {
    gapi.load('client', async () => {
      try {
        await gapi.client.init({});
        gapi.client.setToken({ access_token: Auth.getToken() });

        // Init drive (cari/buat folder & file)
        await Drive.init();
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

// ── Load semua data dari Drive ───────────────────────────
async function loadAllData() {
  const [barang, kategori, ruangan, transaksi, peminjaman, users] = await Promise.all([
    Drive.readJSON(CONFIG.FILES.BARANG),
    Drive.readJSON(CONFIG.FILES.KATEGORI),
    Drive.readJSON(CONFIG.FILES.RUANGAN),
    Drive.readJSON(CONFIG.FILES.TRANSAKSI),
    Drive.readJSON(CONFIG.FILES.PEMINJAMAN),
    Drive.readJSON(CONFIG.FILES.USERS),
  ]);

  App.data.barang     = barang     || [];
  App.data.kategori   = kategori   || [];
  App.data.ruangan    = ruangan    || [];
  App.data.transaksi  = transaksi  || [];
  App.data.peminjaman = peminjaman || [];
  App.data.users      = users      || [];
}

// ── Router: navigasi antar halaman ──────────────────────
async function navigate(page) {
  App.currentPage = page;

  // Update active state sidebar
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Tutup sidebar di mobile
  closeSidebar();

  // Update judul topbar
  const titles = {
    dashboard:    '🏠 Dashboard',
    barang:       '📦 Manajemen Barang',
    kategori:     '🏷️ Kategori',
    ruangan:      '🏫 Ruangan / Lokasi',
    transaksi:    '🔄 Barang Masuk & Keluar',
    peminjaman:   '📋 Peminjaman',
    pengembalian: '↩️ Pengembalian',
    laporan:      '📊 Laporan',
    pengaturan:   '⚙️ Pengaturan',
  };
  document.getElementById('page-title').textContent = titles[page] || page;
  document.getElementById('topbar-actions').innerHTML = '';

  // Tampil/sembunyikan stats grid
  const statsGrid = document.getElementById('stats-grid');
  statsGrid.style.display = page === 'dashboard' ? 'grid' : 'none';

  // Render halaman yang diminta
  const container = document.getElementById('page-container');
  container.innerHTML = '<div style="padding:3rem;text-align:center;color:#6B6B6B"><div style="font-size:32px;margin-bottom:8px">⏳</div>Memuat...</div>';

  switch (page) {
    case 'dashboard':    await renderDashboard(); break;
    case 'barang':       await renderBarang(); break;
    case 'kategori':     await renderKategori(); break;
    case 'ruangan':      await renderRuangan(); break;
    case 'transaksi':    await renderTransaksi(); break;
    case 'peminjaman':   await renderPeminjaman(); break;
    case 'pengembalian': await renderPengembalian(); break;
    case 'laporan':      await renderLaporan(); break;
    case 'pengaturan':   await renderPengaturan(); break;
    default:
      container.innerHTML = '<div style="padding:3rem;text-align:center">Halaman tidak ditemukan.</div>';
  }
}

// ── Dashboard: render statistik & ringkasan ──────────────
async function renderDashboard() {
  const { barang, peminjaman } = App.data;

  const totalBarang   = barang.length;
  const kondisiBaik   = barang.filter(b => b.kondisi === 'Baik').length;
  const sedangPinjam  = peminjaman.filter(p => p.status === 'Aktif').length;
  const terlambat     = peminjaman.filter(p => {
    if (p.status !== 'Aktif') return false;
    return new Date(p.batasPengembalian) < new Date();
  }).length;

  // Update stat cards
  document.getElementById('stat-barang').textContent    = totalBarang;
  document.getElementById('stat-baik').textContent      = kondisiBaik;
  document.getElementById('stat-pinjam').textContent    = sedangPinjam;
  document.getElementById('stat-terlambat').textContent = terlambat;

  // Render konten dashboard
  const container = document.getElementById('page-container');

  // 5 barang terbaru
  const barangTerbaru = [...barang].slice(-5).reverse();
  // 5 peminjaman aktif terbaru
  const pinjamAktif = peminjaman.filter(p => p.status === 'Aktif').slice(-5).reverse();

  container.innerHTML = `
    <div style="padding:1.5rem">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem">

        <!-- Barang terbaru -->
        <div>
          <div style="font-weight:600; margin-bottom:1rem; font-size:14px; color:#1C1C1C">
            Barang Terbaru Ditambahkan
          </div>
          ${barangTerbaru.length === 0
            ? `<div style="color:#6B6B6B;font-size:13px;text-align:center;padding:2rem 0">Belum ada barang</div>`
            : barangTerbaru.map(b => `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #E2E0DA">
                <div style="width:36px;height:36px;border-radius:8px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">📦</div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:500;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.nama}</div>
                  <div style="font-size:11px;color:#6B6B6B">${b.kategori || '—'} · Stok: ${b.stok}</div>
                </div>
                <span style="font-size:11px;padding:3px 8px;border-radius:100px;background:${kondisiBadge(b.kondisi).bg};color:${kondisiBadge(b.kondisi).color}">${b.kondisi}</span>
              </div>
            `).join('')
          }
        </div>

        <!-- Peminjaman aktif -->
        <div>
          <div style="font-weight:600; margin-bottom:1rem; font-size:14px; color:#1C1C1C">
            Peminjaman Aktif
          </div>
          ${pinjamAktif.length === 0
            ? `<div style="color:#6B6B6B;font-size:13px;text-align:center;padding:2rem 0">Tidak ada peminjaman aktif</div>`
            : pinjamAktif.map(p => {
                const isTerlambat = new Date(p.batasPengembalian) < new Date();
                return `
                  <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #E2E0DA">
                    <div style="width:36px;height:36px;border-radius:8px;background:${isTerlambat ? '#FEF2F2' : '#F0FDF4'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${isTerlambat ? '⚠️' : '📋'}</div>
                    <div style="flex:1;min-width:0">
                      <div style="font-weight:500;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.namaPeminjam}</div>
                      <div style="font-size:11px;color:#6B6B6B">${p.namaBarang} · ${formatTanggal(p.batasPengembalian)}</div>
                    </div>
                    <span style="font-size:11px;padding:3px 8px;border-radius:100px;background:${isTerlambat ? '#FEF2F2' : '#F0FDF4'};color:${isTerlambat ? '#991B1B' : '#166534'}">${isTerlambat ? 'Terlambat' : 'Aktif'}</span>
                  </div>
                `;
              }).join('')
          }
        </div>

      </div>
    </div>
  `;
}

// ── Helper: badge kondisi ────────────────────────────────
function kondisiBadge(kondisi) {
  const map = {
    'Baik':     { bg: '#F0FDF4', color: '#166534' },
    'Cukup':    { bg: '#FFFBEB', color: '#92400E' },
    'Rusak':    { bg: '#FEF2F2', color: '#991B1B' },
    'Hilang':   { bg: '#F3F4F6', color: '#374151' },
  };
  return map[kondisi] || { bg: '#F1EFE8', color: '#444441' };
}

// ── Helper: format tanggal ───────────────────────────────
function formatTanggal(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Helper: generate ID unik ─────────────────────────────
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

// ── Cek peminjaman terlambat (badge di nav) ──────────────
function checkTerlambat() {
  const terlambat = App.data.peminjaman.filter(p => {
    if (p.status !== 'Aktif') return false;
    return new Date(p.batasPengembalian) < new Date();
  }).length;

  const badge = document.getElementById('badge-terlambat');
  if (badge) {
    badge.style.display = terlambat > 0 ? 'inline' : 'none';
    badge.textContent = terlambat;
  }
}

// ── Render user info di sidebar ──────────────────────────
function renderUserInfo() {
  const user = Auth.getUser();
  if (!user) return;

  const avatar = document.getElementById('user-avatar');
  const nameEl = document.getElementById('user-name');
  const roleEl = document.getElementById('user-role');

  if (avatar) {
    avatar.src = user.picture || '';
    avatar.onerror = () => { avatar.style.display = 'none'; };
  }
  if (nameEl) nameEl.textContent = user.name || user.email;

  const roleLabels = {
    superadmin: '👑 Super Admin',
    operator:   '🔧 Operator',
    viewer:     '👁️ Viewer',
  };
  if (roleEl) roleEl.textContent = roleLabels[user.role] || user.role;
}

// ── Konfirmasi logout ────────────────────────────────────
function confirmLogout() {
  if (confirm('Yakin ingin keluar dari RuangInvent?')) {
    Auth.logout();
  }
}

// ── Toast notifikasi ─────────────────────────────────────
const Toast = {
  show(msg, type = '', icon = '') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `${icon ? `<span>${icon}</span>` : ''}<span>${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  },
  success(msg) { this.show(msg, 'success', '✅'); },
  error(msg)   { this.show(msg, 'error', '❌'); },
  warning(msg) { this.show(msg, 'warning', '⚠️'); },
  info(msg)    { this.show(msg, '', 'ℹ️'); },
};

// ── Loading overlay ──────────────────────────────────────
function showLoading(text = 'Memuat...') {
  document.getElementById('loading-text').textContent = text;
  document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

// ── Sidebar mobile toggle ────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('visible');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}

// ── Placeholder untuk halaman yang belum dibuat ──────────
// (akan diisi di Tahap 3–6)
// renderBarang, renderKategori, renderRuangan
// sudah didefinisikan di barang.js, kategori.js, ruangan.js
// renderTransaksi → didefinisikan di transaksi.js
// renderPeminjaman & renderPengembalian → didefinisikan di peminjaman.js
// renderLaporan   → didefinisikan di laporan.js
// renderPengaturan → didefinisikan di pengaturan.js
