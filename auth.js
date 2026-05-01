// ============================================================
//  RuangInvent — auth.js
//  Handle Google OAuth 2.0, session, dan sistem role
// ============================================================

const Auth = (() => {
  let tokenClient = null;
  let accessToken = null;
  let currentUser = null;

  // ── Inisialisasi Google Identity Services ────────────────
  async function init() {
    return new Promise((resolve) => {
      google.accounts.id.initialize({
        client_id: CONFIG.CLIENT_ID,
        callback: handleCredentialResponse,
      });

      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.CLIENT_ID,
        scope: CONFIG.SCOPES,
        callback: async (response) => {
          if (response.error) {
            console.error('Token error:', response.error);
            showLoginError('Gagal mendapatkan akses. Coba lagi.');
            return;
          }
          accessToken = response.access_token;
          sessionStorage.setItem('access_token', accessToken);
          sessionStorage.setItem('token_expiry', Date.now() + (response.expires_in * 1000));
          await afterLogin();
        },
      });

      resolve();
    });
  }

  // ── Proses setelah token didapat ─────────────────────────
  async function afterLogin() {
    try {
      showLoginStatus('Memuat profil...');

      // Ambil info profil dari Google
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = await profileRes.json();

      // Simpan data user sementara
      const userData = {
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      };
      sessionStorage.setItem('user_profile', JSON.stringify(userData));

      showLoginStatus('Menghubungkan ke data inventaris...');

      // Inisialisasi folder & file di Google Drive
      await Drive.init();

      showLoginStatus('Memeriksa hak akses...');

      // Cek & daftarkan user di users.json
      currentUser = await registerOrGetUser(userData);
      sessionStorage.setItem('current_user', JSON.stringify(currentUser));

      // Redirect ke dashboard
      window.location.href = 'index.html';
    } catch (err) {
      console.error('afterLogin error:', err);
      showLoginError('Terjadi kesalahan saat login. Silakan coba lagi.');
    }
  }

  // ── Daftarkan user baru atau ambil data user lama ────────
  async function registerOrGetUser(profile) {
    const users = await Drive.readJSON(CONFIG.FILES.USERS) || [];

    const existing = users.find(u => u.email === profile.email);
    if (existing) {
      // Update last login
      existing.lastLogin = new Date().toISOString();
      await Drive.writeJSON(CONFIG.FILES.USERS, users);
      return existing;
    }

    // User baru — jika belum ada user sama sekali, jadikan Super Admin
    const role = users.length === 0 ? 'superadmin' : 'viewer';
    const newUser = {
      id: 'usr_' + Date.now(),
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      role: role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    users.push(newUser);
    await Drive.writeJSON(CONFIG.FILES.USERS, users);
    return newUser;
  }

  // ── Trigger login (buka popup Google) ───────────────────
  function login() {
    if (!tokenClient) {
      showLoginError('Aplikasi belum siap. Refresh halaman.');
      return;
    }
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  // ── Logout ───────────────────────────────────────────────
  function logout() {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken, () => {});
    }
    sessionStorage.clear();
    accessToken = null;
    currentUser = null;
    window.location.href = 'login.html';
  }

  // ── Cek apakah user sudah login ─────────────────────────
  function isLoggedIn() {
    const token = sessionStorage.getItem('access_token');
    const expiry = sessionStorage.getItem('token_expiry');
    if (!token || !expiry) return false;
    if (Date.now() > parseInt(expiry)) {
      sessionStorage.clear();
      return false;
    }
    return true;
  }

  // ── Ambil token yang tersimpan ───────────────────────────
  function getToken() {
    if (!accessToken) {
      accessToken = sessionStorage.getItem('access_token');
    }
    return accessToken;
  }

  // ── Ambil data user yang sedang login ────────────────────
  function getUser() {
    if (!currentUser) {
      const raw = sessionStorage.getItem('current_user');
      currentUser = raw ? JSON.parse(raw) : null;
    }
    return currentUser;
  }

  // ── Cek role user ────────────────────────────────────────
  function hasRole(...roles) {
    const user = getUser();
    if (!user) return false;
    return roles.includes(user.role);
  }

  function isSuperAdmin() { return hasRole('superadmin'); }
  function isOperator()   { return hasRole('superadmin', 'operator'); }
  function isViewer()     { return hasRole('superadmin', 'operator', 'viewer'); }

  // ── Guard: redirect ke login jika belum login ────────────
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  // ── Guard: redirect jika tidak punya role cukup ──────────
  function requireRole(...roles) {
    if (!requireAuth()) return false;
    if (!hasRole(...roles)) {
      alert('Kamu tidak memiliki akses ke halaman ini.');
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  // ── Helper UI login.html ─────────────────────────────────
  function showLoginStatus(msg) {
    const el = document.getElementById('login-status');
    if (el) el.textContent = msg;
  }

  function showLoginError(msg) {
    const el = document.getElementById('login-error');
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
    }
    const btn = document.getElementById('btn-login');
    if (btn) btn.disabled = false;
    const status = document.getElementById('login-status');
    if (status) status.textContent = '';
  }

  // Handler credential (tidak dipakai utama, tapi dibutuhkan initialize)
  function handleCredentialResponse(response) {}

  return {
    init,
    login,
    logout,
    isLoggedIn,
    getToken,
    getUser,
    hasRole,
    isSuperAdmin,
    isOperator,
    isViewer,
    requireAuth,
    requireRole,
  };
})();
