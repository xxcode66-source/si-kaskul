// ==============================
// NAVBAR CONFIG — mega-menu
// SEMUA PATH ROOT-RELATIVE (/pages/...)
// Biar gak ada double-pages bug!
// ==============================

const NAV_CONFIG = {
  items: [
    { href: '/index.html', label: 'Beranda', key: 'beranda' },
    {
      label: 'Profil Desa', key: 'profil',
      children: [
        { href: '/pages/profil/sejarah.html', label: 'Sejarah & Visi Misi', key: 'sejarah' },
        { href: '/pages/profil/struktur.html', label: 'Struktur Organisasi', key: 'struktur' },
        { href: '/pages/profil/perangkat.html', label: 'Perangkat Desa', key: 'perangkat' },
        { href: '/pages/profil/wilayah.html', label: 'Wilayah Administratif', key: 'wilayah' },
        { href: '/index.html#profil', label: 'Peta Desa', key: 'peta' },
      ]
    },
    {
      label: 'Data & Statistik', key: 'data',
      children: [
        { href: '/pages/data/penduduk.html', label: 'Jumlah Penduduk', key: 'penduduk' },
        { href: '/pages/data/penduduk.html#usia', label: 'Berdasarkan Usia', key: 'usia' },
        { href: '/pages/data/penduduk.html#pendidikan', label: 'Berdasarkan Pendidikan', key: 'pendidikan' },
        { href: '/pages/data/penduduk.html#pekerjaan', label: 'Berdasarkan Pekerjaan', key: 'pekerjaan' },
      ]
    },
    { href: '/pages/pbb.html', label: 'PBB', key: 'pbb' },
    {
      label: 'Bansos', key: 'bansos',
      children: [
        { href: '/pages/bansos.html', label: 'Program Aktif', key: 'program' },
        { href: '/pages/bansos.html#cek-status', label: 'Cek Status Penerima', key: 'cek-bansos' },
        { href: '/pages/bansos.html#statistik', label: 'Statistik', key: 'stat-bansos' },
      ]
    },
    {
      label: 'Layanan', key: 'layanan',
      children: [
        { href: '/pages/pengaduan.html', label: 'Pengaduan Masyarakat', key: 'pengaduan' },
        { href: '/pages/layanan/surat-online.html', label: 'Permohonan Surat Online', key: 'surat' },
        { href: '/pages/layanan/formulir.html', label: 'Unduh Formulir', key: 'formulir' },
      ]
    },
    { href: '/pages/berita.html', label: 'Berita', key: 'berita' },
    { href: '/pages/galeri.html', label: 'Galeri', key: 'galeri' },
    {
      label: 'Login', key: 'login', isButton: true,
      children: [
        { href: '/pages/login.html', label: 'Admin Desa', key: 'login-admin' },
        { href: '/pages/login.html', label: 'RT', key: 'login-rt' },
        { href: '/pages/login.html', label: 'Kolektor', key: 'login-kolektor' },
        { href: '#', label: 'Masyarakat (Segera Hadir)', key: 'login-warga', disabled: true },
      ]
    },
  ]
};

function renderNavbar(activeKey) {
  const navHtml = `
    <nav class="nav-blur fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/index.html" class="font-display text-emerald-800 text-xl font-bold shrink-0">Desa Kasomalang</a>
        <button id="mobile-toggle" class="md:hidden text-emerald-800" onclick="toggleMobileMenu()" aria-label="Menu">
          <i data-lucide="menu" style="width:28px;height:28px"></i>
        </button>
        <ul class="hidden md:flex items-center gap-1 text-sm font-medium text-gray-700" id="desktop-nav">
          ${NAV_CONFIG.items.map(item => {
            if (item.children) {
              const isActive = item.children.some(c => c.key === activeKey) || item.key === activeKey;
              if (item.isButton) {
                return `
                  <li class="relative group">
                    <a href="#" class="px-3 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1.5 font-semibold ${isActive ? 'ring-2 ring-emerald-300' : ''}" onclick="event.preventDefault(); toggleDropdown('dd-${item.key}')">
                      <i data-lucide="log-in" style="width:16px;height:16px"></i>
                      ${item.label}
                      <i data-lucide="chevron-down" style="width:14px;height:14px"></i>
                    </a>
                    <div id="dd-${item.key}" class="hidden absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-2xl border border-gray-100 py-3 z-50" onmouseleave="closeDropdown('dd-${item.key}')">
                      ${item.children.map(c => `
                        <a href="${c.href}" class="block px-4 py-2.5 text-sm ${c.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'} transition ${c.disabled ? 'pointer-events-none' : ''}" ${c.disabled ? 'onclick="event.preventDefault(); alert(\'Fitur Login Masyarakat akan segera hadir!\')"' : ''}>
                          ${c.disabled ? '🔄 ' : ''}${c.label}
                        </a>
                      `).join('')}
                    </div>
                  </li>
                `;
              }
              return `
                <li class="relative group">
                  <a href="#" class="px-2.5 py-2 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition flex items-center gap-1 ${isActive ? 'text-emerald-600 font-semibold' : ''}" onclick="event.preventDefault(); toggleDropdown('dd-${item.key}')">
                    ${item.label}
                    <i data-lucide="chevron-down" style="width:14px;height:14px"></i>
                  </a>
                  <div id="dd-${item.key}" class="hidden absolute left-0 mt-1 w-56 rounded-2xl bg-white shadow-2xl border border-gray-100 py-3 z-50" onmouseleave="closeDropdown('dd-${item.key}')">
                    ${item.children.map(c => `
                      <a href="${c.href}" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition">${c.label}</a>
                    `).join('')}
                  </div>
                </li>
              `;
            }
            // Simple link — root-relative, no ../ manipulation
            return `
              <li><a href="${item.href}" class="px-2.5 py-2 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition ${item.key === activeKey ? 'text-emerald-600 font-semibold' : ''}">${item.label}</a></li>
            `;
          }).join('')}
        </ul>
      </div>
      <!-- Mobile menu -->
      <div id="mobile-menu" class="hidden md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg px-4 py-4 text-sm font-medium text-gray-700 max-h-[80vh] overflow-y-auto">
        ${NAV_CONFIG.items.map(item => {
          if (item.children) {
            return `
              <div class="mb-2">
                <button onclick="toggleMobileDropdown('md-${item.key}')" class="w-full flex items-center justify-between py-2.5 ${item.isButton ? 'text-emerald-700 font-semibold' : ''}">
                  ${item.label}
                  <i data-lucide="chevron-down" style="width:16px;height:16px" class="transition-transform"></i>
                </button>
                <div id="md-${item.key}" class="hidden pl-4 space-y-1.5 mt-1">
                  ${item.children.map(c => `
                    <a href="${c.href}" class="block py-1.5 ${c.disabled ? 'text-gray-400 cursor-not-allowed' : 'hover:text-emerald-600'}">${c.disabled ? '🔄 ' : ''}${c.label}</a>
                  `).join('')}
                </div>
              </div>
            `;
          }
          return `<a href="${item.href}" class="block py-2.5 ${item.key === activeKey ? 'text-emerald-600 font-semibold' : 'hover:text-emerald-600'}">${item.label}</a>`;
        }).join('')}
      </div>
    </nav>
  `;

  document.addEventListener('DOMContentLoaded', () => {
    const c = document.getElementById('navbar-container');
    if (c) {
      c.innerHTML = navHtml;
      setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
    }
  });
}

// Dropdown toggles
function toggleDropdown(id) {
  closeAllDropdowns();
  const el = document.getElementById(id);
  if (el) el.classList.toggle('hidden');
}

function closeDropdown(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function closeAllDropdowns() {
  document.querySelectorAll('[id^="dd-"]').forEach(el => el.classList.add('hidden'));
}

function toggleMobileDropdown(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.toggle('hidden');
    const icon = el.previousElementSibling?.querySelector('[data-lucide="chevron-down"]');
    if (icon) icon.style.transform = el.classList.contains('hidden') ? '' : 'rotate(180deg)';
  }
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.group') && !e.target.closest('[id^="dd-"]')) closeAllDropdowns();
});