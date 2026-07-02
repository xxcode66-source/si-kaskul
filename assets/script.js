// ==============================
// SI-KASKUL — Premium Interactive Layer
// ==============================

// ─── Page Loader ───────────────────────────────────────
window.PageLoader = {
    show(message = 'Memuat...') {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.classList.remove('hidden');
            const text = loader.querySelector('.loader-text');
            if (text) text.textContent = message;
        }
    },
    hide() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            setTimeout(() => loader.classList.add('hidden'), 250);
        }
    }
};

// ─── Mobile Menu ───────────────────────────────────────
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
}

// ─── Scroll Progress Bar ──────────────────────────────
function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.style.width = '0%';
    document.body.prepend(bar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = progress + '%';
    }, { passive: true });
}

// ─── Navbar Scroll Effect ─────────────────────────────
function initNavbarScroll() {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.nav-blur');
        if (!nav) return;
        const currentScroll = window.scrollY;
        
        if (currentScroll > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    }, { passive: true });
}

// ─── Advanced Scroll Reveal ───────────────────────────
function initScrollAnimations() {
    const revealClasses = ['.fade-in', '.fade-in-left', '.fade-in-right', '.scale-in', '.stagger-children'];
    const selector = revealClasses.join(',');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Don't unobserve — allow re-animation if needed
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -60px 0px'
    });

    document.querySelectorAll(selector).forEach(el => observer.observe(el));
}

// ─── Animated Counter ─────────────────────────────────
function animateCounter(element, target, duration = 2000, prefix = '', suffix = '') {
    if (!element) return;
    
    const start = 0;
    const startTime = performance.now();
    const isNumber = !isNaN(target);
    
    if (!isNumber) {
        element.textContent = prefix + target + suffix;
        return;
    }

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing: easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.floor(start + (target - start) * eased);
        
        element.textContent = prefix + current.toLocaleString('id-ID') + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function initCounters() {
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.counted) {
                entry.target.dataset.counted = 'true';
                const target = parseInt(entry.target.dataset.countTarget) || 0;
                const prefix = entry.target.dataset.countPrefix || '';
                const suffix = entry.target.dataset.countSuffix || '';
                const duration = parseInt(entry.target.dataset.countDuration) || 2000;
                animateCounter(entry.target, target, duration, prefix, suffix);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-count-target]').forEach(el => {
        counterObserver.observe(el);
    });
}

// ─── Gallery Lightbox ─────────────────────────────────
function initGalleryLightbox() {
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const src = item.querySelector('img')?.src;
            if (!src) return;
            const lightbox = document.getElementById('lightbox');
            if (lightbox) {
                document.getElementById('lightbox-img').src = src;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.closest('.lightbox-close')) {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox?.classList.contains('active')) {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ─── Navigation ───────────────────────────────────────
function initNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', () => {
            const menu = document.getElementById('mobile-menu');
            if (menu && !menu.classList.contains('hidden')) {
                menu.classList.add('hidden');
            }
        });
    });
}

function initNavigationLoader() {
    document.querySelectorAll('a[href]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('http')) return;
            // Only intercept internal page links (not API calls, not external)
            if (href.includes('/api/') || href.includes('mailto:') || href.includes('tel:')) return;
            e.preventDefault();
            PageLoader.show('Memuat halaman...');
            setTimeout(() => { window.location.href = href; }, 180);
        });
    });
}

// ─── Ripple Effect on Buttons ─────────────────────────
function initRippleEffect() {
    document.querySelectorAll('.btn-hover-glow, .btn-ripple').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            const size = Math.max(rect.width, rect.height);
            
            ripple.className = 'ripple';
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// ─── Parallax on Scroll ──────────────────────────────
function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    if (!parallaxElements.length) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        parallaxElements.forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.3;
            const rect = el.getBoundingClientRect();
            const offset = (rect.top + scrollY) * speed;
            el.style.transform = `translateY(${(scrollY - offset) * 0.15}px)`;
        });
    }, { passive: true });
}

// ─── Tilt Effect on Cards ─────────────────────────────
function initTiltEffect() {
    const cards = document.querySelectorAll('[data-tilt]');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
}

// ─── Smooth Scroll ────────────────────────────────────
function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        const offset = 80; // navbar height
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
            top: elementPosition - offset,
            behavior: 'smooth'
        });
    }
}

// ─── Format Helpers ───────────────────────────────────
function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

// ─── API Base URL ─────────────────────────────────────
window.API_BASE_URL = window.__API_BASE_URL__ || (
    window.location.protocol === 'file:' || 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : `${window.location.origin}/api`
);

// ─── Fetch with Loading ──────────────────────────────
async function fetchWithLoader(url, options = {}) {
    PageLoader.show('Memuat...');
    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        PageLoader.hide();
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        PageLoader.hide();
        throw error;
    }
}

// ═══════════════════════════════════════════════════════
// TOAST NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════
window.Toast = {
    container: null,
    
    init() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'fixed top-24 right-4 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none';
        document.body.appendChild(this.container);
    },
    
    show(message, type = 'info', duration = 4000) {
        this.init();
        
        const icons = {
            success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };
        
        const colors = {
            success: 'bg-emerald-500',
            error: 'bg-red-500',
            warning: 'bg-amber-500',
            info: 'bg-blue-500'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast-item pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl text-white transform transition-all duration-300 translate-x-full opacity-0 ${colors[type] || colors.info}`;
        toast.innerHTML = `
            <div class="flex-shrink-0 mt-0.5">${icons[type] || icons.info}</div>
            <div class="flex-1 text-sm font-medium">${message}</div>
            <button onclick="this.parentElement.remove()" class="flex-shrink-0 opacity-70 hover:opacity-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;
        
        this.container.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
            toast.classList.add('translate-x-0', 'opacity-100');
        });
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    success(message, duration) { this.show(message, 'success', duration); },
    error(message, duration) { this.show(message, 'error', duration); },
    warning(message, duration) { this.show(message, 'warning', duration); },
    info(message, duration) { this.show(message, 'info', duration); }
};

// ═══════════════════════════════════════════════════════
// SKELETON LOADER
// ═══════════════════════════════════════════════════════
window.Skeleton = {
    card(count = 3) {
        return Array(count).fill(0).map(() => `
            <div class="skeleton-card bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                <div class="flex items-center justify-between mb-4">
                    <div class="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div class="h-10 w-10 bg-gray-200 rounded-xl"></div>
                </div>
                <div class="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
        `).join('');
    },
    
    table(rows = 5) {
        return `
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div class="h-12 bg-gray-200"></div>
                ${Array(rows).fill(0).map(() => `
                    <div class="border-b border-gray-100 p-4 flex gap-4">
                        <div class="h-4 bg-gray-200 rounded w-1/12"></div>
                        <div class="h-4 bg-gray-200 rounded w-3/12"></div>
                        <div class="h-4 bg-gray-200 rounded w-3/12"></div>
                        <div class="h-4 bg-gray-200 rounded w-2/12"></div>
                        <div class="h-6 bg-gray-200 rounded-full w-2/12"></div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    text(lines = 3) {
        return Array(lines).fill(0).map((_, i) => `
            <div class="h-4 bg-gray-200 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'} mb-2 animate-pulse"></div>
        `).join('');
    }
};

// ═══════════════════════════════════════════════════════
// LOADING BUTTON STATE
// ═══════════════════════════════════════════════════════
function setLoading(button, loading, text = 'Memuat...') {
    if (!button) return;
    if (loading) {
        button.dataset.originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = `<svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>${text}`;
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || text;
    }
}

// ═══════════════════════════════════════════════════════
// DARK MODE
// ═══════════════════════════════════════════════════════
window.DarkMode = {
    init() {
        const saved = localStorage.getItem('darkMode');
        if (saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    },
    
    toggle() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', isDark);
        return isDark;
    },
    
    isEnabled() {
        return document.documentElement.classList.contains('dark');
    }
};

// ═══════════════════════════════════════════════════════
// BREADCRUMBS
// ═══════════════════════════════════════════════════════
function renderBreadcrumbs(items) {
    const container = document.getElementById('breadcrumbs');
    if (!container) return;
    
    container.innerHTML = `
        <nav class="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <a href="/" class="hover:text-emerald-600 transition flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                Beranda
            </a>
            ${items.map((item, i) => `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                ${item.href ? `<a href="${item.href}" class="hover:text-emerald-600 transition">${item.label}</a>` : `<span class="text-gray-800 font-medium">${item.label}</span>`}
            `).join('')}
        </nav>
    `;
}

// ═══════════════════════════════════════════════════════
// REAL-TIME FORM VALIDATION
// ═══════════════════════════════════════════════════════
function initFormValidation() {
    document.querySelectorAll('input[required], textarea[required], select[required]').forEach(field => {
        const showError = (msg) => {
            field.classList.add('border-red-500', 'focus:ring-red-500');
            field.classList.remove('border-gray-200', 'focus:ring-emerald-500');
            let errorEl = field.parentElement.querySelector('.field-error');
            if (!errorEl) {
                errorEl = document.createElement('p');
                errorEl.className = 'field-error text-red-500 text-xs mt-1';
                field.parentElement.appendChild(errorEl);
            }
            errorEl.textContent = msg;
        };
        
        const clearError = () => {
            field.classList.remove('border-red-500', 'focus:ring-red-500');
            field.classList.add('border-gray-200', 'focus:ring-emerald-500');
            const errorEl = field.parentElement.querySelector('.field-error');
            if (errorEl) errorEl.remove();
        };
        
        field.addEventListener('blur', () => {
            if (!field.value.trim()) {
                showError('Field ini wajib diisi');
            } else {
                clearError();
            }
        });
        
        field.addEventListener('input', () => {
            if (field.classList.contains('border-red-500') && field.value.trim()) {
                clearError();
            }
        });
    });
    
    // NIK validation (16 digits)
    document.querySelectorAll('input[data-validate="nik"]').forEach(field => {
        field.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16);
        });
        
        field.addEventListener('blur', () => {
            if (field.value && field.value.length !== 16) {
                const errorEl = field.parentElement.querySelector('.field-error') || document.createElement('p');
                errorEl.className = 'field-error text-red-500 text-xs mt-1';
                errorEl.textContent = 'NIK harus 16 digit';
                if (!field.parentElement.querySelector('.field-error')) {
                    field.parentElement.appendChild(errorEl);
                }
                field.classList.add('border-red-500');
            }
        });
    });
}

// ═══════════════════════════════════════════════════════
// GLOBAL SEARCH
// ══════════════════════════════════════════════════════
window.GlobalSearch = {
    items: [],
    
    init(items) {
        this.items = items;
        this.createModal();
    },
    
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'search-modal';
        modal.className = 'fixed inset-0 z-[9999] hidden';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="GlobalSearch.close()"></div>
            <div class="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
                <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div class="flex items-center gap-3 p-4 border-b border-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input id="search-input-global" type="text" placeholder="Cari halaman, layanan, informasi..." class="flex-1 outline-none text-sm" oninput="GlobalSearch.filter(this.value)">
                        <kbd class="hidden sm:inline-block px-2 py-1 text-xs bg-gray-100 rounded">ESC</kbd>
                    </div>
                    <div id="search-results" class="max-h-96 overflow-y-auto p-2"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.open();
            }
            if (e.key === 'Escape') {
                this.close();
            }
        });
    },
    
    open() {
        const modal = document.getElementById('search-modal');
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => document.getElementById('search-input-global')?.focus(), 100);
        }
    },
    
    close() {
        const modal = document.getElementById('search-modal');
        if (modal) modal.classList.add('hidden');
        const input = document.getElementById('search-input-global');
        if (input) input.value = '';
    },
    
    filter(query) {
        const results = document.getElementById('search-results');
        if (!query || query.length < 2) {
            results.innerHTML = '<p class="text-sm text-gray-500 text-center py-8">Ketik minimal 2 karakter untuk mencari</p>';
            return;
        }
        
        const q = query.toLowerCase();
        const filtered = this.items.filter(item => 
            item.label.toLowerCase().includes(q) || 
            (item.desc && item.desc.toLowerCase().includes(q))
        );
        
        if (filtered.length === 0) {
            results.innerHTML = '<p class="text-sm text-gray-500 text-center py-8">Tidak ada hasil ditemukan</p>';
            return;
        }
        
        results.innerHTML = filtered.map(item => `
            <a href="${item.href}" class="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition">
                <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-800">${item.label}</p>
                    ${item.desc ? `<p class="text-xs text-gray-500">${item.desc}</p>` : ''}
                </div>
            </a>
        `).join('');
    }
};

// ─── Magnetic Hover Effect ────────────────────────────
function initMagneticHover() {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            const strength = parseFloat(el.dataset.magnetic) || 0.3;
            el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = 'translate(0, 0)';
            el.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        });

        el.addEventListener('mouseenter', () => {
            el.style.transition = 'none';
        });
    });
}

// ─── Text Scramble Effect ─────────────────────────────
if (typeof window.TextScramble === 'undefined') {
window.TextScramble = class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.originalText = el.textContent;
    }

    setText(newText) {
        const oldText = this.el.textContent;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise(resolve => this.resolve = resolve);
        
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }

        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }

    update() {
        let output = '';
        let complete = 0;
        
        for (let i = 0; i < this.queue.length; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.chars[Math.floor(Math.random() * this.chars.length)];
                    this.queue[i].char = char;
                }
                output += `<span style="opacity:0.6">${char}</span>`;
            } else {
                output += from;
            }
        }
        
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(() => this.update());
            this.frame++;
        }
    }
};
}

// ═══════════════════════════════════════════════════════
// SECURITY — Disable Right-Click & Inspect Element
// ═══════════════════════════════════════════════════════
(function() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // Disable keyboard shortcuts for dev tools
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I (Inspect)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+C (Element picker)
        if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
            e.preventDefault();
            return false;
        }
        // Ctrl+U (View source)
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
            e.preventDefault();
            return false;
        }
        // Ctrl+S (Save page)
        if (e.ctrlKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
            e.preventDefault();
            return false;
        }
    });

    // DevTools detection via window size difference
    let devtoolsOpen = false;
    function detectDevTools() {
        const threshold = 160;
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        const isOpen = widthDiff > threshold || heightDiff > threshold;
        if (isOpen && !devtoolsOpen) {
            devtoolsOpen = true;
            document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#064e3b;color:white;font-family:sans-serif;text-align:center;padding:2rem"><div><h1 style="font-size:2rem;margin-bottom:1rem">Akses Ditolak</h1><p style="opacity:0.8;font-size:1.1rem">Developer tools terdeteksi. Halaman ini tidak mengizinkan inspeksi kode.<br>Silakan tutup developer tools dan refresh halaman.</p></div></div>';
        } else if (!isOpen) {
            devtoolsOpen = false;
        }
    }
    setInterval(detectDevTools, 1000);

    // Disable drag on images
    document.addEventListener('dragstart', function(e) {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });

    // Disable text selection on sensitive elements
    document.addEventListener('selectstart', function(e) {
        if (e.target.closest('.no-select')) {
            e.preventDefault();
        }
    });
})();

// ─── Initialize Everything ────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    initScrollProgress();
    initNavbarScroll();
    initScrollAnimations();
    initGalleryLightbox();
    initNavigation();
    initNavigationLoader();
    initRippleEffect();
    initParallax();
    initTiltEffect();
    initMagneticHover();
    initCounters();
    DarkMode.init();
    initFormValidation();
    PageLoader.hide();
    
    // Initialize Global Search with all pages
    GlobalSearch.init([
        { label: 'Beranda', desc: 'Halaman utama desa', href: '/' },
        { label: 'Berita', desc: 'Informasi dan berita terkini', href: '/pages/berita' },
        { label: 'Galeri', desc: 'Dokumentasi kegiatan desa', href: '/pages/gallery' },
        { label: 'Lapak Desa', desc: 'Produk UMKM warga', href: '/pages/lapak-desa' },
        { label: 'Pengaduan', desc: 'Laporan dan pengaduan warga', href: '/pages/pengaduan' },
        { label: 'Bansos', desc: 'Data bantuan sosial', href: '/pages/bansos' },
        { label: 'PBB', desc: 'Pajak bumi dan bangunan', href: '/pages/pbb' },
        { label: 'Permohonan Surat Online', desc: 'Ajukan surat dari rumah', href: '/pages/login' },
        { label: 'Sejarah Desa', desc: 'Sejarah Desa Kasomalang Kulon', href: '/pages/profil/sejarah' },
        { label: 'Perangkat Desa', desc: 'Struktur organisasi desa', href: '/pages/profil/perangkat' },
        { label: 'Peta Wilayah', desc: 'Peta wilayah desa', href: '/pages/profil/wilayah' },
        { label: 'Data Penduduk', desc: 'Portal layanan warga', href: '/pages/user-portal' },
        { label: 'Formulir Pengajuan', desc: 'Formulir pengajuan layanan', href: '/pages/layanan/formulir' }
    ]);
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => console.log('[PWA] Service Worker registered:', reg.scope))
            .catch((err) => console.log('[PWA] Service Worker registration failed:', err));
    }
});
