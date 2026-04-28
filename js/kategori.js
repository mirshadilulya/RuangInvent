// ============================================================
//  RuangInvent — kategori.js
//  Manajemen Kategori Barang
// ============================================================

async function renderKategori() {
  if (Auth.isOperator()) {
    document.getElementById('topbar-actions').innerHTML = `
      <button class="btn btn-primary" onclick="modalTambahKategori()">➕ Tambah Kategori</button>`;
  }

  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="toolbar">
      <div class="search-input" style="flex:1;min-width:180px">
        <input type="text" id="search-kategori" placeholder="Cari kategori..." oninput="filterKategori()" style="padding-left:34px">
      </div>
    </div>
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nama Kategori</th>
            <th>Deskripsi</th>
            <th>Jumlah Barang</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody id="tbody-kategori"></tbody>
      </table>
    </div>
    <div style="padding:0.75rem 1.25rem;border-top:1px solid #E2E0DA;font-size:12px;color:#6B6B6B">
      Total: <span id="info-jml-kat">0</span> kategori
    </div>`;

  renderTabelKategori(App.data.kategori);
}

function renderTabelKategori(list) {
  const tbody = document.getElementById('tbody-kategori');
  const info  = document.getElementById('info-jml-kat');
  if (!tbody) return;
  if (info) info.textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">
      <div class="icon">🏷️</div>
      <div class="title">Belum ada kategori</div>
      <div class="desc">Tambahkan kategori untuk mengelompokkan barang</div>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((k, i) => {
    const jumlah = App.data.barang.filter(b => b.kategori === k.nama).length;
    return `<tr>
      <td style="color:#6B6B6B">${i + 1}</td>
      <td><div style="font-weight:500">${k.nama}</div></td>
      <td style="color:#6B6B6B">${k.deskripsi || '—'}</td>
      <td><span style="font-weight:600">${jumlah}</span> barang</td>
      <td>
        <div style="display:flex;gap:4px">
          ${Auth.isOperator() ? `
            <button class="action-btn action-btn-edit" onclick="modalEditKategori('${k.id}')">✏️</button>
            <button class="action-btn action-btn-delete" onclick="hapusKategori('${k.id}')">🗑️</button>
          ` : '—'}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterKategori() {
  const q = (document.getElementById('search-kategori')?.value || '').toLowerCase();
  renderTabelKategori(App.data.kategori.filter(k => k.nama.toLowerCase().includes(q)));
}

function modalTambahKategori() { bukaModalKategori(null); }
function modalEditKategori(id) {
  bukaModalKategori(App.data.kategori.find(k => k.id === id));
}

function bukaModalKategori(kat) {
  const isEdit = !!kat;
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'modal-kategori';
  modal.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-header">
        <div class="modal-title">${isEdit ? '✏️ Edit Kategori' : '➕ Tambah Kategori'}</div>
        <button class="modal-close" onclick="tutupModal('modal-kategori')">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Nama Kategori *</label>
          <input type="text" id="inp-kat-nama" value="${kat?.nama || ''}" placeholder="Contoh: Furniture, Elektronik...">
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea id="inp-kat-desc" rows="3" placeholder="Keterangan kategori (opsional)">${kat?.deskripsi || ''}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="tutupModal('modal-kategori')">Batal</button>
        <button class="btn btn-primary" id="btn-simpan-kat" onclick="simpanKategori('${kat?.id || ''}')">
          ${isEdit ? '💾 Simpan' : '➕ Tambah'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function simpanKategori(idLama) {
  const nama = document.getElementById('inp-kat-nama')?.value.trim();
  const desc = document.getElementById('inp-kat-desc')?.value.trim();
  if (!nama) { alert('Nama kategori wajib diisi!'); return; }

  const btn = document.getElementById('btn-simpan-kat');
  if (btn) btn.disabled = true;

  try {
    if (idLama) {
      const idx = App.data.kategori.findIndex(k => k.id === idLama);
      if (idx !== -1) { App.data.kategori[idx].nama = nama; App.data.kategori[idx].deskripsi = desc; }
    } else {
      App.data.kategori.push({ id: generateId('kat'), nama, deskripsi: desc, createdAt: new Date().toISOString() });
    }
    await Drive.writeJSON(CONFIG.FILES.KATEGORI, App.data.kategori);
    tutupModal('modal-kategori');
    Toast.success(idLama ? 'Kategori diperbarui!' : 'Kategori ditambahkan!');
    await renderKategori();
  } catch (err) {
    Toast.error('Gagal menyimpan kategori.');
    if (btn) btn.disabled = false;
  }
}

async function hapusKategori(id) {
  const kat = App.data.kategori.find(k => k.id === id);
  if (!kat) return;
  const dipakai = App.data.barang.filter(b => b.kategori === kat.nama).length;
  if (dipakai > 0) {
    alert(`Kategori "${kat.nama}" digunakan oleh ${dipakai} barang dan tidak bisa dihapus.\n\nPindahkan barang ke kategori lain terlebih dahulu.`);
    return;
  }
  if (!confirm(`Hapus kategori "${kat.nama}"?`)) return;
  App.data.kategori = App.data.kategori.filter(k => k.id !== id);
  await Drive.writeJSON(CONFIG.FILES.KATEGORI, App.data.kategori);
  Toast.success('Kategori dihapus!');
  await renderKategori();
}
