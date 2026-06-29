// ==============================
// SI-KASKUL — Premium Interactive Layer
// ==============================

// ─── Page Loader ───────────────────────────────────────
const PageLoader = {
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
    document.querySelectorAll('a[href$=".html"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
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
const API_BASE_URL = window.__API_BASE_URL__ || (
    window.location.protocol === 'file:' || 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3003/api'
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
class TextScramble {
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
}

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
    PageLoader.hide();
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
