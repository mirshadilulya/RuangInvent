// ============================================================
//  RuangInvent — laporan.js
//  5 Jenis Laporan + Cetak PDF
// ============================================================

// Jenis laporan yang tersedia
const JENIS_LAPORAN = [
  { id: 'inventaris',  icon: '📦', label: 'Laporan Inventaris',        desc: 'Daftar lengkap semua barang beserta kondisi dan stok' },
  { id: 'masuk',       icon: '📥', label: 'Laporan Barang Masuk',      desc: 'Riwayat semua barang yang masuk dalam periode tertentu' },
  { id: 'keluar',      icon: '📤', label: 'Laporan Barang Keluar',     desc: 'Riwayat semua barang yang keluar dalam periode tertentu' },
  { id: 'peminjaman',  icon: '📋', label: 'Laporan Peminjaman',        desc: 'Daftar semua peminjaman beserta status pengembalian' },
  { id: 'kondisi',     icon: '🔧', label: 'Rekap Kondisi Barang',      desc: 'Ringkasan kondisi seluruh aset sekolah per kategori' },
];

// ── Render halaman pilih laporan ─────────────────────────
async function renderLaporan() {
  document.getElementById('topbar-actions').innerHTML = '';

  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div style="padding:1.5rem">
      <div style="font-size:14px;color:#6B6B6B;margin-bottom:1.5rem">
        Pilih jenis laporan yang ingin dicetak. Semua laporan dapat langsung dicetak sebagai PDF dari browser.
      </div>

      <!-- Kartu pilih laporan -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;margin-bottom:2rem">
        ${JENIS_LAPORAN.map(j => `
          <div onclick="bukaLaporan('${j.id}')"
            style="background:#fff;border:1.5px solid #E2E0DA;border-radius:12px;padding:1.25rem;cursor:pointer;transition:all 0.15s"
            onmouseover="this.style.borderColor='#1A3C5E';this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'"
            onmouseout="this.style.borderColor='#E2E0DA';this.style.transform='';this.style.boxShadow=''">
            <div style="font-size:28px;margin-bottom:10px">${j.icon}</div>
            <div style="font-weight:600;font-size:14px;margin-bottom:4px">${j.label}</div>
            <div style="font-size:12px;color:#6B6B6B;line-height:1.5">${j.desc}</div>
            <div style="margin-top:12px;font-size:12px;color:#1A3C5E;font-weight:500">Buka Laporan →</div>
          </div>
        `).join('')}
      </div>

      <!-- Info cetak -->
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:1rem 1.25rem;font-size:13px;color:#1E40AF">
        <strong>💡 Tips Cetak PDF:</strong> Setelah laporan terbuka, klik tombol "🖨️ Cetak PDF".
        Di dialog cetak browser, pilih <strong>Destination → Save as PDF</strong> untuk menyimpan sebagai file PDF.
      </div>
    </div>`;
}

// ── Buka & render laporan tertentu ───────────────────────
async function bukaLaporan(jenis) {
  const container = document.getElementById('page-container');
  const info      = JENIS_LAPORAN.find(j => j.id === jenis);

  // Tampilkan filter & tombol cetak
  container.innerHTML = `
    <div style="padding:1rem 1.25rem;border-bottom:1px solid #E2E0DA;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <button class="btn btn-ghost" onclick="renderLaporan()" style="font-size:12px">← Kembali</button>
      <div style="font-weight:600;flex:1">${info.icon} ${info.label}</div>
      ${jenis !== 'inventaris' && jenis !== 'kondisi' ? `
        <div style="display:flex;align-items:center;gap:8px;font-size:13px">
          <label style="font-weight:400;color:#6B6B6B;margin:0">Dari:</label>
          <input type="date" id="filter-lap-dari" style="padding:6px 10px;border:1px solid #E2E0DA;border-radius:8px;font-size:13px">
          <label style="font-weight:400;color:#6B6B6B;margin:0">s/d:</label>
          <input type="date" id="filter-lap-sampai" style="padding:6px 10px;border:1px solid #E2E0DA;border-radius:8px;font-size:13px">
          <button class="btn btn-ghost" style="font-size:12px" onclick="refreshLaporan('${jenis}')">Filter</button>
        </div>
      ` : ''}
      <button class="btn btn-primary" onclick="cetakLaporan()">🖨️ Cetak PDF</button>
    </div>
    <div id="isi-laporan" style="padding:1.5rem"></div>`;

  // Set default tanggal filter (bulan ini)
  const tglDari   = document.getElementById('filter-lap-dari');
  const tglSampai = document.getElementById('filter-lap-sampai');
  if (tglDari && tglSampai) {
    const now   = new Date();
    tglDari.value   = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    tglSampai.value = now.toISOString().split('T')[0];
  }

  renderIsiLaporan(jenis);
}

function refreshLaporan(jenis) { renderIsiLaporan(jenis); }

function renderIsiLaporan(jenis) {
  const dari   = document.getElementById('filter-lap-dari')?.value   || '';
  const sampai = document.getElementById('filter-lap-sampai')?.value || '';

  switch (jenis) {
    case 'inventaris': renderLaporanInventaris(); break;
    case 'masuk':      renderLaporanMasukKeluar('masuk',  dari, sampai); break;
    case 'keluar':     renderLaporanMasukKeluar('keluar', dari, sampai); break;
    case 'peminjaman': renderLaporanPeminjaman(dari, sampai); break;
    case 'kondisi':    renderLaporanKondisi(); break;
  }
}

// ── Cetak PDF via window.print() ─────────────────────────
function cetakLaporan() { window.print(); }

// ══════════════════════════════════════════════════════════
//  LAPORAN 1 — INVENTARIS
// ══════════════════════════════════════════════════════════
function renderLaporanInventaris() {
  const el   = document.getElementById('isi-laporan');
  const data = App.data.barang;
  const now  = new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });

  // Hitung ringkasan
  const totalBarang = data.length;
  const totalStok   = data.reduce((s, b) => s + (b.stok || 0), 0);
  const kondisiMap  = { Baik:0, Cukup:0, Rusak:0, Hilang:0 };
  data.forEach(b => { if (kondisiMap[b.kondisi] !== undefined) kondisiMap[b.kondisi]++; });

  el.innerHTML = `
    ${headerCetak('Laporan Inventaris Barang', now)}

    <!-- Ringkasan -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem" class="no-print-gap">
      ${[
        { label:'Total Jenis Barang', val: totalBarang, color:'#1E40AF' },
        { label:'Kondisi Baik',       val: kondisiMap.Baik, color:'#166534' },
        { label:'Kondisi Cukup',      val: kondisiMap.Cukup, color:'#92400E' },
        { label:'Rusak / Hilang',     val: kondisiMap.Rusak + kondisiMap.Hilang, color:'#991B1B' },
      ].map(s => `
        <div style="background:#F4F3EF;border-radius:10px;padding:1rem;text-align:center">
          <div style="font-size:22px;font-weight:700;color:${s.color}">${s.val}</div>
          <div style="font-size:11px;color:#6B6B6B">${s.label}</div>
        </div>`).join('')}
    </div>

    <!-- Tabel -->
    <table class="data-table" style="width:100%">
      <thead>
        <tr>
          <th>#</th>
          <th>Nama Barang</th>
          <th>Kode</th>
          <th>Kategori</th>
          <th>Ruangan</th>
          <th>Kondisi</th>
          <th>Stok</th>
          <th>Satuan</th>
          <th>Thn Pengadaan</th>
        </tr>
      </thead>
      <tbody>
        ${data.length === 0
          ? `<tr><td colspan="9" style="text-align:center;color:#6B6B6B;padding:2rem">Tidak ada data</td></tr>`
          : data.map((b, i) => `
            <tr>
              <td>${i+1}</td>
              <td style="font-weight:500">${b.nama}</td>
              <td style="color:#6B6B6B;font-size:12px">${b.kode||'—'}</td>
              <td>${b.kategori||'—'}</td>
              <td>${b.ruangan||'—'}</td>
              <td><span class="badge badge-${(b.kondisi||'').toLowerCase()}">${b.kondisi||'—'}</span></td>
              <td style="font-weight:600">${b.stok??0}</td>
              <td>${b.satuan||'—'}</td>
              <td>${b.tahunPengadaan||'—'}</td>
            </tr>`).join('')}
      </tbody>
      <tfoot>
        <tr style="background:#F4F3EF;font-weight:600">
          <td colspan="6">Total</td>
          <td>${totalStok}</td>
          <td colspan="2"></td>
        </tr>
      </tfoot>
    </table>
    ${footerCetak()}`;
}

// ══════════════════════════════════════════════════════════
//  LAPORAN 2 & 3 — BARANG MASUK / KELUAR
// ══════════════════════════════════════════════════════════
function renderLaporanMasukKeluar(jenis, dari, sampai) {
  const el    = document.getElementById('isi-laporan');
  const label = jenis === 'masuk' ? 'Barang Masuk' : 'Barang Keluar';
  const now   = new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });

  let data = App.data.transaksi.filter(t => t.jenis === jenis);
  if (dari)   data = data.filter(t => t.tanggal >= dari);
  if (sampai) data = data.filter(t => t.tanggal <= sampai);
  data = [...data].sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal));

  const totalJumlah = data.reduce((s,t) => s + (t.jumlah||0), 0);
  const periodeTeks = dari && sampai
    ? `${formatTanggal(dari)} s/d ${formatTanggal(sampai)}`
    : 'Semua periode';

  el.innerHTML = `
    ${headerCetak(`Laporan ${label}`, now, periodeTeks)}

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem">
      ${[
        { label:`Total Transaksi ${label}`, val: data.length,   color:'#1E40AF' },
        { label:'Total Jumlah Item',        val: totalJumlah,   color: jenis==='masuk'?'#166534':'#991B1B' },
        { label:'Jenis Barang Berbeda',     val: new Set(data.map(t=>t.barangId)).size, color:'#92400E' },
      ].map(s => `
        <div style="background:#F4F3EF;border-radius:10px;padding:1rem;text-align:center">
          <div style="font-size:22px;font-weight:700;color:${s.color}">${s.val}</div>
          <div style="font-size:11px;color:#6B6B6B">${s.label}</div>
        </div>`).join('')}
    </div>

    <table class="data-table" style="width:100%">
      <thead>
        <tr>
          <th>#</th>
          <th>Tanggal</th>
          <th>Nama Barang</th>
          <th>Jumlah</th>
          <th>Satuan</th>
          <th>Stok Sebelum</th>
          <th>Stok Sesudah</th>
          <th>${jenis==='masuk'?'Sumber':'Tujuan'}</th>
          <th>Keterangan</th>
          <th>Petugas</th>
        </tr>
      </thead>
      <tbody>
        ${data.length === 0
          ? `<tr><td colspan="10" style="text-align:center;color:#6B6B6B;padding:2rem">Tidak ada data pada periode ini</td></tr>`
          : data.map((t,i) => `
            <tr>
              <td>${i+1}</td>
              <td style="white-space:nowrap">${formatTanggal(t.tanggal)}</td>
              <td style="font-weight:500">${t.namaBarang}</td>
              <td style="font-weight:600;color:${jenis==='masuk'?'#166534':'#991B1B'}">${t.jumlah}</td>
              <td>${t.satuan||'—'}</td>
              <td style="color:#6B6B6B">${t.stokSebelum??'—'}</td>
              <td style="font-weight:500">${t.stokSesudah??'—'}</td>
              <td style="color:#6B6B6B">${t.sumber||'—'}</td>
              <td style="color:#6B6B6B;font-size:12px">${t.keterangan||'—'}</td>
              <td style="color:#6B6B6B;font-size:12px">${t.petugas||'—'}</td>
            </tr>`).join('')}
      </tbody>
      <tfoot>
        <tr style="background:#F4F3EF;font-weight:600">
          <td colspan="3">Total</td>
          <td>${totalJumlah}</td>
          <td colspan="6"></td>
        </tr>
      </tfoot>
    </table>
    ${footerCetak()}`;
}

// ══════════════════════════════════════════════════════════
//  LAPORAN 4 — PEMINJAMAN
// ══════════════════════════════════════════════════════════
function renderLaporanPeminjaman(dari, sampai) {
  const el  = document.getElementById('isi-laporan');
  const now = new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });

  let data = [...App.data.peminjaman];
  if (dari)   data = data.filter(p => p.tanggalPinjam >= dari);
  if (sampai) data = data.filter(p => p.tanggalPinjam <= sampai);
  data = data.sort((a,b) => new Date(a.tanggalPinjam) - new Date(b.tanggalPinjam));

  const aktif     = data.filter(p => p.status === 'Aktif').length;
  const terlambat = data.filter(p => p.status === 'Terlambat').length;
  const selesai   = data.filter(p => p.status === 'Selesai').length;
  const periodeTeks = dari && sampai
    ? `${formatTanggal(dari)} s/d ${formatTanggal(sampai)}`
    : 'Semua periode';

  el.innerHTML = `
    ${headerCetak('Laporan Peminjaman Barang', now, periodeTeks)}

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem">
      ${[
        { label:'Total Peminjaman', val: data.length, color:'#1E40AF' },
        { label:'Aktif',            val: aktif,       color:'#166534' },
        { label:'Terlambat',        val: terlambat,   color:'#991B1B' },
        { label:'Selesai',          val: selesai,     color:'#444441' },
      ].map(s => `
        <div style="background:#F4F3EF;border-radius:10px;padding:1rem;text-align:center">
          <div style="font-size:22px;font-weight:700;color:${s.color}">${s.val}</div>
          <div style="font-size:11px;color:#6B6B6B">${s.label}</div>
        </div>`).join('')}
    </div>

    <table class="data-table" style="width:100%">
      <thead>
        <tr>
          <th>#</th>
          <th>Tgl Pinjam</th>
          <th>Peminjam</th>
          <th>Jabatan</th>
          <th>Barang</th>
          <th>Jml</th>
          <th>Batas Kembali</th>
          <th>Tgl Kembali</th>
          <th>Kondisi Kembali</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.length === 0
          ? `<tr><td colspan="10" style="text-align:center;color:#6B6B6B;padding:2rem">Tidak ada data pada periode ini</td></tr>`
          : data.map((p,i) => `
            <tr>
              <td>${i+1}</td>
              <td style="white-space:nowrap">${formatTanggal(p.tanggalPinjam)}</td>
              <td style="font-weight:500">${p.namaPeminjam}</td>
              <td style="color:#6B6B6B">${p.jabatan||'—'}</td>
              <td style="font-weight:500">${p.namaBarang}</td>
              <td>${p.jumlah} ${p.satuan||''}</td>
              <td style="white-space:nowrap">${formatTanggal(p.batasPengembalian)}</td>
              <td style="white-space:nowrap;color:#16A34A">${p.tanggalKembali ? formatTanggal(p.tanggalKembali) : '—'}</td>
              <td>${p.kondisiKembali||'—'}</td>
              <td><span class="badge badge-${(p.status||'').toLowerCase()}">${p.status}</span></td>
            </tr>`).join('')}
      </tbody>
    </table>
    ${footerCetak()}`;
}

// ══════════════════════════════════════════════════════════
//  LAPORAN 5 — REKAP KONDISI
// ══════════════════════════════════════════════════════════
function renderLaporanKondisi() {
  const el   = document.getElementById('isi-laporan');
  const data = App.data.barang;
  const now  = new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });

  // Rekap per kategori
  const kategoriMap = {};
  data.forEach(b => {
    const kat = b.kategori || 'Tanpa Kategori';
    if (!kategoriMap[kat]) kategoriMap[kat] = { Baik:0, Cukup:0, Rusak:0, Hilang:0, total:0, stok:0 };
    kategoriMap[kat][b.kondisi] = (kategoriMap[kat][b.kondisi] || 0) + 1;
    kategoriMap[kat].total++;
    kategoriMap[kat].stok += (b.stok || 0);
  });

  // Rekap per ruangan
  const ruanganMap = {};
  data.forEach(b => {
    const ruang = b.ruangan || 'Tanpa Ruangan';
    if (!ruanganMap[ruang]) ruanganMap[ruang] = { total:0, stok:0 };
    ruanganMap[ruang].total++;
    ruanganMap[ruang].stok += (b.stok || 0);
  });

  const totalBaik   = data.filter(b => b.kondisi === 'Baik').length;
  const totalCukup  = data.filter(b => b.kondisi === 'Cukup').length;
  const totalRusak  = data.filter(b => b.kondisi === 'Rusak').length;
  const totalHilang = data.filter(b => b.kondisi === 'Hilang').length;
  const total       = data.length;
  const pctBaik     = total > 0 ? Math.round((totalBaik/total)*100) : 0;

  el.innerHTML = `
    ${headerCetak('Rekap Kondisi Barang', now)}

    <!-- Ringkasan kondisi -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem">
      ${[
        { label:'Baik',   val: totalBaik,   pct: total>0?Math.round(totalBaik/total*100):0,   bg:'#F0FDF4', color:'#166534' },
        { label:'Cukup',  val: totalCukup,  pct: total>0?Math.round(totalCukup/total*100):0,  bg:'#FFFBEB', color:'#92400E' },
        { label:'Rusak',  val: totalRusak,  pct: total>0?Math.round(totalRusak/total*100):0,  bg:'#FEF2F2', color:'#991B1B' },
        { label:'Hilang', val: totalHilang, pct: total>0?Math.round(totalHilang/total*100):0, bg:'#F3F4F6', color:'#374151' },
      ].map(s => `
        <div style="background:${s.bg};border-radius:10px;padding:1rem;text-align:center">
          <div style="font-size:26px;font-weight:700;color:${s.color}">${s.val}</div>
          <div style="font-size:20px;font-weight:500;color:${s.color};opacity:0.7">${s.pct}%</div>
          <div style="font-size:11px;color:${s.color};opacity:0.8">Kondisi ${s.label}</div>
        </div>`).join('')}
    </div>

    <!-- Indikator kesehatan aset -->
    <div style="background:#F4F3EF;border-radius:10px;padding:1rem 1.25rem;margin-bottom:1.5rem;display:flex;align-items:center;gap:16px">
      <div>
        <div style="font-size:13px;font-weight:600;margin-bottom:6px">Indikator Kesehatan Aset</div>
        <div style="background:#E2E0DA;border-radius:100px;height:10px;width:300px;max-width:100%;overflow:hidden">
          <div style="background:#16A34A;height:100%;width:${pctBaik}%;border-radius:100px;transition:width 0.5s"></div>
        </div>
        <div style="font-size:12px;color:#6B6B6B;margin-top:6px">${pctBaik}% aset dalam kondisi baik</div>
      </div>
      <div style="font-size:36px;font-weight:700;color:${pctBaik>=80?'#16A34A':pctBaik>=60?'#D97706':'#DC2626'}">
        ${pctBaik>=80?'🟢':pctBaik>=60?'🟡':'🔴'}
      </div>
    </div>

    <!-- Rekap per kategori -->
    <div style="font-weight:600;font-size:14px;margin-bottom:10px">Rekap per Kategori</div>
    <table class="data-table" style="width:100%;margin-bottom:1.5rem">
      <thead>
        <tr>
          <th>Kategori</th>
          <th>Total Jenis</th>
          <th>Total Stok</th>
          <th>Baik</th>
          <th>Cukup</th>
          <th>Rusak</th>
          <th>Hilang</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(kategoriMap).map(([kat, v]) => `
          <tr>
            <td style="font-weight:500">${kat}</td>
            <td>${v.total}</td>
            <td style="font-weight:600">${v.stok}</td>
            <td style="color:#16A34A;font-weight:500">${v.Baik||0}</td>
            <td style="color:#D97706">${v.Cukup||0}</td>
            <td style="color:#DC2626">${v.Rusak||0}</td>
            <td style="color:#374151">${v.Hilang||0}</td>
          </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:#6B6B6B">Tidak ada data</td></tr>'}
      </tbody>
    </table>

    <!-- Rekap per ruangan -->
    <div style="font-weight:600;font-size:14px;margin-bottom:10px">Rekap per Ruangan</div>
    <table class="data-table" style="width:100%">
      <thead>
        <tr>
          <th>Ruangan</th>
          <th>Jumlah Jenis Barang</th>
          <th>Total Stok</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(ruanganMap).map(([ruang, v]) => `
          <tr>
            <td style="font-weight:500">${ruang}</td>
            <td>${v.total}</td>
            <td style="font-weight:600">${v.stok}</td>
          </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;color:#6B6B6B">Tidak ada data</td></tr>'}
      </tbody>
    </table>

    <!-- Daftar barang rusak/hilang -->
    ${(totalRusak + totalHilang) > 0 ? `
      <div style="font-weight:600;font-size:14px;margin:1.5rem 0 10px;color:#DC2626">⚠️ Barang Rusak / Hilang — Perlu Perhatian</div>
      <table class="data-table" style="width:100%">
        <thead>
          <tr><th>#</th><th>Nama Barang</th><th>Kategori</th><th>Ruangan</th><th>Kondisi</th><th>Stok</th></tr>
        </thead>
        <tbody>
          ${data.filter(b => b.kondisi==='Rusak'||b.kondisi==='Hilang').map((b,i)=>`
            <tr>
              <td>${i+1}</td>
              <td style="font-weight:500">${b.nama}</td>
              <td>${b.kategori||'—'}</td>
              <td>${b.ruangan||'—'}</td>
              <td><span class="badge badge-${b.kondisi.toLowerCase()}">${b.kondisi}</span></td>
              <td>${b.stok??0}</td>
            </tr>`).join('')}
        </tbody>
      </table>` : ''}
    ${footerCetak()}`;
}

// ── Helper: header & footer laporan ─────────────────────
function headerCetak(judul, tanggal, periode = '') {
  const user = Auth.getUser();
  return `
    <div class="print-header" style="text-align:center;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:2px solid #1A3C5E;display:block">
      <div style="font-size:11px;color:#6B6B6B;letter-spacing:1px;text-transform:uppercase">RuangInvent — Sistem Inventaris Sekolah</div>
      <div style="font-size:20px;font-weight:700;color:#1A3C5E;margin:6px 0">${judul}</div>
      ${periode ? `<div style="font-size:13px;color:#6B6B6B">Periode: ${periode}</div>` : ''}
      <div style="font-size:12px;color:#6B6B6B;margin-top:4px">Dicetak pada: ${tanggal} oleh ${user?.name||'—'}</div>
    </div>
    <style>
      @media print {
        .print-header { display:block !important; }
        #page-container { border:none !important; box-shadow:none !important; }
        .sidebar, .topbar, .toast-container, .loading-overlay,
        .stats-grid, button, select, input[type="date"] { display:none !important; }
        .main { margin-left:0 !important; }
        body { font-size:11px !important; }
        .data-table th { background:#f0f0f0 !important; -webkit-print-color-adjust:exact; }
        .badge { border:1px solid #ccc !important; }
        @page { margin:1.5cm; }
      }
    </style>`;
}

function footerCetak() {
  return `
    <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #E2E0DA;font-size:11px;color:#6B6B6B;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <span>RuangInvent — Sistem Inventaris Sekolah</span>
      <span>Dicetak: ${new Date().toLocaleString('id-ID')}</span>
    </div>`;
}
