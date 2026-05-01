// ============================================================
//  RuangInvent — ruangan.js
//  Manajemen Ruangan / Lokasi
// ============================================================

async function renderRuangan() {
  if (Auth.isOperator()) {
    document.getElementById('topbar-actions').innerHTML = `
      <button class="btn btn-primary" onclick="modalTambahRuangan()">➕ Tambah Ruangan</button>`;
  }

  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="toolbar">
      <div class="search-input" style="flex:1;min-width:180px">
        <input type="text" id="search-ruangan" placeholder="Cari ruangan..." oninput="filterRuangan()" style="padding-left:34px">
      </div>
    </div>
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nama Ruangan</th>
            <th>Gedung / Lantai</th>
            <th>Keterangan</th>
            <th>Jumlah Barang</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody id="tbody-ruangan"></tbody>
      </table>
    </div>
    <div style="padding:0.75rem 1.25rem;border-top:1px solid #E2E0DA;font-size:12px;color:#6B6B6B">
      Total: <span id="info-jml-ruang">0</span> ruangan
    </div>`;

  renderTabelRuangan(App.data.ruangan);
}

function renderTabelRuangan(list) {
  const tbody = document.getElementById('tbody-ruangan');
  const info  = document.getElementById('info-jml-ruang');
  if (!tbody) return;
  if (info) info.textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
      <div class="icon">🏫</div>
      <div class="title">Belum ada ruangan</div>
      <div class="desc">Tambahkan ruangan/lokasi penyimpanan barang</div>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((r, i) => {
    const jumlah = App.data.barang.filter(b => b.ruangan === r.nama).length;
    return `<tr>
      <td style="color:#6B6B6B">${i + 1}</td>
      <td><div style="font-weight:500">${r.nama}</div></td>
      <td style="color:#6B6B6B">${r.gedung || '—'}</td>
      <td style="color:#6B6B6B">${r.keterangan || '—'}</td>
      <td><span style="font-weight:600">${jumlah}</span> barang</td>
      <td>
        <div style="display:flex;gap:4px">
          ${Auth.isOperator() ? `
            <button class="action-btn action-btn-edit" onclick="modalEditRuangan('${r.id}')">✏️</button>
            <button class="action-btn action-btn-delete" onclick="hapusRuangan('${r.id}')">🗑️</button>
          ` : '—'}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterRuangan() {
  const q = (document.getElementById('search-ruangan')?.value || '').toLowerCase();
  renderTabelRuangan(App.data.ruangan.filter(r => r.nama.toLowerCase().includes(q)));
}

function modalTambahRuangan() { bukaModalRuangan(null); }
function modalEditRuangan(id) {
  bukaModalRuangan(App.data.ruangan.find(r => r.id === id));
}

function bukaModalRuangan(ruang) {
  const isEdit = !!ruang;
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'modal-ruangan';
  modal.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-header">
        <div class="modal-title">${isEdit ? '✏️ Edit Ruangan' : '➕ Tambah Ruangan'}</div>
        <button class="modal-close" onclick="tutupModal('modal-ruangan')">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Nama Ruangan *</label>
          <input type="text" id="inp-ruang-nama" value="${ruang?.nama || ''}" placeholder="Contoh: Ruang Kelas 7A, Lab IPA...">
        </div>
        <div class="form-group">
          <label>Gedung / Lantai</label>
          <input type="text" id="inp-ruang-gedung" value="${ruang?.gedung || ''}" placeholder="Contoh: Gedung A Lantai 2">
        </div>
        <div class="form-group">
          <label>Keterangan</label>
          <textarea id="inp-ruang-ket" rows="3" placeholder="Informasi tambahan (opsional)">${ruang?.keterangan || ''}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="tutupModal('modal-ruangan')">Batal</button>
        <button class="btn btn-primary" id="btn-simpan-ruang" onclick="simpanRuangan('${ruang?.id || ''}')">
          ${isEdit ? '💾 Simpan' : '➕ Tambah'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function simpanRuangan(idLama) {
  const nama    = document.getElementById('inp-ruang-nama')?.value.trim();
  const gedung  = document.getElementById('inp-ruang-gedung')?.value.trim();
  const ket     = document.getElementById('inp-ruang-ket')?.value.trim();
  if (!nama) { alert('Nama ruangan wajib diisi!'); return; }

  const btn = document.getElementById('btn-simpan-ruang');
  if (btn) btn.disabled = true;

  try {
    if (idLama) {
      const idx = App.data.ruangan.findIndex(r => r.id === idLama);
      if (idx !== -1) {
        App.data.ruangan[idx].nama = nama;
        App.data.ruangan[idx].gedung = gedung;
        App.data.ruangan[idx].keterangan = ket;
      }
    } else {
      App.data.ruangan.push({ id: generateId('ruang'), nama, gedung, keterangan: ket, createdAt: new Date().toISOString() });
    }
    await Drive.writeJSON(CONFIG.FILES.RUANGAN, App.data.ruangan);
    tutupModal('modal-ruangan');
    Toast.success(idLama ? 'Ruangan diperbarui!' : 'Ruangan ditambahkan!');
    await renderRuangan();
  } catch (err) {
    Toast.error('Gagal menyimpan ruangan.');
    if (btn) btn.disabled = false;
  }
}

async function hapusRuangan(id) {
  const ruang = App.data.ruangan.find(r => r.id === id);
  if (!ruang) return;
  const dipakai = App.data.barang.filter(b => b.ruangan === ruang.nama).length;
  if (dipakai > 0) {
    alert(`Ruangan "${ruang.nama}" memiliki ${dipakai} barang dan tidak bisa dihapus.\n\nPindahkan barang terlebih dahulu.`);
    return;
  }
  if (!confirm(`Hapus ruangan "${ruang.nama}"?`)) return;
  App.data.ruangan = App.data.ruangan.filter(r => r.id !== id);
  await Drive.writeJSON(CONFIG.FILES.RUANGAN, App.data.ruangan);
  Toast.success('Ruangan dihapus!');
  await renderRuangan();
}
