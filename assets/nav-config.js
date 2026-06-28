// ==============================
// NAVBAR CONFIG — centralized
// Semua page panggil ini aja.
// ==============================

const NAV_ITEMS = [
  { href: '../index.html', label: 'Beranda', key: 'beranda' },
  { href: 'berita.html', label: 'Berita', key: 'berita' },
  { href: 'gallery.html', label: 'Galeri', key: 'galeri' },
  { href: 'pbb.html', label: 'PBB', key: 'pbb' },
  { href: 'bansos.html', label: 'Bansos', key: 'bansos' },
  { href: 'pengaduan.html', label: 'Pengaduan', key: 'pengaduan' },
  { href: 'lapak-desa.html', label: 'Lapak Desa', key: 'lapak' },
  { href: 'login.html', label: 'Login', key: 'login' },
];

function renderNavbar(activeKey, isInner = true) {
  const prefix = isInner ? '../' : '';
  const navHtml = `
    <nav class="nav-blur fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="${prefix}index.html" class="font-display text-emerald-800 text-xl font-bold">Desa Kasomalang</a>
        <button id="mobile-toggle" class="md:hidden text-emerald-800" onclick="toggleMobileMenu()">
          <i data-lucide="menu" style="width:28px;height:28px"></i>
        </button>
        <ul class="hidden md:flex gap-6 text-sm font-medium text-gray-700">
          ${NAV_ITEMS.map(item => `
            <li><a href="${isInner ? '' : ''}${item.href}" class="${item.key === activeKey ? 'text-emerald-600 font-semibold' : 'hover:text-emerald-600 transition'}">${item.label}</a></li>
          `).join('')}
        </ul>
      </div>
      <ul id="mobile-menu" class="hidden md:hidden px-4 pb-4 space-y-2 text-sm font-medium text-gray-700">
        ${NAV_ITEMS.map(item => `
          <li><a href="${item.href}" class="block py-1 ${item.key === activeKey ? 'text-emerald-600 font-semibold' : ''}">${item.label}</a></li>
        `).join('')}
      </ul>
    </nav>
  `;

  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('navbar-container');
    if (container) {
      container.innerHTML = navHtml;
      // Re-init lucide icons for nav
      if (typeof lucide !== 'undefined') {
        setTimeout(() => lucide.createIcons(), 50);
      }
    }
  });
}