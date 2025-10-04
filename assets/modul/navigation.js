/**
 * Модуль навигации для киноклуба Одиссея
 */
class NavigationModule {
    constructor() {
        this.navData = {
            items: [
                {
                    title: "Главная",
                    href: "index.html",
                    dropdown: [
                        { title: "О киноклубе", href: "index.html#about" },
                        { title: "Топы", href: "index.html#top-films" },
                        { title: "Контакты", href: "index.html#contacts" },
                        { title: "Фильмы", href: "index.html#film-archive" }
                    ]
                },
                {
                    title: "Настройка устройств",
                    href: "setup-guide.html",
                    dropdown: [
                        { title: "Телевизоры", href: "setup-guide.html#tv-setup" },
                        { title: "Компьютеры", href: "setup-guide.html#pc-setup" },
                        { title: "Телефоны", href: "setup-guide.html#phone-setup" }
                    ]
                },
                {
                    title: "Игры",
                    href: "crocodile-game.html",
                    dropdown: [
                        { title: "Квиз Odissea", href: "quiz.html", badge: "DEMO" },
                        { title: "Интерактивная игра", href: "Interactive-game.html" },
                        { title: "Крокодил", href: "crocodile-game.html", badge: "NEW" }
                    ]
                }
            ]
        };

        this.isMobileMenuOpen = false;
        this.hoverTimeouts = new Map();
        this.currentOpenDropdown = null;
    }

    generateNavigation(currentPage = '') {
        return `
            <nav class="nav" aria-label="Основная навигация">
                ${this.navData.items.map((item, index) => this.generateNavItem(item, currentPage, index)).join('')}
            </nav>
        `;
    }

    generateNavItem(item, currentPage, index) {
        const isActive = this.isItemActive(currentPage, index);
        return `
            <div class="nav-dropdown">
                <a href="${item.href}" class="nav__link dropdown-toggle ${isActive ? 'active' : ''}">
                    ${item.title}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M3 4.5L6 7.5L9 4.5H3Z" />
                    </svg>
                </a>
                <div class="dropdown-menu">
                    ${item.dropdown.map(dropdownItem => `
                        <a href="${dropdownItem.href}" class="dropdown-item">
                            ${dropdownItem.title}${dropdownItem.badge ?
                `<sup class="${dropdownItem.badge === 'DEMO' ? 'demo-badge' : 'demo-tiny'}">${dropdownItem.badge}</sup>` : ''}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    isItemActive(currentPage, index) {
        const pageMap = { 'index': 0, 'setup-guide': 1, 'games': 2 };
        return pageMap[currentPage] === index;
    }

    init(containerSelector, currentPage = '') {
        const container = document.querySelector(containerSelector);
        if (!container) return console.error('Navigation container not found:', containerSelector);

        container.innerHTML = this.generateNavigation(currentPage);
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Десктопные обработчики
        document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
            dropdown.addEventListener('mouseenter', () => this.handleDropdownEnter(dropdown));
            dropdown.addEventListener('mouseleave', (e) => this.handleDropdownLeave(dropdown, e));

            dropdown.querySelector('.dropdown-toggle').addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    this.handleMobileDropdownClick(dropdown);
                }
            });
        });

        // Обработчики для выпадающих меню
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            const dropdown = menu.parentElement;
            menu.addEventListener('mouseenter', () => this.cancelDropdownClose(dropdown));
            menu.addEventListener('mouseleave', () => this.scheduleDropdownClose(dropdown));
        });

        // Глобальные обработчики
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-container')) {
                this.closeAllDropdowns();
                this.isMobileMenuOpen && this.closeMobileMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllDropdowns();
                this.isMobileMenuOpen && this.closeMobileMenu();
            }
        });

        window.addEventListener('resize', () => this.handleResize());
        this.attachMobileMenuListener();
    }

    handleDropdownEnter(dropdown) {
        if (window.innerWidth <= 768) return;

        this.cancelDropdownClose(dropdown);
        this.currentOpenDropdown && this.closeDropdown(this.currentOpenDropdown);
        this.openDropdown(dropdown);
    }

    handleDropdownLeave(dropdown, e) {
        if (window.innerWidth <= 768) return;
        if (e.relatedTarget && dropdown.contains(e.relatedTarget)) return;

        this.scheduleDropdownClose(dropdown);
    }

    handleMobileDropdownClick(dropdown) {
        document.querySelectorAll('.nav-dropdown').forEach(d => {
            if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.toggle('open');
    }

    openDropdown(dropdown) {
        dropdown.classList.add('open');
        this.currentOpenDropdown = dropdown;
    }

    closeDropdown(dropdown) {
        dropdown.classList.remove('open');
        this.currentOpenDropdown === dropdown && (this.currentOpenDropdown = null);
        this.cancelDropdownClose(dropdown);
    }

    scheduleDropdownClose(dropdown) {
        this.cancelDropdownClose(dropdown);
        const timeoutId = setTimeout(() => {
            this.closeDropdown(dropdown);
            this.hoverTimeouts.delete(dropdown);
        }, 2000);
        this.hoverTimeouts.set(dropdown, timeoutId);
    }

    cancelDropdownClose(dropdown) {
        const timeoutId = this.hoverTimeouts.get(dropdown);
        timeoutId && (clearTimeout(timeoutId), this.hoverTimeouts.delete(dropdown));
    }

    attachMobileMenuListener() {
        const btn = document.querySelector('.mobile-menu-btn');
        if (!btn) return;

        const newBtn = btn.cloneNode(true);
        btn.replaceWith(newBtn);
        newBtn.addEventListener('click', (e) => (e.stopPropagation(), this.toggleMobileMenu()));
    }

    toggleMobileMenu() {
        const nav = document.querySelector('.nav');
        const btn = document.querySelector('.mobile-menu-btn');
        if (!nav || !btn) return;

        this.isMobileMenuOpen = !this.isMobileMenuOpen;

        if (this.isMobileMenuOpen) {
            nav.classList.add('mobile-open');
            btn.innerHTML = '✕';
            document.body.classList.add('menu-open');
        } else {
            this.closeMobileMenu();
        }
    }

    closeMobileMenu() {
        const nav = document.querySelector('.nav');
        const btn = document.querySelector('.mobile-menu-btn');
        nav && btn && (
            nav.classList.remove('mobile-open'),
            btn.innerHTML = '☰',
            document.body.classList.remove('menu-open'),
            this.isMobileMenuOpen = false,
            this.closeAllDropdowns()
        );
    }

    closeAllDropdowns() {
        document.querySelectorAll('.nav-dropdown').forEach(dropdown => this.closeDropdown(dropdown));
        this.hoverTimeouts.clear();
        this.currentOpenDropdown = null;
    }

    handleResize() {
        if (window.innerWidth > 768 && this.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else if (window.innerWidth <= 768) {
            this.closeAllDropdowns();
        }
    }
}

// Инициализация навигации
function initNavigation(currentPage = '') {
    try {
        new NavigationModule().init('.nav-container', currentPage);
    } catch (error) {
        console.error('Failed to initialize navigation:', error);
    }
}

// Автоматическая инициализация
const getCurrentPage = () => {
    const path = window.location.pathname;
    if (path.includes('index.html') || path.endsWith('/') || path.includes('/kinoclub-odisseya/')) return 'index';
    if (path.includes('setup-guide.html')) return 'setup-guide';
    if (path.includes('quiz.html') || path.includes('Interactive-game.html') || path.includes('crocodile-game.html')) return 'games';
    return '';
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initNavigation(getCurrentPage()));
} else {
    initNavigation(getCurrentPage());
}
