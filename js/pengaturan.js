// ============================================================
//  RuangInvent — pengaturan.js
//  Pengaturan profil akun + manajemen user (Super Admin)
// ============================================================

async function renderPengaturan() {
  document.getElementById('topbar-actions').innerHTML = '';
  const user = Auth.getUser();

  const container = document.getElementById('page-container');
  container.innerHTML = `
    <!-- Tab navigasi -->
    <div style="display:flex;border-bottom:1px solid #E2E0DA">
      <button id="tab-btn-profil" onclick="switchTabPengaturan('profil')"
        style="padding:12px 20px;border:none;background:none;font-family:inherit;font-size:13px;font-weight:600;color:#1A3C5E;border-bottom:2px solid #1A3C5E;cursor:pointer">
        👤 Profil Saya
      </button>
      ${Auth.isSuperAdmin() ? `
        <button id="tab-btn-users" onclick="switchTabPengaturan('users')"
          style="padding:12px 20px;border:none;background:none;font-family:inherit;font-size:13px;font-weight:500;color:#6B6B6B;border-bottom:2px solid transparent;cursor:pointer">
          👥 Kelola Pengguna
        </button>
        <button id="tab-btn-aplikasi" onclick="switchTabPengaturan('aplikasi')"
          style="padding:12px 20px;border:none;background:none;font-family:inherit;font-size:13px;font-weight:500;color:#6B6B6B;border-bottom:2px solid transparent;cursor:pointer">
          ⚙️ Aplikasi
        </button>
      ` : ''}
    </div>

    <!-- Panel Profil -->
    <div id="panel-profil" style="padding:1.5rem;max-width:560px">
      <!-- Kartu profil -->
      <div style="background:#F4F3EF;border-radius:14px;padding:1.5rem;display:flex;align-items:center;gap:1.25rem;margin-bottom:1.5rem">
        <img src="${user?.picture||''}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.1)"
          onerror="this.style.display='none'">
        <div>
          <div style="font-size:18px;font-weight:700">${user?.name||'—'}</div>
          <div style="font-size:13px;color:#6B6B6B;margin:2px 0">${user?.email||'—'}</div>
          <span style="display:inline-block;margin-top:6px;font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px;
            background:${user?.role==='superadmin'?'#FAEEDA':user?.role==='operator'?'#EEEDFE':'#E1F5EE'};
            color:${user?.role==='superadmin'?'#633806':user?.role==='operator'?'#3C3489':'#085041'}">
            ${user?.role==='superadmin'?'👑 Super Admin':user?.role==='operator'?'🔧 Operator':'👁️ Viewer'}
          </span>
        </div>
      </div>

      <!-- Info detail -->
      <div style="background:#fff;border:1px solid #E2E0DA;border-radius:12px;overflow:hidden;margin-bottom:1.5rem">
        <div style="padding:0.875rem 1.25rem;border-bottom:1px solid #E2E0DA;font-weight:600;font-size:13px;background:#FAFAF8">
          Informasi Akun
        </div>
        ${[
          ['Nama Lengkap',    user?.name     || '—'],
          ['Email Google',    user?.email    || '—'],
          ['Role / Akses',    user?.role==='superadmin'?'Super Admin':user?.role==='operator'?'Operator':'Viewer'],
          ['Bergabung Sejak', user?.createdAt ? formatTanggal(user.createdAt) : '—'],
          ['Login Terakhir',  user?.lastLogin ? formatTanggal(user.lastLogin)  : '—'],
          ['ID Pengguna',     user?.id        || '—'],
        ].map(([k,v]) => `
          <div style="display:flex;padding:0.875rem 1.25rem;border-bottom:1px solid #F0EEE8;font-size:13px">
            <div style="width:140px;color:#6B6B6B;flex-shrink:0">${k}</div>
            <div style="font-weight:500;word-break:break-all">${v}</div>
          </div>`).join('')}
        <div style="display:flex;padding:0.875rem 1.25rem;font-size:13px">
          <div style="width:140px;color:#6B6B6B;flex-shrink:0">Foto Profil</div>
          <div style="font-size:12px;color:#6B6B6B">Diambil otomatis dari akun Google kamu</div>
        </div>
      </div>

      <!-- Keterangan role -->
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:1rem 1.25rem;font-size:13px;color:#1E40AF;margin-bottom:1.5rem">
        <div style="font-weight:600;margin-bottom:6px">ℹ️ Tentang Role Kamu</div>
        ${user?.role==='superadmin'
          ? 'Kamu adalah <strong>Super Admin</strong> — memiliki akses penuh ke semua fitur termasuk kelola pengguna dan pengaturan aplikasi.'
          : user?.role==='operator'
          ? 'Kamu adalah <strong>Operator</strong> — dapat mengelola barang, mencatat transaksi, dan memproses peminjaman/pengembalian.'
          : 'Kamu adalah <strong>Viewer</strong> — dapat melihat data dan mengajukan peminjaman. Hubungi Admin untuk upgrade akses.'}
      </div>

      <!-- Tombol logout -->
      <button class="btn btn-ghost" style="border-color:#FCA5A5;color:#DC2626" onclick="confirmLogout()">
        🚪 Keluar dari Akun
      </button>
    </div>

    <!-- Panel Kelola Pengguna (SuperAdmin only) -->
    <div id="panel-users" style="display:none">
      <div style="padding:1rem 1.25rem;border-bottom:1px solid #E2E0DA;display:flex;align-items:center;gap:10px">
        <div style="font-size:13px;color:#6B6B6B;flex:1">
          Kelola role semua pengguna yang pernah login ke RuangInvent.
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="data-table" id="tabel-users">
          <thead>
            <tr>
              <th>#</th>
              <th>Foto</th>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Bergabung</th>
              <th>Login Terakhir</th>
              <th>Ubah Role</th>
            </tr>
          </thead>
          <tbody id="tbody-users"></tbody>
        </table>
      </div>
    </div>

    <!-- Panel Aplikasi (SuperAdmin only) -->
    <div id="panel-aplikasi" style="display:none;padding:1.5rem;max-width:560px">
      <div style="background:#fff;border:1px solid #E2E0DA;border-radius:12px;overflow:hidden;margin-bottom:1.5rem">
        <div style="padding:0.875rem 1.25rem;border-bottom:1px solid #E2E0DA;font-weight:600;font-size:13px;background:#FAFAF8">
          Informasi Aplikasi
        </div>
        ${[
          ['Nama Aplikasi',   'RuangInvent'],
          ['Versi',           '1.0.0'],
          ['Platform',        'GitHub Pages (Static Web)'],
          ['Storage',         'Google Drive (JSON)'],
          ['Autentikasi',     'Google OAuth 2.0'],
          ['URL Aplikasi',    window?.location?.origin + (window?.location?.pathname||'')],
        ].map(([k,v]) => `
          <div style="display:flex;padding:0.875rem 1.25rem;border-bottom:1px solid #F0EEE8;font-size:13px">
            <div style="width:140px;color:#6B6B6B;flex-shrink:0">${k}</div>
            <div style="font-weight:500;word-break:break-all">${v}</div>
          </div>`).join('')}
      </div>

      <!-- Statistik data -->
      <div style="background:#fff;border:1px solid #E2E0DA;border-radius:12px;overflow:hidden;margin-bottom:1.5rem">
        <div style="padding:0.875rem 1.25rem;border-bottom:1px solid #E2E0DA;font-weight:600;font-size:13px;background:#FAFAF8">
          Statistik Data
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
          ${[
            ['📦 Total Barang',       App.data.barang.length],
            ['🏷️ Total Kategori',     App.data.kategori.length],
            ['🏫 Total Ruangan',      App.data.ruangan.length],
            ['🔄 Total Transaksi',    App.data.transaksi.length],
            ['📋 Total Peminjaman',   App.data.peminjaman.length],
            ['👥 Total Pengguna',     App.data.users.length],
          ].map(([k,v]) => `
            <div style="padding:0.875rem 1.25rem;border-bottom:1px solid #F0EEE8;border-right:1px solid #F0EEE8;font-size:13px;display:flex;justify-content:space-between">
              <span style="color:#6B6B6B">${k}</span>
              <span style="font-weight:700">${v}</span>
            </div>`).join('')}
        </div>
      </div>

      <!-- Zona bahaya -->
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:1.25rem">
        <div style="font-weight:600;font-size:13px;color:#991B1B;margin-bottom:8px">⚠️ Zona Berbahaya</div>
        <div style="font-size:12px;color:#7F1D1D;margin-bottom:12px;line-height:1.6">
          Tindakan di bawah ini tidak dapat dibatalkan. Pastikan sudah membuat backup data terlebih dahulu.
        </div>
        <button class="btn" style="background:#DC2626;color:#fff;font-size:12px" onclick="konfirmasiResetData()">
          🗑️ Reset Semua Data Inventaris
        </button>
      </div>
    </div>`;

  // Render tabel users jika super admin
  if (Auth.isSuperAdmin()) {
    renderTabelUsers();
  }
}

// ── Switch tab pengaturan ────────────────────────────────
function switchTabPengaturan(tab) {
  const panels = ['profil', 'users', 'aplikasi'];
  panels.forEach(p => {
    const panel = document.getElementById(`panel-${p}`);
    const btn   = document.getElementById(`tab-btn-${p}`);
    if (panel) panel.style.display = p === tab ? 'block' : 'none';
    if (btn) {
      btn.style.color       = p === tab ? '#1A3C5E' : '#6B6B6B';
      btn.style.fontWeight  = p === tab ? '600' : '500';
      btn.style.borderBottom = `2px solid ${p === tab ? '#1A3C5E' : 'transparent'}`;
    }
  });

  // Khusus panel-users pakai display lain karena berisi tabel
  if (tab === 'users') {
    document.getElementById('panel-users').style.display = 'block';
  }
}

// ── Render tabel pengguna ────────────────────────────────
function renderTabelUsers() {
  const tbody   = document.getElementById('tbody-users');
  if (!tbody) return;
  const users   = App.data.users;
  const currentUser = Auth.getUser();

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
      <div class="icon">👥</div>
      <div class="title">Belum ada pengguna lain</div>
      <div class="desc">Pengguna akan muncul setelah mereka login pertama kali</div>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = users.map((u, i) => {
    const isMe = u.id === currentUser?.id;
    const roleLabels = {
      superadmin: { label:'👑 Super Admin', bg:'#FAEEDA', color:'#633806' },
      operator:   { label:'🔧 Operator',    bg:'#EEEDFE', color:'#3C3489' },
      viewer:     { label:'👁️ Viewer',      bg:'#E1F5EE', color:'#085041' },
    };
    const rl = roleLabels[u.role] || roleLabels.viewer;

    return `<tr style="${isMe?'background:#FFFBEB':''}">
      <td style="color:#6B6B6B">${i+1}</td>
      <td>
        <img src="${u.picture||''}" style="width:32px;height:32px;border-radius:50%;object-fit:cover"
          onerror="this.style.display='none'">
      </td>
      <td>
        <div style="font-weight:500">${u.name||'—'}${isMe?' <span style="font-size:10px;background:#FFFBEB;color:#92400E;padding:2px 6px;border-radius:100px">Kamu</span>':''}</div>
      </td>
      <td style="color:#6B6B6B;font-size:12px">${u.email}</td>
      <td>
        <span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px;background:${rl.bg};color:${rl.color}">
          ${rl.label}
        </span>
      </td>
      <td style="color:#6B6B6B;font-size:12px">${formatTanggal(u.createdAt)}</td>
      <td style="color:#6B6B6B;font-size:12px">${formatTanggal(u.lastLogin)}</td>
      <td>
        ${isMe
          ? '<span style="font-size:12px;color:#6B6B6B">—</span>'
          : `<select onchange="ubahRoleUser('${u.id}', this.value)"
              style="padding:5px 8px;border:1px solid #E2E0DA;border-radius:6px;font-size:12px;font-family:inherit;cursor:pointer">
              <option value="superadmin" ${u.role==='superadmin'?'selected':''}>👑 Super Admin</option>
              <option value="operator"   ${u.role==='operator'  ?'selected':''}>🔧 Operator</option>
              <option value="viewer"     ${u.role==='viewer'    ?'selected':''}>👁️ Viewer</option>
            </select>`
        }
      </td>
    </tr>`;
  }).join('');
}

// ── Ubah role user ───────────────────────────────────────
async function ubahRoleUser(userId, roleBarú) {
  const user = App.data.users.find(u => u.id === userId);
  if (!user) return;

  const roleLabel = { superadmin:'Super Admin', operator:'Operator', viewer:'Viewer' };
  if (!confirm(`Ubah role "${user.name}" menjadi ${roleLabel[roleBarú]}?`)) {
    // Revert dropdown
    renderTabelUsers();
    return;
  }

  try {
    const idx = App.data.users.findIndex(u => u.id === userId);
    if (idx !== -1) App.data.users[idx].role = roleBarú;
    await Drive.writeJSON(CONFIG.FILES.USERS, App.data.users);
    Toast.success(`Role ${user.name} diubah menjadi ${roleLabel[roleBarú]}!`);
    renderTabelUsers();
  } catch (err) {
    Toast.error('Gagal mengubah role.');
    renderTabelUsers();
  }
}

// ── Reset semua data (zona berbahaya) ────────────────────
async function konfirmasiResetData() {
  const konfirm1 = confirm('⚠️ PERINGATAN!\n\nTindakan ini akan menghapus SEMUA data inventaris:\n• Semua barang\n• Semua transaksi\n• Semua peminjaman\n• Semua kategori & ruangan\n\nData pengguna (akun) TIDAK akan dihapus.\n\nLanjutkan?');
  if (!konfirm1) return;

  const konfirm2 = prompt('Ketik "HAPUS SEMUA" (huruf kapital) untuk konfirmasi:');
  if (konfirm2 !== 'HAPUS SEMUA') {
    alert('Konfirmasi tidak sesuai. Penghapusan dibatalkan.');
    return;
  }

  showLoading('Menghapus semua data...');
  try {
    App.data.barang     = [];
    App.data.kategori   = [];
    App.data.ruangan    = [];
    App.data.transaksi  = [];
    App.data.peminjaman = [];

    await Promise.all([
      Drive.writeJSON(CONFIG.FILES.BARANG,     []),
      Drive.writeJSON(CONFIG.FILES.KATEGORI,   []),
      Drive.writeJSON(CONFIG.FILES.RUANGAN,    []),
      Drive.writeJSON(CONFIG.FILES.TRANSAKSI,  []),
      Drive.writeJSON(CONFIG.FILES.PEMINJAMAN, []),
    ]);

    hideLoading();
    Toast.success('Semua data berhasil direset!');
    await navigate('dashboard');
  } catch (err) {
    hideLoading();
    Toast.error('Gagal mereset data.');
  }
}
