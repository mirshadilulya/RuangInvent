// ============================================================
//  RuangInvent — barang.js
//  Manajemen Barang: CRUD, foto, QR Code, filter
// ============================================================

// ── Render halaman utama Manajemen Barang ────────────────
async function renderBarang() {
  // Tombol tambah di topbar (hanya operator & superadmin)
  if (Auth.isOperator()) {
    document.getElementById('topbar-actions').innerHTML = `
      <button class="btn btn-primary" onclick="modalTambahBarang()">
        ➕ Tambah Barang
      </button>`;
  }

  const container = document.getElementById('page-container');
  container.innerHTML = `
    <!-- Toolbar: search + filter -->
    <div class="toolbar">
      <div class="search-input" style="flex:1;min-width:180px">
        <input type="text" id="search-barang" placeholder="Cari nama barang..."
          oninput="filterBarang()" style="padding-left:34px">
      </div>
      <select class="filter-select" id="filter-kategori" onchange="filterBarang()">
        <option value="">Semua Kategori</option>
      </select>
      <select class="filter-select" id="filter-kondisi" onchange="filterBarang()">
        <option value="">Semua Kondisi</option>
        <option>Baik</option>
        <option>Cukup</option>
        <option>Rusak</option>
        <option>Hilang</option>
      </select>
      <select class="filter-select" id="filter-ruangan" onchange="filterBarang()">
        <option value="">Semua Ruangan</option>
      </select>
    </div>

    <!-- Tabel data -->
    <div style="overflow-x:auto">
      <table class="data-table" id="tabel-barang">
        <thead>
          <tr>
            <th style="width:40px">#</th>
            <th>Foto</th>
            <th>Nama Barang</th>
            <th>Kategori</th>
            <th>Kondisi</th>
            <th>Stok</th>
            <th>Ruangan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody id="tbody-barang">
          <tr><td colspan="8" style="text-align:center;padding:3rem;color:#6B6B6B">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Info jumlah -->
    <div style="padding:0.75rem 1.25rem;border-top:1px solid #E2E0DA;font-size:12px;color:#6B6B6B">
      Menampilkan <span id="info-jumlah">0</span> barang
    </div>
  `;

  // Isi dropdown filter
  populateFilterDropdowns();

  // Render tabel
  renderTabelBarang(App.data.barang);
}

// ── Isi dropdown kategori & ruangan ─────────────────────
function populateFilterDropdowns() {
  const selKat = document.getElementById('filter-kategori');
  const selRuang = document.getElementById('filter-ruangan');
  if (!selKat || !selRuang) return;

  App.data.kategori.forEach(k => {
    selKat.innerHTML += `<option value="${k.nama}">${k.nama}</option>`;
  });
  App.data.ruangan.forEach(r => {
    selRuang.innerHTML += `<option value="${r.nama}">${r.nama}</option>`;
  });
}

// ── Render baris tabel ───────────────────────────────────
function renderTabelBarang(list) {
  const tbody = document.getElementById('tbody-barang');
  const info  = document.getElementById('info-jumlah');
  if (!tbody) return;

  if (info) info.textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="empty-state">
          <div class="icon">📦</div>
          <div class="title">Belum ada barang</div>
          <div class="desc">Klik "Tambah Barang" untuk menambahkan barang pertama</div>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((b, i) => `
    <tr>
      <td style="color:#6B6B6B">${i + 1}</td>
      <td>
        ${b.foto
          ? `<img src="${b.foto}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;border:1px solid #E2E0DA" onerror="this.style.display='none'">`
          : `<div style="width:40px;height:40px;border-radius:8px;background:#F4F3EF;display:flex;align-items:center;justify-content:center;font-size:18px">📦</div>`
        }
      </td>
      <td>
        <div style="font-weight:500">${b.nama}</div>
        <div style="font-size:11px;color:#6B6B6B">ID: ${b.id}</div>
      </td>
      <td>${b.kategori || '—'}</td>
      <td><span class="badge badge-${(b.kondisi||'').toLowerCase()}">${b.kondisi || '—'}</span></td>
      <td><strong>${b.stok ?? 0}</strong> ${b.satuan || ''}</td>
      <td>${b.ruangan || '—'}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="action-btn action-btn-view" title="Detail & QR" onclick="modalDetailBarang('${b.id}')">🔍</button>
          ${Auth.isOperator() ? `
            <button class="action-btn action-btn-edit" title="Edit" onclick="modalEditBarang('${b.id}')">✏️</button>
            <button class="action-btn action-btn-delete" title="Hapus" onclick="hapusBarang('${b.id}')">🗑️</button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Filter barang ────────────────────────────────────────
function filterBarang() {
  const q       = (document.getElementById('search-barang')?.value || '').toLowerCase();
  const kat     = document.getElementById('filter-kategori')?.value || '';
  const kondisi = document.getElementById('filter-kondisi')?.value || '';
  const ruangan = document.getElementById('filter-ruangan')?.value || '';

  const filtered = App.data.barang.filter(b => {
    const matchQ  = !q       || b.nama.toLowerCase().includes(q);
    const matchK  = !kat     || b.kategori === kat;
    const matchKo = !kondisi || b.kondisi  === kondisi;
    const matchR  = !ruangan || b.ruangan  === ruangan;
    return matchQ && matchK && matchKo && matchR;
  });

  renderTabelBarang(filtered);
}

// ── Modal Tambah Barang ──────────────────────────────────
function modalTambahBarang() {
  bukaModalBarang(null);
}

function modalEditBarang(id) {
  const barang = App.data.barang.find(b => b.id === id);
  if (barang) bukaModalBarang(barang);
}

function bukaModalBarang(barang) {
  const isEdit = !!barang;
  const kategoriOptions = App.data.kategori
    .map(k => `<option ${barang?.kategori === k.nama ? 'selected' : ''}>${k.nama}</option>`)
    .join('');
  const ruanganOptions = App.data.ruangan
    .map(r => `<option ${barang?.ruangan === r.nama ? 'selected' : ''}>${r.nama}</option>`)
    .join('');

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'modal-barang';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">${isEdit ? '✏️ Edit Barang' : '➕ Tambah Barang Baru'}</div>
        <button class="modal-close" onclick="tutupModal('modal-barang')">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>Nama Barang *</label>
            <input type="text" id="inp-nama" value="${barang?.nama || ''}" placeholder="Contoh: Kursi Plastik">
          </div>
          <div class="form-group">
            <label>Kode / No. Inventaris</label>
            <input type="text" id="inp-kode" value="${barang?.kode || ''}" placeholder="Opsional">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Kategori *</label>
            <select id="inp-kategori">
              <option value="">-- Pilih Kategori --</option>
              ${kategoriOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Ruangan / Lokasi *</label>
            <select id="inp-ruangan">
              <option value="">-- Pilih Ruangan --</option>
              ${ruanganOptions}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Kondisi *</label>
            <select id="inp-kondisi">
              <option value="">-- Pilih Kondisi --</option>
              ${['Baik','Cukup','Rusak','Hilang'].map(k =>
                `<option ${barang?.kondisi === k ? 'selected' : ''}>${k}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Stok Awal *</label>
            <input type="number" id="inp-stok" value="${barang?.stok ?? ''}" placeholder="0" min="0">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Satuan</label>
            <input type="text" id="inp-satuan" value="${barang?.satuan || ''}" placeholder="Buah, Unit, Set...">
          </div>
          <div class="form-group">
            <label>Tahun Pengadaan</label>
            <input type="number" id="inp-tahun" value="${barang?.tahunPengadaan || ''}" placeholder="2024">
          </div>
        </div>

        <div class="form-group">
          <label>Deskripsi / Keterangan</label>
          <textarea id="inp-deskripsi" rows="2" placeholder="Informasi tambahan tentang barang...">${barang?.deskripsi || ''}</textarea>
        </div>

        <div class="form-group">
          <label>Foto Barang</label>
          <div style="display:flex;align-items:center;gap:12px">
            <div id="preview-foto" style="width:64px;height:64px;border-radius:10px;background:#F4F3EF;border:1px solid #E2E0DA;display:flex;align-items:center;justify-content:center;font-size:28px;overflow:hidden;flex-shrink:0">
              ${barang?.foto ? `<img src="${barang.foto}" style="width:100%;height:100%;object-fit:cover">` : '📷'}
            </div>
            <div style="flex:1">
              <input type="file" id="inp-foto" accept="image/*" onchange="previewFoto(this)" style="font-size:12px">
              <div style="font-size:11px;color:#6B6B6B;margin-top:4px">JPG/PNG, maks 5MB. Foto disimpan di Google Drive.</div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="tutupModal('modal-barang')">Batal</button>
        <button class="btn btn-primary" id="btn-simpan-barang" onclick="simpanBarang('${barang?.id || ''}')">
          ${isEdit ? '💾 Simpan Perubahan' : '➕ Tambah Barang'}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ── Preview foto sebelum upload ──────────────────────────
function previewFoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('preview-foto');
    if (preview) preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
  };
  reader.readAsDataURL(file);
}

// ── Simpan barang (tambah / edit) ────────────────────────
async function simpanBarang(idLama) {
  const nama     = document.getElementById('inp-nama')?.value.trim();
  const kode     = document.getElementById('inp-kode')?.value.trim();
  const kategori = document.getElementById('inp-kategori')?.value;
  const ruangan  = document.getElementById('inp-ruangan')?.value;
  const kondisi  = document.getElementById('inp-kondisi')?.value;
  const stok     = parseInt(document.getElementById('inp-stok')?.value) || 0;
  const satuan   = document.getElementById('inp-satuan')?.value.trim();
  const tahun    = document.getElementById('inp-tahun')?.value.trim();
  const deskripsi= document.getElementById('inp-deskripsi')?.value.trim();
  const fotoFile = document.getElementById('inp-foto')?.files[0];

  // Validasi
  if (!nama)     { alert('Nama barang wajib diisi!'); return; }
  if (!kategori) { alert('Pilih kategori!'); return; }
  if (!ruangan)  { alert('Pilih ruangan!'); return; }
  if (!kondisi)  { alert('Pilih kondisi!'); return; }

  const btn = document.getElementById('btn-simpan-barang');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Menyimpan...'; }

  try {
    // Upload foto kalau ada
    let fotoUrl = null;
    if (fotoFile) {
      const id = idLama || generateId('brg');
      fotoUrl = await Drive.uploadPhoto(fotoFile, id);
    }

    const isEdit = !!idLama;

    if (isEdit) {
      // Update barang yang sudah ada
      const idx = App.data.barang.findIndex(b => b.id === idLama);
      if (idx !== -1) {
        App.data.barang[idx] = {
          ...App.data.barang[idx],
          nama, kode, kategori, ruangan, kondisi, stok, satuan,
          tahunPengadaan: tahun,
          deskripsi,
          foto: fotoUrl || App.data.barang[idx].foto,
          updatedAt: new Date().toISOString(),
        };
      }
    } else {
      // Barang baru
      const id = generateId('brg');
      App.data.barang.push({
        id, nama, kode, kategori, ruangan, kondisi, stok, satuan,
        tahunPengadaan: tahun,
        deskripsi,
        foto: fotoUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Simpan ke Drive
    await Drive.writeJSON(CONFIG.FILES.BARANG, App.data.barang);

    tutupModal('modal-barang');
    Toast.success(isEdit ? 'Barang berhasil diperbarui!' : 'Barang berhasil ditambahkan!');

    // Refresh halaman
    await renderBarang();

  } catch (err) {
    console.error('simpanBarang error:', err);
    Toast.error('Gagal menyimpan barang. Coba lagi.');
    if (btn) { btn.disabled = false; btn.textContent = '💾 Simpan'; }
  }
}

// ── Hapus barang ─────────────────────────────────────────
async function hapusBarang(id) {
  const barang = App.data.barang.find(b => b.id === id);
  if (!barang) return;

  if (!confirm(`Hapus barang "${barang.nama}"?\n\nData yang sudah dihapus tidak bisa dikembalikan.`)) return;

  try {
    App.data.barang = App.data.barang.filter(b => b.id !== id);
    await Drive.writeJSON(CONFIG.FILES.BARANG, App.data.barang);
    Toast.success('Barang berhasil dihapus!');
    await renderBarang();
  } catch (err) {
    console.error('hapusBarang error:', err);
    Toast.error('Gagal menghapus barang.');
  }
}

// ── Modal Detail + QR Code ───────────────────────────────
function modalDetailBarang(id) {
  const b = App.data.barang.find(b => b.id === id);
  if (!b) return;

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'modal-detail';
  modal.innerHTML = `
    <div class="modal" style="max-width:560px">
      <div class="modal-header">
        <div class="modal-title">🔍 Detail Barang</div>
        <button class="modal-close" onclick="tutupModal('modal-detail')">✕</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:1.5rem;flex-wrap:wrap">

          <!-- Kolom kiri: foto + QR -->
          <div style="display:flex;flex-direction:column;gap:12px;align-items:center">
            ${b.foto
              ? `<img src="${b.foto}" style="width:120px;height:120px;border-radius:12px;object-fit:cover;border:1px solid #E2E0DA">`
              : `<div style="width:120px;height:120px;border-radius:12px;background:#F4F3EF;display:flex;align-items:center;justify-content:center;font-size:48px">📦</div>`
            }
            <div>
              <div style="font-size:11px;color:#6B6B6B;text-align:center;margin-bottom:6px">QR Code Barang</div>
              <div id="qr-container" style="background:#fff;padding:8px;border-radius:8px;border:1px solid #E2E0DA;display:inline-block"></div>
            </div>
            <button class="btn btn-ghost" style="font-size:12px;padding:6px 12px" onclick="cetakQR('${b.id}','${b.nama}')">
              🖨️ Cetak QR
            </button>
          </div>

          <!-- Kolom kanan: info -->
          <div style="flex:1;min-width:200px">
            <div style="font-size:18px;font-weight:700;margin-bottom:4px">${b.nama}</div>
            <span class="badge badge-${(b.kondisi||'').toLowerCase()}" style="margin-bottom:1rem;display:inline-block">${b.kondisi}</span>

            <table style="width:100%;font-size:13px;border-collapse:collapse">
              ${[
                ['ID',         b.id],
                ['Kode',       b.kode || '—'],
                ['Kategori',   b.kategori || '—'],
                ['Ruangan',    b.ruangan || '—'],
                ['Stok',       `${b.stok ?? 0} ${b.satuan || ''}`],
                ['Thn. Pengadaan', b.tahunPengadaan || '—'],
                ['Ditambahkan', formatTanggal(b.createdAt)],
                ['Diperbarui', formatTanggal(b.updatedAt)],
              ].map(([k,v]) => `
                <tr>
                  <td style="padding:5px 0;color:#6B6B6B;width:110px">${k}</td>
                  <td style="padding:5px 0;font-weight:500">${v}</td>
                </tr>
              `).join('')}
            </table>

            ${b.deskripsi ? `
              <div style="margin-top:12px;padding:10px;background:#F4F3EF;border-radius:8px;font-size:12px;color:#444">
                ${b.deskripsi}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        ${Auth.isOperator() ? `<button class="btn btn-primary" onclick="tutupModal('modal-detail');modalEditBarang('${b.id}')">✏️ Edit</button>` : ''}
        <button class="btn btn-ghost" onclick="tutupModal('modal-detail')">Tutup</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Generate QR Code setelah modal tampil
  setTimeout(() => generateQR(b.id, b.nama), 100);
}

// ── Generate QR Code ─────────────────────────────────────
function generateQR(id, nama) {
  const container = document.getElementById('qr-container');
  if (!container) return;

  // Data yang diencode di QR: URL langsung ke barang
  const qrData = `${CONFIG.APP_URL}/index.html?barang=${id}`;

  if (typeof QRCode === 'undefined') {
    container.innerHTML = '<div style="font-size:11px;color:#6B6B6B;text-align:center;padding:8px">QR tidak tersedia</div>';
    return;
  }

  new QRCode(container, {
    text: qrData,
    width: 100,
    height: 100,
    colorDark: '#1A3C5E',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M,
  });
}

// ── Cetak QR Code ─────────────────────────────────────────
function cetakQR(id, nama) {
  const qrDiv = document.getElementById('qr-container');
  const img   = qrDiv?.querySelector('img') || qrDiv?.querySelector('canvas');
  if (!img) { Toast.warning('QR Code belum siap.'); return; }

  const src = img.tagName === 'CANVAS' ? img.toDataURL() : img.src;

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>QR - ${nama}</title>
    <style>
      body { font-family: sans-serif; display:flex; flex-direction:column; align-items:center; padding:2rem; }
      img  { width:150px; height:150px; }
      h3   { margin:12px 0 4px; font-size:16px; }
      p    { font-size:12px; color:#666; margin:0; }
    </style></head><body>
    <img src="${src}">
    <h3>${nama}</h3>
    <p>ID: ${id}</p>
    <p>RuangInvent — Inventaris Sekolah</p>
    <script>window.onload=()=>{ window.print(); window.close(); }<\/script>
    </body></html>
  `);
  win.document.close();
}

// ── Tutup modal ──────────────────────────────────────────
function tutupModal(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}
