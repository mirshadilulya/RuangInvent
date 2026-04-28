// ============================================================
//  RuangInvent — peminjaman.js
//  Peminjaman & Pengembalian + deteksi terlambat otomatis
// ============================================================

// ── Helper: hitung status peminjaman ────────────────────
function hitungStatusPeminjaman(p) {
  if (p.status === 'Selesai') return 'Selesai';
  const batas = new Date(p.batasPengembalian);
  batas.setHours(23, 59, 59);
  return new Date() > batas ? 'Terlambat' : 'Aktif';
}

// ── Helper: hitung selisih hari ─────────────────────────
function selisihHari(tgl) {
  const diff = Math.ceil((new Date() - new Date(tgl)) / (1000 * 60 * 60 * 24));
  return diff;
}

// ══════════════════════════════════════════════════════════
//  HALAMAN PEMINJAMAN
// ══════════════════════════════════════════════════════════

async function renderPeminjaman() {
  // Perbarui status terlambat otomatis sebelum render
  await autoUpdateStatusTerlambat();

  if (Auth.isOperator()) {
    document.getElementById('topbar-actions').innerHTML = `
      <button class="btn btn-primary" onclick="modalTambahPeminjaman()">➕ Catat Peminjaman</button>`;
  }

  const container = document.getElementById('page-container');
  container.innerHTML = `
    <!-- Statistik -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;padding:1.25rem;border-bottom:1px solid #E2E0DA">
      ${renderStatPeminjaman()}
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-input" style="flex:1;min-width:180px">
        <input type="text" id="search-pinjam" placeholder="Cari nama peminjam atau barang..."
          oninput="filterPeminjaman()" style="padding-left:34px">
      </div>
      <select class="filter-select" id="filter-status-pinjam" onchange="filterPeminjaman()">
        <option value="">Semua Status</option>
        <option value="Aktif">Aktif</option>
        <option value="Terlambat">Terlambat</option>
        <option value="Selesai">Selesai</option>
      </select>
      <select class="filter-select" id="filter-bulan-pinjam" onchange="filterPeminjaman()">
        <option value="">Semua Bulan</option>
        ${generateOpsibulanPinjam()}
      </select>
    </div>

    <!-- Tabel -->
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tgl Pinjam</th>
            <th>Peminjam</th>
            <th>Jabatan</th>
            <th>Barang</th>
            <th>Jml</th>
            <th>Batas Kembali</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody id="tbody-peminjaman"></tbody>
      </table>
    </div>
    <div style="padding:0.75rem 1.25rem;border-top:1px solid #E2E0DA;font-size:12px;color:#6B6B6B">
      Menampilkan <span id="info-jml-pinjam">0</span> data peminjaman
    </div>`;

  renderTabelPeminjaman(App.data.peminjaman);
}

function renderStatPeminjaman() {
  const data = App.data.peminjaman;
  const aktif     = data.filter(p => hitungStatusPeminjaman(p) === 'Aktif').length;
  const terlambat = data.filter(p => hitungStatusPeminjaman(p) === 'Terlambat').length;
  const selesai   = data.filter(p => p.status === 'Selesai').length;
  const total     = data.length;

  return [
    { icon:'📋', label:'Total Peminjaman', val: total,     bg:'#EFF6FF', color:'#1E40AF' },
    { icon:'🟢', label:'Aktif',            val: aktif,     bg:'#F0FDF4', color:'#166534' },
    { icon:'🔴', label:'Terlambat',        val: terlambat, bg:'#FEF2F2', color:'#991B1B' },
    { icon:'✅', label:'Selesai',          val: selesai,   bg:'#F4F3EF', color:'#444441' },
  ].map(s => `
    <div style="background:${s.bg};border-radius:10px;padding:1rem;display:flex;align-items:center;gap:10px">
      <span style="font-size:22px">${s.icon}</span>
      <div>
        <div style="font-size:20px;font-weight:700;color:${s.color}">${s.val}</div>
        <div style="font-size:11px;color:${s.color};opacity:0.8">${s.label}</div>
      </div>
    </div>`).join('');
}

function generateOpsibulanPinjam() {
  const bulanSet = new Set(App.data.peminjaman.map(p => p.tanggalPinjam?.substring(0,7)).filter(Boolean));
  return [...bulanSet].sort().reverse().map(b => {
    const [y,m] = b.split('-');
    const label = new Date(y, m-1).toLocaleDateString('id-ID', { month:'long', year:'numeric' });
    return `<option value="${b}">${label}</option>`;
  }).join('');
}

function renderTabelPeminjaman(list) {
  const tbody = document.getElementById('tbody-peminjaman');
  const info  = document.getElementById('info-jml-pinjam');
  if (!tbody) return;

  const sorted = [...list].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (info) info.textContent = sorted.length;

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state">
      <div class="icon">📋</div>
      <div class="title">Belum ada data peminjaman</div>
      <div class="desc">Klik "Catat Peminjaman" untuk mencatat peminjaman baru</div>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map((p, i) => {
    const status     = hitungStatusPeminjaman(p);
    const isTerlambat = status === 'Terlambat';
    const isSelesai   = status === 'Selesai';
    const hariTerlambat = isTerlambat ? selisihHari(p.batasPengembalian) : 0;

    return `<tr style="${isTerlambat ? 'background:#FFF5F5' : ''}">
      <td style="color:#6B6B6B">${i+1}</td>
      <td style="white-space:nowrap">${formatTanggal(p.tanggalPinjam)}</td>
      <td>
        <div style="font-weight:500">${p.namaPeminjam}</div>
        <div style="font-size:11px;color:#6B6B6B">${p.nomorKontak || ''}</div>
      </td>
      <td style="color:#6B6B6B">${p.jabatan || '—'}</td>
      <td>
        <div style="font-weight:500">${p.namaBarang}</div>
        <div style="font-size:11px;color:#6B6B6B">${p.keperluan || ''}</div>
      </td>
      <td style="font-weight:600">${p.jumlah} ${p.satuan||''}</td>
      <td>
        <div style="white-space:nowrap${isTerlambat ? ';color:#DC2626;font-weight:500' : ''}">${formatTanggal(p.batasPengembalian)}</div>
        ${isTerlambat ? `<div style="font-size:11px;color:#DC2626">⚠️ ${hariTerlambat} hari</div>` : ''}
      </td>
      <td><span class="badge badge-${status.toLowerCase()}">${status}</span></td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="action-btn action-btn-view" title="Detail" onclick="modalDetailPeminjaman('${p.id}')">🔍</button>
          ${Auth.isOperator() && !isSelesai ? `
            <button class="action-btn" style="background:#F0FDF4" title="Proses Pengembalian"
              onclick="navigate('pengembalian');setTimeout(()=>modalProsesKembali('${p.id}'),300)">↩️</button>
          ` : ''}
          ${Auth.isOperator() && isSelesai ? `
            <button class="action-btn action-btn-delete" title="Hapus" onclick="hapusPeminjaman('${p.id}')">🗑️</button>
          ` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterPeminjaman() {
  const q      = (document.getElementById('search-pinjam')?.value || '').toLowerCase();
  const status = document.getElementById('filter-status-pinjam')?.value || '';
  const bulan  = document.getElementById('filter-bulan-pinjam')?.value  || '';

  const filtered = App.data.peminjaman.filter(p => {
    const s = hitungStatusPeminjaman(p);
    const matchQ = !q      || p.namaPeminjam?.toLowerCase().includes(q) || p.namaBarang?.toLowerCase().includes(q);
    const matchS = !status || s === status;
    const matchB = !bulan  || p.tanggalPinjam?.startsWith(bulan);
    return matchQ && matchS && matchB;
  });
  renderTabelPeminjaman(filtered);
}

// ── Auto update status terlambat ke Drive ────────────────
async function autoUpdateStatusTerlambat() {
  let ada_perubahan = false;
  App.data.peminjaman.forEach(p => {
    if (p.status === 'Selesai') return;
    const statusBaru = hitungStatusPeminjaman(p);
    if (p.status !== statusBaru) {
      p.status = statusBaru;
      ada_perubahan = true;
    }
  });
  if (ada_perubahan) {
    await Drive.writeJSON(CONFIG.FILES.PEMINJAMAN, App.data.peminjaman);
    checkTerlambat();
  }
}

// ── Modal Tambah Peminjaman ──────────────────────────────
function modalTambahPeminjaman() {
  // Hanya barang dengan stok > 0
  const barangOptions = App.data.barang
    .filter(b => b.stok > 0)
    .map(b => `<option value="${b.id}" data-nama="${b.nama}" data-stok="${b.stok}" data-satuan="${b.satuan||''}">${b.nama} (Stok: ${b.stok} ${b.satuan||''})</option>`)
    .join('');

  const besok = new Date();
  besok.setDate(besok.getDate() + 7);
  const batasDefault = besok.toISOString().split('T')[0];

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'modal-pinjam';
  modal.innerHTML = `
    <div class="modal" style="max-width:540px">
      <div class="modal-header">
        <div class="modal-title">📋 Catat Peminjaman Baru</div>
        <button class="modal-close" onclick="tutupModal('modal-pinjam')">✕</button>
      </div>
      <div class="modal-body">

        <div style="font-size:12px;font-weight:600;color:#6B6B6B;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">Data Peminjam</div>

        <div class="form-row">
          <div class="form-group">
            <label>Nama Peminjam *</label>
            <input type="text" id="inp-pinjam-nama" placeholder="Nama lengkap">
          </div>
          <div class="form-group">
            <label>Jabatan *</label>
            <input type="text" id="inp-pinjam-jabatan" placeholder="Guru, Staff, Siswa...">
          </div>
        </div>

        <div class="form-group">
          <label>Nomor Kontak</label>
          <input type="text" id="inp-pinjam-kontak" placeholder="No. HP / WA (opsional)">
        </div>

        <div style="font-size:12px;font-weight:600;color:#6B6B6B;text-transform:uppercase;letter-spacing:0.5px;margin:16px 0 12px">Data Peminjaman</div>

        <div class="form-group">
          <label>Barang yang Dipinjam *</label>
          <select id="inp-pinjam-barang" onchange="onPilihBarangPinjam()">
            <option value="">-- Pilih Barang --</option>
            ${barangOptions}
          </select>
          ${barangOptions === '' ? `<div style="font-size:12px;color:#DC2626;margin-top:4px">⚠️ Tidak ada barang dengan stok tersedia.</div>` : ''}
        </div>

        <div id="info-stok-pinjam" style="display:none;background:#F0FDF4;border-radius:8px;padding:8px 12px;margin-bottom:1rem;font-size:13px">
          Stok tersedia: <strong id="val-stok-pinjam">0</strong> <span id="val-satuan-pinjam"></span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Jumlah *</label>
            <input type="number" id="inp-pinjam-jumlah" min="1" placeholder="1">
          </div>
          <div class="form-group">
            <label>Keperluan</label>
            <input type="text" id="inp-pinjam-keperluan" placeholder="Untuk apa barang dipinjam">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Tanggal Pinjam *</label>
            <input type="date" id="inp-pinjam-tgl" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label>Batas Pengembalian *</label>
            <input type="date" id="inp-pinjam-batas" value="${batasDefault}">
          </div>
        </div>

        <div class="form-group">
          <label>Catatan Tambahan</label>
          <textarea id="inp-pinjam-catatan" rows="2" placeholder="Kondisi barang saat dipinjam, dll (opsional)"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="tutupModal('modal-pinjam')">Batal</button>
        <button class="btn btn-primary" id="btn-simpan-pinjam" onclick="simpanPeminjaman()">
          📋 Catat Peminjaman
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function onPilihBarangPinjam() {
  const sel    = document.getElementById('inp-pinjam-barang');
  const opt    = sel?.options[sel.selectedIndex];
  const stok   = opt?.dataset.stok || 0;
  const satuan = opt?.dataset.satuan || '';
  const box    = document.getElementById('info-stok-pinjam');
  if (box) {
    box.style.display = sel?.value ? 'block' : 'none';
    document.getElementById('val-stok-pinjam').textContent  = stok;
    document.getElementById('val-satuan-pinjam').textContent = satuan;
  }
}

async function simpanPeminjaman() {
  const sel         = document.getElementById('inp-pinjam-barang');
  const opt         = sel?.options[sel.selectedIndex];
  const barangId    = sel?.value;
  const namaBarang  = opt?.dataset.nama || '';
  const satuan      = opt?.dataset.satuan || '';
  const stokTersedia = parseInt(opt?.dataset.stok) || 0;

  const namaPeminjam = document.getElementById('inp-pinjam-nama')?.value.trim();
  const jabatan      = document.getElementById('inp-pinjam-jabatan')?.value.trim();
  const kontak       = document.getElementById('inp-pinjam-kontak')?.value.trim();
  const jumlah       = parseInt(document.getElementById('inp-pinjam-jumlah')?.value) || 0;
  const keperluan    = document.getElementById('inp-pinjam-keperluan')?.value.trim();
  const tglPinjam    = document.getElementById('inp-pinjam-tgl')?.value;
  const batas        = document.getElementById('inp-pinjam-batas')?.value;
  const catatan      = document.getElementById('inp-pinjam-catatan')?.value.trim();

  // Validasi
  if (!namaPeminjam) { alert('Nama peminjam wajib diisi!'); return; }
  if (!jabatan)      { alert('Jabatan wajib diisi!'); return; }
  if (!barangId)     { alert('Pilih barang!'); return; }
  if (jumlah <= 0)   { alert('Jumlah harus lebih dari 0!'); return; }
  if (jumlah > stokTersedia) {
    alert(`Stok tidak mencukupi!\nStok tersedia: ${stokTersedia}\nJumlah pinjam: ${jumlah}`);
    return;
  }
  if (!tglPinjam)    { alert('Tanggal pinjam wajib diisi!'); return; }
  if (!batas)        { alert('Batas pengembalian wajib diisi!'); return; }
  if (batas < tglPinjam) { alert('Batas pengembalian tidak boleh sebelum tanggal pinjam!'); return; }

  const btn = document.getElementById('btn-simpan-pinjam');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Menyimpan...'; }

  try {
    const barang = App.data.barang.find(b => b.id === barangId);

    // 1. Catat peminjaman
    const pinjaman = {
      id:               generateId('pjm'),
      namaPeminjam,
      jabatan,
      nomorKontak:      kontak,
      barangId,
      namaBarang,
      satuan,
      jumlah,
      keperluan,
      tanggalPinjam:    tglPinjam,
      batasPengembalian: batas,
      catatanPinjam:    catatan,
      status:           'Aktif',
      petugas:          Auth.getUser()?.name || '',
      createdAt:        new Date().toISOString(),
    };
    App.data.peminjaman.push(pinjaman);

    // 2. Kurangi stok barang
    const idx = App.data.barang.findIndex(b => b.id === barangId);
    if (idx !== -1) {
      App.data.barang[idx].stok -= jumlah;
      App.data.barang[idx].updatedAt = new Date().toISOString();
    }

    // 3. Catat juga di transaksi sebagai keluar
    App.data.transaksi.push({
      id:          generateId('trx'),
      jenis:       'keluar',
      barangId,
      namaBarang,
      satuan,
      jumlah,
      stokSebelum: barang?.stok || 0,
      stokSesudah: (barang?.stok || 0) - jumlah,
      tanggal:     tglPinjam,
      sumber:      `Dipinjam oleh ${namaPeminjam}`,
      keterangan:  `Ref Peminjaman: ${pinjaman.id}`,
      petugas:     Auth.getUser()?.name || '',
      createdAt:   new Date().toISOString(),
    });

    // 4. Simpan semua ke Drive
    await Promise.all([
      Drive.writeJSON(CONFIG.FILES.PEMINJAMAN, App.data.peminjaman),
      Drive.writeJSON(CONFIG.FILES.BARANG,     App.data.barang),
      Drive.writeJSON(CONFIG.FILES.TRANSAKSI,  App.data.transaksi),
    ]);

    tutupModal('modal-pinjam');
    checkTerlambat();
    Toast.success(`Peminjaman "${namaBarang}" oleh ${namaPeminjam} berhasil dicatat!`);
    await renderPeminjaman();

  } catch (err) {
    console.error('simpanPeminjaman error:', err);
    Toast.error('Gagal menyimpan peminjaman.');
    if (btn) { btn.disabled = false; btn.textContent = '📋 Catat Peminjaman'; }
  }
}

// ── Modal Detail Peminjaman ──────────────────────────────
function modalDetailPeminjaman(id) {
  const p = App.data.peminjaman.find(p => p.id === id);
  if (!p) return;
  const status      = hitungStatusPeminjaman(p);
  const isTerlambat = status === 'Terlambat';
  const hariTerlambat = isTerlambat ? selisihHari(p.batasPengembalian) : 0;

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'modal-detail-pinjam';
  modal.innerHTML = `
    <div class="modal" style="max-width:480px">
      <div class="modal-header">
        <div class="modal-title">🔍 Detail Peminjaman</div>
        <button class="modal-close" onclick="tutupModal('modal-detail-pinjam')">✕</button>
      </div>
      <div class="modal-body">

        ${isTerlambat ? `
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:10px 14px;margin-bottom:1rem;font-size:13px;color:#991B1B">
            ⚠️ <strong>Terlambat ${hariTerlambat} hari</strong> — belum dikembalikan sejak ${formatTanggal(p.batasPengembalian)}
          </div>` : ''}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div>
            <div style="font-size:11px;color:#6B6B6B;margin-bottom:2px">Peminjam</div>
            <div style="font-weight:600">${p.namaPeminjam}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#6B6B6B;margin-bottom:2px">Jabatan</div>
            <div style="font-weight:500">${p.jabatan || '—'}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#6B6B6B;margin-bottom:2px">Nomor Kontak</div>
            <div>${p.nomorKontak || '—'}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#6B6B6B;margin-bottom:2px">Status</div>
            <span class="badge badge-${status.toLowerCase()}">${status}</span>
          </div>
          <div>
            <div style="font-size:11px;color:#6B6B6B;margin-bottom:2px">Barang</div>
            <div style="font-weight:600">${p.namaBarang}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#6B6B6B;margin-bottom:2px">Jumlah</div>
            <div style="font-weight:600">${p.jumlah} ${p.satuan||''}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#6B6B6B;margin-bottom:2px">Tanggal Pinjam</div>
            <div>${formatTanggal(p.tanggalPinjam)}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#6B6B6B;margin-bottom:2px">Batas Kembali</div>
            <div style="${isTerlambat?'color:#DC2626;font-weight:600':''}">${formatTanggal(p.batasPengembalian)}</div>
          </div>
          ${p.keperluan ? `<div style="grid-column:1/-1">
            <div style="font-size:11px;color:#6B6B6B;margin-bottom:2px">Keperluan</div>
            <div>${p.keperluan}</div>
          </div>` : ''}
          ${p.catatanPinjam ? `<div style="grid-column:1/-1">
            <div style="font-size:11px;color:#6B6B6B;margin-bottom:2px">Catatan Pinjam</div>
            <div style="background:#F4F3EF;border-radius:8px;padding:8px 12px;font-size:13px">${p.catatanPinjam}</div>
          </div>` : ''}
          ${p.tanggalKembali ? `
            <div>
              <div style="font-size:11px;color:#6B6B6B;margin-bottom:2px">Tgl Dikembalikan</div>
              <div style="color:#16A34A;font-weight:500">${formatTanggal(p.tanggalKembali)}</div>
            </div>
            <div>
              <div style="font-size:11px;color:#6B6B6B;margin-bottom:2px">Kondisi Kembali</div>
              <div>${p.kondisiKembali || '—'}</div>
            </div>
            ${p.catatanKembali ? `<div style="grid-column:1/-1">
              <div style="font-size:11px;color:#6B6B6B;margin-bottom:2px">Catatan Pengembalian</div>
              <div style="background:#F0FDF4;border-radius:8px;padding:8px 12px;font-size:13px">${p.catatanKembali}</div>
            </div>` : ''}
          ` : ''}
        </div>

        <div style="margin-top:12px;font-size:11px;color:#6B6B6B">
          Dicatat oleh: ${p.petugas || '—'} · ID: ${p.id}
        </div>
      </div>
      <div class="modal-footer">
        ${Auth.isOperator() && status !== 'Selesai' ? `
          <button class="btn btn-primary" style="background:#16A34A"
            onclick="tutupModal('modal-detail-pinjam');navigate('pengembalian');setTimeout(()=>modalProsesKembali('${p.id}'),300)">
            ↩️ Proses Pengembalian
          </button>` : ''}
        <button class="btn btn-ghost" onclick="tutupModal('modal-detail-pinjam')">Tutup</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function hapusPeminjaman(id) {
  if (!confirm('Hapus data peminjaman ini?')) return;
  App.data.peminjaman = App.data.peminjaman.filter(p => p.id !== id);
  await Drive.writeJSON(CONFIG.FILES.PEMINJAMAN, App.data.peminjaman);
  Toast.success('Data peminjaman dihapus!');
  await renderPeminjaman();
}


// ══════════════════════════════════════════════════════════
//  HALAMAN PENGEMBALIAN
// ══════════════════════════════════════════════════════════

async function renderPengembalian() {
  await autoUpdateStatusTerlambat();

  document.getElementById('topbar-actions').innerHTML = '';

  const container = document.getElementById('page-container');

  // Pisahkan: menunggu kembali vs riwayat selesai
  const menunggu = App.data.peminjaman.filter(p => p.status !== 'Selesai');
  const selesai  = App.data.peminjaman.filter(p => p.status === 'Selesai');

  container.innerHTML = `
    <!-- Tab -->
    <div style="display:flex;border-bottom:1px solid #E2E0DA">
      <button id="tab-btn-menunggu" onclick="switchTabKembali('menunggu')"
        style="padding:12px 20px;border:none;background:none;font-family:inherit;font-size:13px;font-weight:600;color:#1A3C5E;border-bottom:2px solid #1A3C5E;cursor:pointer">
        ⏳ Menunggu Kembali
        <span style="background:#FEF2F2;color:#991B1B;font-size:11px;padding:2px 7px;border-radius:100px;margin-left:6px">${menunggu.length}</span>
      </button>
      <button id="tab-btn-riwayat" onclick="switchTabKembali('riwayat')"
        style="padding:12px 20px;border:none;background:none;font-family:inherit;font-size:13px;font-weight:500;color:#6B6B6B;border-bottom:2px solid transparent;cursor:pointer">
        ✅ Riwayat Pengembalian
        <span style="background:#F0FDF4;color:#166534;font-size:11px;padding:2px 7px;border-radius:100px;margin-left:6px">${selesai.length}</span>
      </button>
    </div>

    <!-- Panel Menunggu -->
    <div id="panel-menunggu">
      <div class="toolbar">
        <div class="search-input" style="flex:1;min-width:180px">
          <input type="text" id="search-tunggu" placeholder="Cari peminjam atau barang..."
            oninput="filterMenunggu()" style="padding-left:34px">
        </div>
        <select class="filter-select" id="filter-tunggu-status" onchange="filterMenunggu()">
          <option value="">Semua</option>
          <option value="Terlambat">Terlambat</option>
          <option value="Aktif">Tepat Waktu</option>
        </select>
      </div>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Peminjam</th>
              <th>Jabatan</th>
              <th>Barang</th>
              <th>Jml</th>
              <th>Batas Kembali</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="tbody-menunggu"></tbody>
        </table>
      </div>
    </div>

    <!-- Panel Riwayat -->
    <div id="panel-riwayat" style="display:none">
      <div class="toolbar">
        <div class="search-input" style="flex:1;min-width:180px">
          <input type="text" id="search-riwayat" placeholder="Cari peminjam atau barang..."
            oninput="filterRiwayatKembali()" style="padding-left:34px">
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Peminjam</th>
              <th>Barang</th>
              <th>Jml</th>
              <th>Tgl Pinjam</th>
              <th>Tgl Kembali</th>
              <th>Kondisi Kembali</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody id="tbody-riwayat"></tbody>
        </table>
      </div>
    </div>`;

  renderTabelMenunggu(menunggu);
  renderTabelRiwayat(selesai);
}

function switchTabKembali(tab) {
  const isMenunggu = tab === 'menunggu';
  document.getElementById('panel-menunggu').style.display = isMenunggu ? 'block' : 'none';
  document.getElementById('panel-riwayat').style.display  = isMenunggu ? 'none' : 'block';

  document.getElementById('tab-btn-menunggu').style.cssText +=
    `;color:${isMenunggu?'#1A3C5E':'#6B6B6B'};border-bottom:2px solid ${isMenunggu?'#1A3C5E':'transparent'};font-weight:${isMenunggu?'600':'500'}`;
  document.getElementById('tab-btn-riwayat').style.cssText +=
    `;color:${!isMenunggu?'#1A3C5E':'#6B6B6B'};border-bottom:2px solid ${!isMenunggu?'#1A3C5E':'transparent'};font-weight:${!isMenunggu?'600':'500'}`;
}

function renderTabelMenunggu(list) {
  const tbody = document.getElementById('tbody-menunggu');
  if (!tbody) return;

  const sorted = [...list].sort((a,b) => new Date(a.batasPengembalian) - new Date(b.batasPengembalian));

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
      <div class="icon">🎉</div>
      <div class="title">Semua barang sudah dikembalikan!</div>
      <div class="desc">Tidak ada peminjaman yang menunggu pengembalian</div>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map((p, i) => {
    const status      = hitungStatusPeminjaman(p);
    const isTerlambat = status === 'Terlambat';
    const hari        = isTerlambat ? selisihHari(p.batasPengembalian) : 0;
    return `<tr style="${isTerlambat?'background:#FFF5F5':''}">
      <td style="color:#6B6B6B">${i+1}</td>
      <td>
        <div style="font-weight:500">${p.namaPeminjam}</div>
        ${p.nomorKontak ? `<div style="font-size:11px;color:#6B6B6B">${p.nomorKontak}</div>` : ''}
      </td>
      <td style="color:#6B6B6B">${p.jabatan||'—'}</td>
      <td style="font-weight:500">${p.namaBarang}</td>
      <td>${p.jumlah} ${p.satuan||''}</td>
      <td>
        <div style="${isTerlambat?'color:#DC2626;font-weight:600':''}">${formatTanggal(p.batasPengembalian)}</div>
        ${isTerlambat ? `<div style="font-size:11px;color:#DC2626">⚠️ ${hari} hari terlambat</div>` : ''}
      </td>
      <td><span class="badge badge-${status.toLowerCase()}">${status}</span></td>
      <td>
        ${Auth.isOperator() ? `
          <button class="btn btn-primary" style="font-size:12px;padding:6px 12px;background:#16A34A"
            onclick="modalProsesKembali('${p.id}')">
            ↩️ Kembalikan
          </button>` : '—'}
      </td>
    </tr>`;
  }).join('');
}

function renderTabelRiwayat(list) {
  const tbody = document.getElementById('tbody-riwayat');
  if (!tbody) return;

  const sorted = [...list].sort((a,b) => new Date(b.tanggalKembali) - new Date(a.tanggalKembali));

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
      <div class="icon">📋</div>
      <div class="title">Belum ada riwayat pengembalian</div>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map((p, i) => `
    <tr>
      <td style="color:#6B6B6B">${i+1}</td>
      <td>
        <div style="font-weight:500">${p.namaPeminjam}</div>
        <div style="font-size:11px;color:#6B6B6B">${p.jabatan||''}</div>
      </td>
      <td style="font-weight:500">${p.namaBarang}</td>
      <td>${p.jumlah} ${p.satuan||''}</td>
      <td style="color:#6B6B6B">${formatTanggal(p.tanggalPinjam)}</td>
      <td style="color:#16A34A;font-weight:500">${formatTanggal(p.tanggalKembali)}</td>
      <td><span class="badge badge-${(p.kondisiKembali||'').toLowerCase()}">${p.kondisiKembali||'—'}</span></td>
      <td style="color:#6B6B6B;font-size:12px;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${p.catatanKembali||''}">${p.catatanKembali||'—'}</td>
    </tr>`).join('');
}

function filterMenunggu() {
  const q      = (document.getElementById('search-tunggu')?.value || '').toLowerCase();
  const status = document.getElementById('filter-tunggu-status')?.value || '';
  const list   = App.data.peminjaman.filter(p => p.status !== 'Selesai');
  const filtered = list.filter(p => {
    const s = hitungStatusPeminjaman(p);
    const matchQ = !q      || p.namaPeminjam?.toLowerCase().includes(q) || p.namaBarang?.toLowerCase().includes(q);
    const matchS = !status || s === status;
    return matchQ && matchS;
  });
  renderTabelMenunggu(filtered);
}

function filterRiwayatKembali() {
  const q    = (document.getElementById('search-riwayat')?.value || '').toLowerCase();
  const list = App.data.peminjaman.filter(p => p.status === 'Selesai');
  renderTabelRiwayat(!q ? list : list.filter(p =>
    p.namaPeminjam?.toLowerCase().includes(q) || p.namaBarang?.toLowerCase().includes(q)
  ));
}

// ── Modal Proses Pengembalian ────────────────────────────
function modalProsesKembali(id) {
  const p = App.data.peminjaman.find(p => p.id === id);
  if (!p) return;
  const status      = hitungStatusPeminjaman(p);
  const isTerlambat = status === 'Terlambat';
  const hari        = isTerlambat ? selisihHari(p.batasPengembalian) : 0;

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'modal-kembali';
  modal.innerHTML = `
    <div class="modal" style="max-width:480px">
      <div class="modal-header">
        <div class="modal-title">↩️ Proses Pengembalian</div>
        <button class="modal-close" onclick="tutupModal('modal-kembali')">✕</button>
      </div>
      <div class="modal-body">

        <!-- Ringkasan pinjaman -->
        <div style="background:#F4F3EF;border-radius:10px;padding:1rem;margin-bottom:1.25rem">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
            <div><span style="color:#6B6B6B">Peminjam:</span> <strong>${p.namaPeminjam}</strong></div>
            <div><span style="color:#6B6B6B">Jabatan:</span> ${p.jabatan||'—'}</div>
            <div><span style="color:#6B6B6B">Barang:</span> <strong>${p.namaBarang}</strong></div>
            <div><span style="color:#6B6B6B">Jumlah:</span> ${p.jumlah} ${p.satuan||''}</div>
            <div><span style="color:#6B6B6B">Tgl Pinjam:</span> ${formatTanggal(p.tanggalPinjam)}</div>
            <div><span style="color:#6B6B6B">Batas:</span>
              <span style="${isTerlambat?'color:#DC2626;font-weight:600':''}">${formatTanggal(p.batasPengembalian)}</span>
            </div>
          </div>
          ${isTerlambat ? `
            <div style="margin-top:10px;background:#FEF2F2;border-radius:8px;padding:8px 12px;font-size:13px;color:#991B1B">
              ⚠️ Terlambat <strong>${hari} hari</strong>
            </div>` : ''}
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Tanggal Dikembalikan *</label>
            <input type="date" id="inp-kembali-tgl" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label>Kondisi Barang Kembali *</label>
            <select id="inp-kembali-kondisi">
              <option value="">-- Pilih Kondisi --</option>
              <option value="Baik">Baik</option>
              <option value="Cukup">Cukup</option>
              <option value="Rusak">Rusak</option>
              <option value="Hilang">Hilang</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Catatan Pengembalian</label>
          <textarea id="inp-kembali-catatan" rows="3"
            placeholder="Kondisi detail, kerusakan, kekurangan, dll (opsional)"></textarea>
        </div>

        <div style="background:#EFF6FF;border-radius:8px;padding:10px 14px;font-size:13px;color:#1E40AF">
          ℹ️ Setelah dikembalikan, stok barang akan otomatis bertambah kembali.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="tutupModal('modal-kembali')">Batal</button>
        <button class="btn btn-primary" id="btn-konfirm-kembali" style="background:#16A34A"
          onclick="konfirmasiPengembalian('${p.id}')">
          ✅ Konfirmasi Pengembalian
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function konfirmasiPengembalian(id) {
  const tglKembali = document.getElementById('inp-kembali-tgl')?.value;
  const kondisi    = document.getElementById('inp-kembali-kondisi')?.value;
  const catatan    = document.getElementById('inp-kembali-catatan')?.value.trim();

  if (!tglKembali) { alert('Tanggal pengembalian wajib diisi!'); return; }
  if (!kondisi)    { alert('Pilih kondisi barang!'); return; }

  const btn = document.getElementById('btn-konfirm-kembali');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Menyimpan...'; }

  try {
    const idxPinjam = App.data.peminjaman.findIndex(p => p.id === id);
    if (idxPinjam === -1) throw new Error('Data tidak ditemukan');

    const pinjaman = App.data.peminjaman[idxPinjam];

    // 1. Update data peminjaman
    App.data.peminjaman[idxPinjam] = {
      ...pinjaman,
      status:         'Selesai',
      tanggalKembali: tglKembali,
      kondisiKembali: kondisi,
      catatanKembali: catatan,
      petugasKembali: Auth.getUser()?.name || '',
    };

    // 2. Kembalikan stok barang
    const idxBarang = App.data.barang.findIndex(b => b.id === pinjaman.barangId);
    const stokLama  = idxBarang !== -1 ? App.data.barang[idxBarang].stok : 0;
    if (idxBarang !== -1) {
      App.data.barang[idxBarang].stok      += pinjaman.jumlah;
      App.data.barang[idxBarang].kondisi    = kondisi;
      App.data.barang[idxBarang].updatedAt  = new Date().toISOString();
    }

    // 3. Catat sebagai barang masuk di transaksi
    App.data.transaksi.push({
      id:          generateId('trx'),
      jenis:       'masuk',
      barangId:    pinjaman.barangId,
      namaBarang:  pinjaman.namaBarang,
      satuan:      pinjaman.satuan || '',
      jumlah:      pinjaman.jumlah,
      stokSebelum: stokLama,
      stokSesudah: stokLama + pinjaman.jumlah,
      tanggal:     tglKembali,
      sumber:      `Pengembalian dari ${pinjaman.namaPeminjam}`,
      keterangan:  `Ref Peminjaman: ${id} · Kondisi: ${kondisi}`,
      petugas:     Auth.getUser()?.name || '',
      createdAt:   new Date().toISOString(),
    });

    // 4. Simpan semua
    await Promise.all([
      Drive.writeJSON(CONFIG.FILES.PEMINJAMAN, App.data.peminjaman),
      Drive.writeJSON(CONFIG.FILES.BARANG,     App.data.barang),
      Drive.writeJSON(CONFIG.FILES.TRANSAKSI,  App.data.transaksi),
    ]);

    tutupModal('modal-kembali');
    checkTerlambat();
    Toast.success(`Pengembalian "${pinjaman.namaBarang}" berhasil dikonfirmasi!`);
    await renderPengembalian();

  } catch (err) {
    console.error('konfirmasiPengembalian error:', err);
    Toast.error('Gagal memproses pengembalian.');
    if (btn) { btn.disabled = false; btn.textContent = '✅ Konfirmasi'; }
  }
}
