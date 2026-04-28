<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RuangInvent — Login</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #F4F3EF;
      --surface:   #FFFFFF;
      --primary:   #1A3C5E;
      --accent:    #2E7D6F;
      --accent2:   #E8A838;
      --text:      #1C1C1C;
      --text-muted:#6B6B6B;
      --border:    #E2E0DA;
      --radius:    16px;
      --shadow:    0 4px 24px rgba(0,0,0,0.08);
    }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
      overflow: hidden;
    }

    /* ── Panel kiri: ilustrasi & branding ── */
    .left-panel {
      background: var(--primary);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 3rem;
      position: relative;
      overflow: hidden;
    }

    .left-panel::before {
      content: '';
      position: absolute;
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(46,125,111,0.4) 0%, transparent 70%);
      top: -100px; right: -100px;
      border-radius: 50%;
    }

    .left-panel::after {
      content: '';
      position: absolute;
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(232,168,56,0.25) 0%, transparent 70%);
      bottom: 80px; left: -60px;
      border-radius: 50%;
    }

    .brand {
      position: relative;
      z-index: 1;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 2.5rem;
    }

    .brand-icon {
      width: 44px; height: 44px;
      background: var(--accent2);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
    }

    .brand-name {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.5px;
    }

    .brand-tagline {
      font-size: 13px;
      color: rgba(255,255,255,0.55);
      font-weight: 400;
    }

    .hero-text {
      position: relative;
      z-index: 1;
    }

    .hero-text h1 {
      font-size: clamp(28px, 3vw, 40px);
      font-weight: 700;
      color: #fff;
      line-height: 1.2;
      letter-spacing: -1px;
      margin-bottom: 1rem;
    }

    .hero-text h1 span {
      color: var(--accent2);
    }

    .hero-text p {
      font-size: 15px;
      color: rgba(255,255,255,0.6);
      line-height: 1.7;
      max-width: 340px;
    }

    .feature-pills {
      position: relative;
      z-index: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .pill {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.8);
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 100px;
    }

    /* ── Panel kanan: form login ── */
    .right-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
    }

    .login-card h2 {
      font-size: 26px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }

    .login-card .subtitle {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 2.5rem;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 1.5rem 0;
      color: var(--text-muted);
      font-size: 13px;
    }

    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }

    /* ── Tombol login Google ── */
    .btn-google {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 14px 20px;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: 12px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: var(--shadow);
    }

    .btn-google:hover:not(:disabled) {
      border-color: var(--primary);
      transform: translateY(-1px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    }

    .btn-google:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-google:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-google svg {
      width: 20px; height: 20px;
      flex-shrink: 0;
    }

    /* ── Status & error ── */
    .login-status {
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 1rem;
      min-height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .spinner {
      width: 14px; height: 14px;
      border: 2px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: none;
    }

    .spinner.visible { display: block; }

    @keyframes spin { to { transform: rotate(360deg); } }

    .login-error {
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #991B1B;
      font-size: 13px;
      padding: 10px 14px;
      border-radius: 10px;
      margin-top: 1rem;
      display: none;
      text-align: center;
    }

    /* ── Info box ── */
    .info-box {
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 1.5rem;
    }

    .info-box p {
      font-size: 13px;
      color: #1E40AF;
      line-height: 1.6;
    }

    .info-box strong { font-weight: 600; }

    /* ── Footer ── */
    .login-footer {
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2rem;
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      body {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
        overflow: auto;
      }

      .left-panel {
        padding: 2rem;
        min-height: 220px;
      }

      .hero-text { display: none; }

      .feature-pills { display: none; }

      .brand-logo { margin-bottom: 0; }
    }
  </style>
</head>
<body>

  <!-- ── Panel Kiri ── -->
  <div class="left-panel">
    <div class="brand">
      <div class="brand-logo">
        <div class="brand-icon">📦</div>
        <div>
          <div class="brand-name">RuangInvent</div>
          <div class="brand-tagline">Sistem Inventaris Sekolah</div>
        </div>
      </div>
    </div>

    <div class="hero-text">
      <h1>Kelola inventaris<br>sekolah dengan <span>lebih mudah</span></h1>
      <p>Catat barang masuk &amp; keluar, kelola peminjaman, dan pantau kondisi aset sekolah — semua di satu tempat.</p>
    </div>

    <div class="feature-pills">
      <span class="pill">📊 Laporan PDF</span>
      <span class="pill">🔍 QR Code</span>
      <span class="pill">🏫 Multi Ruangan</span>
      <span class="pill">👥 Multi Akun</span>
      <span class="pill">☁️ Google Drive</span>
    </div>
  </div>

  <!-- ── Panel Kanan ── -->
  <div class="right-panel">
    <div class="login-card">
      <h2>Selamat datang</h2>
      <p class="subtitle">Masuk menggunakan akun Google untuk melanjutkan</p>

      <div class="info-box">
        <p>
          <strong>Pertama kali login?</strong> Akun kamu akan otomatis terdaftar.
          Admin pertama yang masuk akan mendapat akses <strong>Super Admin</strong>.
        </p>
      </div>

      <button class="btn-google" id="btn-login" onclick="handleLogin()">
        <!-- Google Logo SVG -->
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Masuk dengan Google
      </button>

      <div class="login-status" id="login-status-wrap">
        <div class="spinner" id="login-spinner"></div>
        <span id="login-status"></span>
      </div>

      <div class="login-error" id="login-error"></div>

      <div class="login-footer">
        Data tersimpan di Google Drive milikmu sendiri.<br>
        Tidak ada data yang dikirim ke server lain.
      </div>
    </div>
  </div>

  <!-- ── Scripts ── -->
  <script src="config.js"></script>
  <script src="https://apis.google.com/js/api.js"></script>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <script src="js/drive.js"></script>
  <script src="js/auth.js"></script>

  <script>
    // Cek jika sudah login, langsung redirect
    window.addEventListener('load', async () => {
      if (Auth.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
      }
      await Auth.init();
    });

    function handleLogin() {
      const btn = document.getElementById('btn-login');
      const spinner = document.getElementById('login-spinner');
      const status = document.getElementById('login-status');
      const error = document.getElementById('login-error');

      btn.disabled = true;
      spinner.classList.add('visible');
      status.textContent = 'Membuka halaman login Google...';
      error.style.display = 'none';

      Auth.login();
    }
  </script>
</body>
</html>
