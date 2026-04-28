// ============================================================
//  RuangInvent — transaksi.js
//  Barang Masuk & Keluar + update stok otomatis + riwayat
// ============================================================

async function renderTransaksi() {
  if (Auth.isOperator()) {
    document.getElementById('topbar-actions').innerHTML = `
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="modalTambahTransaksi('masuk')" style="background:#16A34A">
          📥 Barang Masuk
        </button>
        <button class="btn btn-primary" onclick="modalTambahTransaksi('keluar')" style="background:#DC2626">
          📤 Barang Keluar
        </button>
      </div>`;
  }

  const container = document.getElementById('page-container');
  container.innerHTML = `
    <!-- Ringkasan Statistik Transaksi -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;padding:1.25rem;border-bottom:1px solid #E2E0DA">
      ${renderStatTransaksi()}
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-input" style="flex:1;min-width:180px">
        <input type="text" id="search-trx" placeholder="Cari barang atau keterangan..." oninput="filterTransaksi()" style="padding-left:34px">
      </div>
      <select class="filter-select" id="filter-trx-jenis" onchange="filterTransaksi()">
        <option value="">Semua Jenis</option>
        <option value="masuk">Barang Masuk</option>
        <option value="keluar">Barang Keluar</option>
      </select>
      <select class="filter-select" id="filter-trx-bulan" onchange="filterTransaksi()">
        <option value="">Semua Bulan</option>
        ${generateOpsibulan()}
      </select>
    </div>

    <!-- Tabel -->
    <div style="overflow-x:auto">
      <table class="data-table" id="tabel-transaksi">
        <thead>
          <tr>
            <th>#</th>
            <th>Tanggal</th>
            <th>Jenis</th>
            <th>Nama Barang</th>
            <th>Jumlah</th>
            <th>Stok Sebelum</th>
            <th>Stok Sesudah</th>
            <th>Sumber / Tujuan</th>
            <th>Keterangan</th>
            <th>Petugas</th>
          </tr>
        </thead>
        <tbody id="tbody-transaksi"></tbody>
      </table>
    </div>
    <div style="padding:0.75rem 1.25rem;border-top:1px solid #E2E0DA;font-size:12px;color:#6B6B6B">
      Menampilkan <span id="info-jml-trx">0</span> transaksi
    </div>`;

  renderTabelTransaksi(App.data.transaksi);
}

// ── Statistik ringkas di atas tabel ─────────────────────
function renderStatTransaksi() {
  const trx       = App.data.transaksi;
  const totalMasuk  = trx.filter(t => t.jenis === 'masuk').reduce((s, t) => s + (t.jumlah || 0), 0);
  const totalKeluar = trx.filter(t => t.jenis === 'keluar').reduce((s, t) => s + (t.jumlah || 0), 0);

  // Bulan ini
  const now   = new Date();
  const bulanIni = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const masukBulanIni  = trx.filter(t => t.jenis === 'masuk'  && t.tanggal?.startsWith(bulanIni)).reduce((s,t) => s+(t.jumlah||0),0);
  const keluarBulanIni = trx.filter(t => t.jenis === 'keluar' && t.tanggal?.startsWith(bulanIni)).reduce((s,t) => s+(t.jumlah||0),0);

  return [
    { icon:'📥', label:'Total Masuk',       val: totalMasuk,     bg:'#F0FDF4', color:'#166534' },
    { icon:'📤', label:'Total Keluar',      val: totalKeluar,    bg:'#FEF2F2', color:'#991B1B' },
    { icon:'📅', label:'Masuk Bulan Ini',   val: masukBulanIni,  bg:'#EFF6FF', color:'#1E40AF' },
    { icon:'📅', label:'Keluar Bulan Ini',  val: keluarBulanIni, bg:'#FFFBEB', color:'#92400E' },
  ].map(s => `
    <div style="background:${s.bg};border-radius:10px;padding:1rem;display:flex;align-items:center;gap:10px">
      <span style="font-size:22px">${s.icon}</span>
      <div>
        <div style="font-size:20px;font-weight:700;color:${s.color}">${s.val}</div>
        <div style="font-size:11px;color:${s.color};opacity:0.8">${s.label}</div>
      </div>
    </div>
  `).join('');
}

// ── Opsi bulan untuk filter ──────────────────────────────
function generateOpsibulan() {
  const bulanSet = new Set(App.data.transaksi.map(t => t.tanggal?.substring(0,7)).filter(Boolean));
  return [...bulanSet].sort().reverse().map(b => {
    const [y, m] = b.split('-');
    const label = new Date(y, m-1).toLocaleDateString('id-ID', { month:'long', year:'numeric' });
    return `<option value="${b}">${label}</option>`;
  }).join('');
}

// ── Render tabel transaksi ───────────────────────────────
function renderTabelTransaksi(list) {
  const tbody = document.getElementById('tbody-transaksi');
  const info  = document.getElementById('info-jml-trx');
  if (!tbody) return;
  if (info) info.textContent = list.length;

  // Urutkan terbaru dulu
  const sorted = [...list].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state">
      <div class="icon">🔄</div>
      <div class="title">Belum ada transaksi</div>
      <div class="desc">Catat barang masuk atau keluar menggunakan tombol di atas</div>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map((t, i) => `
    <tr>
      <td style="color:#6B6B6B">${i+1}</td>
      <td style="white-space:nowrap">${formatTanggal(t.tanggal)}</td>
      <td>
        <span class="badge badge-${t.jenis}">
          ${t.jenis === 'masuk' ? '📥 Masuk' : '📤 Keluar'}
        </span>
      </td>
      <td>
        <div style="font-weight:500">${t.namaBarang}</div>
        <div style="font-size:11px;color:#6B6B6B">${t.barangId}</div>
      </td>
      <td style="font-weight:600;color:${t.jenis==='masuk'?'#16A34A':'#DC2626'}">
        ${t.jenis==='masuk'?'+':'−'}${t.jumlah} ${t.satuan||''}
      </td>
      <td style="color:#6B6B6B">${t.stokSebelum ?? '—'}</td>
      <td style="font-weight:500">${t.stokSesudah ?? '—'}</td>
      <td style="color:#6B6B6B">${t.sumber || '—'}</td>
      <td style="color:#6B6B6B;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${t.keterangan||''}">${t.keterangan || '—'}</td>
      <td style="color:#6B6B6B;font-size:12px">${t.petugas || '—'}</td>
    </tr>
  `).join('');
}

// ── Filter transaksi ─────────────────────────────────────
function filterTransaksi() {
  const q     = (document.getElementById('search-trx')?.value || '').toLowerCase();
  const jenis = document.getElementById('filter-trx-jenis')?.value || '';
  const bulan = document.getElementById('filter-trx-bulan')?.value || '';

  const filtered = App.data.transaksi.filter(t => {
    const matchQ  = !q     || t.namaBarang?.toLowerCase().includes(q) || t.keterangan?.toLowerCase().includes(q);
    const matchJ  = !jenis || t.jenis === jenis;
    const matchB  = !bulan || t.tanggal?.startsWith(bulan);
    return matchQ && matchJ && matchB;
  });
  renderTabelTransaksi(filtered);
}

// ── Modal Tambah Transaksi ───────────────────────────────
function modalTambahTransaksi(jenis) {
  const ismasuk = jenis === 'masuk';
  const barangOptions = App.data.barang
    .map(b => `<option value="${b.id}" data-stok="${b.stok}" data-satuan="${b.satuan||''}" data-nama="${b.nama}">${b.nama} (Stok: ${b.stok} ${b.satuan||''})</option>`)
    .join('');

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'modal-transaksi';
  modal.innerHTML = `
    <div class="modal" style="max-width:500px">
      <div class="modal-header">
        <div class="modal-title" style="color:${ismasuk?'#16A34A':'#DC2626'}">
          ${ismasuk ? '📥 Catat Barang Masuk' : '📤 Catat Barang Keluar'}
        </div>
        <button class="modal-close" onclick="tutupModal('modal-transaksi')">✕</button>
      </div>
      <div class="modal-body">

        <div class="form-group">
          <label>Pilih Barang *</label>
          <select id="inp-trx-barang" onchange="onPilihBarangTrx()">
            <option value="">-- Pilih Barang --</option>
            ${barangOptions}
          </select>
        </div>

        <!-- Info stok saat ini -->
        <div id="info-stok-saat-ini" style="display:none;background:#F4F3EF;border-radius:8px;padding:10px 14px;margin-bottom:1rem;font-size:13px">
          Stok saat ini: <strong id="val-stok-sekarang">0</strong> <span id="val-satuan-trx"></span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Jumlah *</label>
            <input type="number" id="inp-trx-jumlah" min="1" placeholder="0" oninput="hitungPreviewStok()">
          </div>
          <div class="form-group">
            <label>Tanggal *</label>
            <input type="date" id="inp-trx-tanggal" value="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>

        <!-- Preview stok sesudah -->
        <div id="preview-stok" style="display:none;border-radius:8px;padding:10px 14px;margin-bottom:1rem;font-size:13px;text-align:center">
          Stok setelah transaksi: <strong id="val-stok-sesudah" style="font-size:16px">—</strong>
        </div>

        <div class="form-group">
          <label>${ismasuk ? 'Sumber / Asal Barang' : 'Tujuan / Digunakan Untuk'}</label>
          <input type="text" id="inp-trx-sumber" placeholder="${ismasuk ? 'Contoh: Pembelian baru, Donasi, Hibah...' : 'Contoh: Kegiatan OSIS, Renovasi kelas...'}">
        </div>

        <div class="form-group">
          <label>Keterangan Tambahan</label>
          <textarea id="inp-trx-ket" rows="2" placeholder="Informasi tambahan (opsional)"></textarea>
        </div>

        <input type="hidden" id="inp-trx-jenis" value="${jenis}">
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="tutupModal('modal-transaksi')">Batal</button>
        <button class="btn btn-primary" id="btn-simpan-trx"
          style="background:${ismasuk?'#16A34A':'#DC2626'}"
          onclick="simpanTransaksi()">
          ${ismasuk ? '📥 Simpan Barang Masuk' : '📤 Simpan Barang Keluar'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

// ── Update info stok saat barang dipilih ─────────────────
function onPilihBarangTrx() {
  const sel    = document.getElementById('inp-trx-barang');
  const opt    = sel?.options[sel.selectedIndex];
  const stok   = parseInt(opt?.dataset.stok) || 0;
  const satuan = opt?.dataset.satuan || '';

  const infoBox = document.getElementById('info-stok-saat-ini');
  if (infoBox) {
    infoBox.style.display = 'block';
    document.getElementById('val-stok-sekarang').textContent = stok;
    document.getElementById('val-satuan-trx').textContent = satuan;
  }

  // Reset preview
  const previewBox = document.getElementById('preview-stok');
  if (previewBox) previewBox.style.display = 'none';
}

// ── Hitung preview stok sesudah transaksi ────────────────
function hitungPreviewStok() {
  const sel    = document.getElementById('inp-trx-barang');
  const opt    = sel?.options[sel.selectedIndex];
  const stok   = parseInt(opt?.dataset.stok) || 0;
  const jumlah = parseInt(document.getElementById('inp-trx-jumlah')?.value) || 0;
  const jenis  = document.getElementById('inp-trx-jenis')?.value;

  const previewBox = document.getElementById('preview-stok');
  const valEl      = document.getElementById('val-stok-sesudah');
  if (!previewBox || !valEl || jumlah <= 0 || !sel?.value) return;

  const stokBaru = jenis === 'masuk' ? stok + jumlah : stok - jumlah;
  previewBox.style.display = 'block';
  previewBox.style.background = stokBaru < 0 ? '#FEF2F2' : '#F0FDF4';
  valEl.textContent = stokBaru;
  valEl.style.color = stokBaru < 0 ? '#DC2626' : '#16A34A';

  if (stokBaru < 0) {
    previewBox.innerHTML += `<div style="font-size:11px;color:#DC2626;margin-top:4px">⚠️ Stok tidak mencukupi!</div>`;
  }
}

// ── Simpan transaksi & update stok barang ────────────────
async function simpanTransaksi() {
  const sel      = document.getElementById('inp-trx-barang');
  const opt      = sel?.options[sel.selectedIndex];
  const barangId = sel?.value;
  const namaBarang = opt?.dataset.nama || '';
  const jumlah   = parseInt(document.getElementById('inp-trx-jumlah')?.value) || 0;
  const tanggal  = document.getElementById('inp-trx-tanggal')?.value;
  const jenis    = document.getElementById('inp-trx-jenis')?.value;
  const sumber   = document.getElementById('inp-trx-sumber')?.value.trim();
  const ket      = document.getElementById('inp-trx-ket')?.value.trim();

  // Validasi
  if (!barangId)   { alert('Pilih barang terlebih dahulu!'); return; }
  if (jumlah <= 0) { alert('Jumlah harus lebih dari 0!'); return; }
  if (!tanggal)    { alert('Tanggal wajib diisi!'); return; }

  // Cek stok untuk barang keluar
  const barang = App.data.barang.find(b => b.id === barangId);
  if (!barang) { alert('Barang tidak ditemukan!'); return; }

  if (jenis === 'keluar' && jumlah > barang.stok) {
    alert(`Stok tidak mencukupi!\n\nStok tersedia: ${barang.stok} ${barang.satuan||''}\nJumlah keluar: ${jumlah}`);
    return;
  }

  const btn = document.getElementById('btn-simpan-trx');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Menyimpan...'; }

  try {
    const stokSebelum = barang.stok;
    const stokSesudah = jenis === 'masuk' ? stokSebelum + jumlah : stokSebelum - jumlah;

    // 1. Catat transaksi
    const trx = {
      id:          generateId('trx'),
      jenis,
      barangId,
      namaBarang:  barang.nama,
      satuan:      barang.satuan || '',
      jumlah,
      stokSebelum,
      stokSesudah,
      tanggal,
      sumber:      sumber || '',
      keterangan:  ket    || '',
      petugas:     Auth.getUser()?.name || '',
      createdAt:   new Date().toISOString(),
    };
    App.data.transaksi.push(trx);

    // 2. Update stok barang
    const idxBarang = App.data.barang.findIndex(b => b.id === barangId);
    if (idxBarang !== -1) {
      App.data.barang[idxBarang].stok = stokSesudah;
      App.data.barang[idxBarang].updatedAt = new Date().toISOString();
    }

    // 3. Simpan ke Drive (paralel)
    await Promise.all([
      Drive.writeJSON(CONFIG.FILES.TRANSAKSI, App.data.transaksi),
      Drive.writeJSON(CONFIG.FILES.BARANG,    App.data.barang),
    ]);

    tutupModal('modal-transaksi');
    Toast.success(`Barang ${jenis === 'masuk' ? 'masuk' : 'keluar'} berhasil dicatat! Stok diperbarui: ${stokSesudah}`);
    await renderTransaksi();

  } catch (err) {
    console.error('simpanTransaksi error:', err);
    Toast.error('Gagal menyimpan transaksi. Coba lagi.');
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan'; }
  }
}
