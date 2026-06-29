// ==============================
// NAVBAR — Premium Glassmorphism Design
// ==============================

const NAV_CONFIG = {
  items: [
    { href: '/index.html', label: 'Beranda', key: 'beranda', icon: 'home' },
    {
      label: 'Profil Desa', key: 'profil', icon: 'building',
      children: [
        { href: '/pages/profil/sejarah.html', label: 'Sejarah & Visi Misi', key: 'sejarah', icon: 'book-open' },
        { href: '/pages/profil/struktur.html', label: 'Struktur Organisasi', key: 'struktur', icon: 'git-branch' },
        { href: '/pages/profil/perangkat.html', label: 'Perangkat Desa', key: 'perangkat', icon: 'users' },
        { href: '/pages/profil/wilayah.html', label: 'Wilayah Administratif', key: 'wilayah', icon: 'map' },
        { href: '/index.html#profil', label: 'Peta Desa', key: 'peta', icon: 'map-pin' },
      ]
    },
    {
      label: 'Data & Statistik', key: 'data', icon: 'bar-chart-3',
      children: [
        { href: '/pages/data/penduduk.html', label: 'Jumlah Penduduk', key: 'penduduk', icon: 'users' },
        { href: '/pages/data/penduduk.html#usia', label: 'Berdasarkan Usia', key: 'usia', icon: 'user-check' },
        { href: '/pages/data/penduduk.html#pendidikan', label: 'Berdasarkan Pendidikan', key: 'pendidikan', icon: 'graduation-cap' },
        { href: '/pages/data/penduduk.html#pekerjaan', label: 'Berdasarkan Pekerjaan', key: 'pekerjaan', icon: 'briefcase' },
      ]
    },
    { href: '/pages/pbb.html', label: 'PBB', key: 'pbb', icon: 'receipt' },
    {
      label: 'Bansos', key: 'bansos', icon: 'heart-handshake',
      children: [
        { href: '/pages/bansos.html', label: 'Program Aktif', key: 'program', icon: 'list-checks' },
        { href: '/pages/bansos.html#cek-status', label: 'Cek Status Penerima', key: 'cek-bansos', icon: 'search' },
        { href: '/pages/bansos.html#statistik', label: 'Statistik', key: 'stat-bansos', icon: 'pie-chart' },
      ]
    },
    {
      label: 'Layanan', key: 'layanan', icon: 'concierge-bell',
      children: [
        { href: '/pages/pengaduan.html', label: 'Pengaduan Masyarakat', key: 'pengaduan', icon: 'message-square' },
        { href: '/pages/login.html', label: 'Permohonan Surat Online', key: 'surat', icon: 'file-text' },
        { href: '/pages/layanan/formulir.html', label: 'Unduh Formulir', key: 'formulir', icon: 'download' },
      ]
    },
    { href: '/pages/berita.html', label: 'Berita', key: 'berita', icon: 'newspaper' },
    { href: '/pages/gallery.html', label: 'Galeri', key: 'galeri', icon: 'image' },
    {
      label: 'Login', key: 'login', isButton: true, icon: 'log-in',
      children: [
        { href: '/pages/login.html', label: 'Admin Desa', key: 'login-admin', icon: 'shield-check' },
        { href: '/pages/login.html', label: 'RT', key: 'login-rt', icon: 'user' },
        { href: '/pages/login.html', label: 'Kolektor', key: 'login-kolektor', icon: 'clipboard-list' },
        { href: '/pages/login.html', label: 'Masyarakat', key: 'login-warga', icon: 'user' },
      ]
    },
  ]
};

function renderNavbar(activeKey) {
  const navHtml = `
    <nav class="nav-blur fixed top-0 left-0 right-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <!-- Logo -->
        <a href="/index.html" class="flex items-center gap-3 shrink-0 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200/50 group-hover:shadow-emerald-300/60 transition-all duration-300 group-hover:scale-105">
            <i data-lucide="trees" style="width:20px;height:20px;color:white"></i>
          </div>
          <div class="hidden sm:block">
            <p class="font-display text-emerald-800 text-lg font-bold leading-tight">Kasomalang</p>
            <p class="text-[10px] uppercase tracking-[0.2em] text-emerald-600/70 font-medium -mt-0.5">Kulon Village</p>
          </div>
        </a>

        <!-- Desktop Nav -->
        <ul class="hidden lg:flex items-center gap-0.5 text-sm font-medium text-gray-600" id="desktop-nav">
          ${NAV_CONFIG.items.map(item => {
            if (item.children) {
              const isActive = item.children.some(c => c.key === activeKey) || item.key === activeKey;
              if (item.isButton) {
                return `
                  <li class="relative group ml-2">
                    <a href="#" class="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 flex items-center gap-2 font-semibold text-xs shadow-lg shadow-emerald-200/40 hover:shadow-emerald-300/50 hover:-translate-y-0.5" onclick="event.preventDefault(); toggleDropdown('dd-${item.key}')">
                      <i data-lucide="${item.icon}" style="width:14px;height:14px"></i>
                      ${item.label}
                      <i data-lucide="chevron-down" style="width:12px;height:12px;transition:transform 0.3s" class="group-hover:rotate-180"></i>
                    </a>
                    <div id="dd-${item.key}" class="hidden absolute right-0 mt-3 w-64 rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-100/80 py-2 z-50 overflow-hidden" onmouseleave="closeDropdown('dd-${item.key}')">
                      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                      ${item.children.map(c => `
                        <a href="${c.href}" class="flex items-center gap-3 px-4 py-3 text-sm ${c.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-emerald-50/80 hover:text-emerald-700'} transition-all duration-200 ${c.disabled ? 'pointer-events-none' : ''}" ${c.disabled ? 'onclick="event.preventDefault()"' : ''}>
                          <div class="w-8 h-8 rounded-lg ${c.disabled ? 'bg-gray-100' : 'bg-emerald-50'} flex items-center justify-center shrink-0">
                            <i data-lucide="${c.icon || 'circle'}" style="width:14px;height:14px;color:${c.disabled ? '#9ca3af' : '#059669'}"></i>
                          </div>
                          <span class="font-medium">${c.label}</span>
                        </a>
                      `).join('')}
                    </div>
                  </li>
                `;
              }
              return `
                <li class="relative group">
                  <a href="#" class="px-3 py-2 rounded-xl hover:bg-emerald-50/80 hover:text-emerald-700 transition-all duration-300 flex items-center gap-1.5 ${isActive ? 'text-emerald-700 font-semibold bg-emerald-50/60' : ''}" onclick="event.preventDefault(); toggleDropdown('dd-${item.key}')">
                    ${item.label}
                    <i data-lucide="chevron-down" style="width:13px;height:13px;transition:transform 0.3s" class="group-hover:rotate-180 ${isActive ? 'text-emerald-500' : 'text-gray-400'}"></i>
                  </a>
                  <div id="dd-${item.key}" class="hidden absolute left-0 mt-2 w-64 rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-100/80 py-2 z-50 overflow-hidden" onmouseleave="closeDropdown('dd-${item.key}')">
                    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                    ${item.children.map(c => `
                      <a href="${c.href}" class="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-emerald-50/80 hover:text-emerald-700 transition-all duration-200">
                        <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                          <i data-lucide="${c.icon || 'circle'}" style="width:14px;height:14px;color:#059669"></i>
                        </div>
                        <span class="font-medium">${c.label}</span>
                      </a>
                    `).join('')}
                  </div>
                </li>
              `;
            }
            return `
              <li>
                <a href="${item.href}" class="px-3 py-2 rounded-xl hover:bg-emerald-50/80 hover:text-emerald-700 transition-all duration-300 flex items-center gap-1.5 ${item.key === activeKey ? 'text-emerald-700 font-semibold bg-emerald-50/60' : ''}">
                  ${item.label}
                </a>
              </li>
            `;
          }).join('')}
        </ul>

        <!-- Mobile Toggle -->
        <button id="mobile-toggle" class="lg:hidden text-emerald-800 p-2 rounded-xl hover:bg-emerald-50 transition" onclick="toggleMobileMenu()" aria-label="Menu">
          <i data-lucide="menu" style="width:24px;height:24px"></i>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div id="mobile-menu" class="hidden lg:hidden border-t border-gray-100/80 bg-white/95 backdrop-blur-xl px-4 py-4 text-sm font-medium text-gray-700 max-h-[75vh] overflow-y-auto">
        ${NAV_CONFIG.items.map(item => {
          if (item.children) {
            return `
              <div class="mb-1">
                <button onclick="toggleMobileDropdown('md-${item.key}')" class="w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-emerald-50/50 transition ${item.isButton ? 'text-emerald-700 font-semibold' : ''}">
                  <span class="flex items-center gap-2">
                    <i data-lucide="${item.icon}" style="width:16px;height:16px"></i>
                    ${item.label}
                  </span>
                  <i data-lucide="chevron-down" style="width:16px;height:16px" class="transition-transform duration-300"></i>
                </button>
                <div id="md-${item.key}" class="hidden pl-4 space-y-0.5 mt-1 border-l-2 border-emerald-100 ml-5">
                  ${item.children.map(c => `
                    <a href="${c.href}" class="flex items-center gap-2 py-2.5 px-3 rounded-lg ${c.disabled ? 'text-gray-400 cursor-not-allowed' : 'hover:text-emerald-600 hover:bg-emerald-50/50'} transition">
                      <i data-lucide="${c.icon || 'circle'}" style="width:14px;height:14px"></i>
                      ${c.label}
                    </a>
                  `).join('')}
                </div>
              </div>
            `;
          }
          return `
            <a href="${item.href}" class="flex items-center gap-2 py-3 px-3 rounded-xl ${item.key === activeKey ? 'text-emerald-700 font-semibold bg-emerald-50/60' : 'hover:text-emerald-600 hover:bg-emerald-50/50'} transition">
              <i data-lucide="${item.icon}" style="width:16px;height:16px"></i>
              ${item.label}
            </a>
          `;
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

// ─── Dropdown Logic ───────────────────────────────────
function toggleDropdown(id) {
  closeAllDropdowns();
  const el = document.getElementById(id);
  if (el) {
    el.classList.toggle('hidden');
    // Animate in
    if (!el.classList.contains('hidden')) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    }
  }
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
    if (icon) {
      icon.style.transform = el.classList.contains('hidden') ? '' : 'rotate(180deg)';
      icon.style.transition = 'transform 0.3s ease';
    }
  }
}

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.group') && !e.target.closest('[id^="dd-"]')) {
    closeAllDropdowns();
  }
});