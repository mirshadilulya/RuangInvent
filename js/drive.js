// ============================================================
//  RuangInvent — drive.js
//  Google Drive API v3 sebagai database JSON
// ============================================================

const Drive = (() => {
  let folderId = null;  // ID folder RuangInvent_Data di Drive user

  // ── Inisialisasi: cari atau buat folder utama ────────────
  async function init() {
    await gapiLoaded();
    folderId = await getOrCreateFolder(CONFIG.DRIVE_FOLDER_NAME);
    sessionStorage.setItem('drive_folder_id', folderId);

    // Pastikan semua file JSON dasar ada
    await ensureFiles();
  }

  // ── Tunggu gapi client siap ──────────────────────────────
  function gapiLoaded() {
    return new Promise((resolve, reject) => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({});
          gapi.client.setToken({ access_token: Auth.getToken() });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  // ── Set token (dipanggil setiap operasi Drive) ───────────
  function setToken() {
    gapi.client.setToken({ access_token: Auth.getToken() });
  }

  // ── Cari atau buat folder di Drive ───────────────────────
  async function getOrCreateFolder(name) {
    setToken();
    const res = await gapi.client.request({
      path: 'https://www.googleapis.com/drive/v3/files',
      method: 'GET',
      params: {
        q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
      },
    });

    const files = res.result.files;
    if (files && files.length > 0) return files[0].id;

    // Buat folder baru
    const create = await gapi.client.request({
      path: 'https://www.googleapis.com/drive/v3/files',
      method: 'POST',
      body: {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
      },
    });
    return create.result.id;
  }

  // ── Pastikan semua file JSON awal ada ────────────────────
  async function ensureFiles() {
    const defaults = {
      [CONFIG.FILES.USERS]:      [],
      [CONFIG.FILES.BARANG]:     [],
      [CONFIG.FILES.KATEGORI]:   [],
      [CONFIG.FILES.RUANGAN]:    [],
      [CONFIG.FILES.TRANSAKSI]:  [],
      [CONFIG.FILES.PEMINJAMAN]: [],
    };

    for (const [filename, defaultData] of Object.entries(defaults)) {
      const existing = await findFile(filename);
      if (!existing) {
        await writeJSON(filename, defaultData);
      }
    }
  }

  // ── Cari file berdasarkan nama ────────────────────────────
  async function findFile(filename) {
    setToken();
    const res = await gapi.client.request({
      path: 'https://www.googleapis.com/drive/v3/files',
      method: 'GET',
      params: {
        q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
        fields: 'files(id, name)',
      },
    });
    const files = res.result.files;
    return files && files.length > 0 ? files[0] : null;
  }

  // ── Baca JSON dari Drive ──────────────────────────────────
  async function readJSON(filename) {
    try {
      setToken();
      const file = await findFile(filename);
      if (!file) return null;

      const res = await gapi.client.request({
        path: `https://www.googleapis.com/drive/v3/files/${file.id}`,
        method: 'GET',
        params: { alt: 'media' },
      });
      return typeof res.result === 'string' ? JSON.parse(res.result) : res.result;
    } catch (err) {
      console.error(`readJSON error (${filename}):`, err);
      return null;
    }
  }

  // ── Tulis JSON ke Drive (buat atau update) ───────────────
  async function writeJSON(filename, data) {
    try {
      setToken();

      if (!folderId) {
        folderId = sessionStorage.getItem('drive_folder_id');
      }

      const content = JSON.stringify(data, null, 2);
      const blob = new Blob([content], { type: 'application/json' });

      const existing = await findFile(filename);

      if (existing) {
        // Update file yang sudah ada
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${Auth.getToken()}`,
            'Content-Type': 'application/json',
          },
          body: content,
        });
      } else {
        // Buat file baru dengan metadata
        const metadata = {
          name: filename,
          parents: [folderId],
          mimeType: 'application/json',
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { Authorization: `Bearer ${Auth.getToken()}` },
          body: form,
        });
      }
      return true;
    } catch (err) {
      console.error(`writeJSON error (${filename}):`, err);
      return false;
    }
  }

  // ── Upload foto barang ke Drive ───────────────────────────
  async function uploadPhoto(file, barangId) {
    try {
      setToken();
      if (!folderId) folderId = sessionStorage.getItem('drive_folder_id');

      const metadata = {
        name: `foto_${barangId}_${Date.now()}`,
        parents: [folderId],
        mimeType: file.type,
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink', {
        method: 'POST',
        headers: { Authorization: `Bearer ${Auth.getToken()}` },
        body: form,
      });

      const data = await res.json();

      // Set file agar bisa dilihat publik (untuk tampil sebagai gambar)
      await gapi.client.request({
        path: `https://www.googleapis.com/drive/v3/files/${data.id}/permissions`,
        method: 'POST',
        body: { role: 'reader', type: 'anyone' },
      });

      // Return URL thumbnail yang bisa ditampilkan langsung
      return `https://drive.google.com/thumbnail?id=${data.id}&sz=w400`;
    } catch (err) {
      console.error('uploadPhoto error:', err);
      return null;
    }
  }

  // ── Hapus file dari Drive ─────────────────────────────────
  async function deleteFile(filename) {
    try {
      setToken();
      const file = await findFile(filename);
      if (!file) return false;

      await gapi.client.request({
        path: `https://www.googleapis.com/drive/v3/files/${file.id}`,
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      console.error(`deleteFile error (${filename}):`, err);
      return false;
    }
  }

  return {
    init,
    readJSON,
    writeJSON,
    uploadPhoto,
    deleteFile,
    findFile,
  };
})();
