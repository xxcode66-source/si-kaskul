// Global Utilities
const PageLoader = {
    show: function(message = 'Memuat...') {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.classList.remove('hidden');
            const text = loader.querySelector('.loader-text');
            if (text) text.textContent = message;
        }
    },
    
    hide: function() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 300);
        }
    }
};

// Mobile Menu Toggle
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Scroll Animations
function initScrollAnimations() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// Gallery Lightbox
function initGalleryLightbox() {
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const src = item.querySelector('img').src;
            if (src) {
                const lightbox = document.getElementById('lightbox');
                if (lightbox) {
                    document.getElementById('lightbox-img').src = src;
                    lightbox.classList.add('active');
                }
            }
        });
    });
    
    // Close lightbox
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
            }
        });
    }
}

// Navigation scroll spy
function initNavigation() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
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
            setTimeout(() => {
                window.location.href = href;
            }, 220);
        });
    });
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
}

// Format date
function formatDate(date) {
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

// API Base URL
const API_BASE_URL = window.__API_BASE_URL__ || (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : `${window.location.origin}/api`);

// Fetch dengan loading
async function fetchWithLoader(url, options = {}) {
    PageLoader.show('Memuat...');
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        PageLoader.hide();
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        PageLoader.hide();
        throw error;
    }
}

// Initialize all on page load
window.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initGalleryLightbox();
    initNavigation();
    initNavigationLoader();
    PageLoader.hide();
    lucide.createIcons();
});
