/**
 * Модуль навигации для киноклуба Одиссея
 */
class NavigationModule {
    /**
     * Конструктор класса NavigationModule
     * Инициализирует данные навигации и состояние меню
     */
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
                        { title: "Крокодил", href: "crocodile-game.html", badge: "NEW" },
                        { title: "Рандомайзер", href: "randomizer.html", badge: "NEW" },
                        { title: "Тайный Санта", href: "santa-game.html", badge: "NEW" },
                    ]
                }
            ]
        };

        this.isMobileMenuOpen = false;
        this.currentOpenDropdown = null;
        this.resizeTimeout = null;
    }

    generateNavigation(currentPage = '') {
        return `
            <nav class="nav" aria-label="Основная навигация">
                ${this.navData.items.map((item, index) => this.generateNavItem(item, currentPage, index)).join('')}
            </nav>
        `;
    }

    /**
     * Генерирует HTML для пункта навигации
     * Создает HTML разметку для отдельного пункта меню с выпадающим списком
     * 
     * @param {Object} item - Объект с данными пункта меню
     * @param {string} currentPage - Текущая страница
     * @param {number} index - Индекс пункта меню
     * @returns {string} - HTML строка пункта меню
     */
    generateNavItem(item, currentPage, index) {
        const isActive = this.isItemActive(currentPage, index);
        return `
            <div class="nav-dropdown">
                <a href="${item.href}" class="nav__link dropdown-toggle ${isActive ? 'active' : ''}" 
                   aria-expanded="false" aria-haspopup="true">
                    ${item.title}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M3 4.5L6 7.5L9 4.5H3Z" />
                    </svg>
                </a>
                <div class="dropdown-menu" role="menu">
                    ${item.dropdown.map(dropdownItem => `
                        <a href="${dropdownItem.href}" class="dropdown-item" role="menuitem">
                            ${dropdownItem.title}${dropdownItem.badge ?
                            `<sup class="${dropdownItem.badge === 'DEMO' ? 'demo-badge' : 'demo-tiny'}">${dropdownItem.badge}</sup>` : ''}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Проверяет активность пункта меню
     * Определяет, является ли пункт меню активным для текущей страницы
     * 
     * @param {string} currentPage - Текущая страница
     * @param {number} index - Индекс пункта меню
     * @returns {boolean} - true если пункт активен, иначе false
     */
    isItemActive(currentPage, index) {
        const pageMap = {
            'index': 0,
            'setup-guide': 1,
            'games': 2
        };
        return pageMap[currentPage] === index;
    }

    /**
     * Инициализирует навигацию на странице
     * Вставляет навигацию в указанный контейнер и настраивает обработчики событий
     * 
     * @param {string} containerSelector - CSS селектор контейнера для навигации
     * @param {string} currentPage - Текущая страница
     */
    init(containerSelector, currentPage = '') {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        container.innerHTML = this.generateNavigation(currentPage);
        this.createMobileOverlay();
        this.attachEventListeners();
    }

    /**
     * Создает оверлей для мобильного меню
     */
    createMobileOverlay() {
        if (document.querySelector('.nav-overlay')) return;

        const overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => this.closeMobileMenu());
    }

    /**
     * Прикрепляет обработчики событий
     * Назначает обработчики для десктопных и мобильных взаимодействий
     */
    attachEventListeners() {
        // Обработчики для десктопного ховера
        document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            
            // Десктопные события
            if (window.innerWidth > 768) {
                dropdown.addEventListener('mouseenter', () => this.handleDropdownEnter(dropdown));
                dropdown.addEventListener('mouseleave', (e) => this.handleDropdownLeave(dropdown, e));
            }
            
            // Мобильные события
            toggle.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    this.handleMobileDropdownClick(dropdown);
                }
            });
        });

        // Глобальные обработчики
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-container')) {
                this.closeAllDropdowns();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllDropdowns();
                if (this.isMobileMenuOpen) this.closeMobileMenu();
            }
        });

        window.addEventListener('resize', () => this.handleResize());
        this.attachMobileMenuListener();
    }

    /**
     * Обрабатывает наведение на выпадающее меню (десктоп)
     * Открывает выпадающее меню при наведении курсора
     * 
     * @param {HTMLElement} dropdown - Элемент выпадающего меню
     */
    handleDropdownEnter(dropdown) {
        if (window.innerWidth <= 768) return;
        
        this.currentOpenDropdown && this.closeDropdown(this.currentOpenDropdown);
        this.openDropdown(dropdown);
    }

    /**
     * Обрабатывает уход курсора с выпадающего меню (десктоп)
     * Закрывает выпадающее меню с задержкой при уходе курсора
     * 
     * @param {HTMLElement} dropdown - Элемент выпадающего меню
     * @param {Event} e - Событие mouseleave
     */
    handleDropdownLeave(dropdown, e) {
        if (window.innerWidth <= 768) return;
        if (e.relatedTarget && dropdown.contains(e.relatedTarget)) return;
        
        this.closeDropdown(dropdown);
    }

    /**
     * Обрабатывает клик по выпадающему меню (мобильные)
     * Переключает состояние выпадающего меню на мобильных устройствах
     * 
     * @param {HTMLElement} dropdown - Элемент выпадающего меню
     */
    handleMobileDropdownClick(dropdown) {
        document.querySelectorAll('.nav-dropdown').forEach(d => {
            if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.toggle('open');
        
        const toggle = dropdown.querySelector('.dropdown-toggle');
        toggle.setAttribute('aria-expanded', dropdown.classList.contains('open'));
    }

    openDropdown(dropdown) {
        dropdown.classList.add('open');
        this.currentOpenDropdown = dropdown;
        
        const toggle = dropdown.querySelector('.dropdown-toggle');
        toggle.setAttribute('aria-expanded', 'true');
    }

    closeDropdown(dropdown) {
        dropdown.classList.remove('open');
        if (this.currentOpenDropdown === dropdown) {
            this.currentOpenDropdown = null;
        }
        
        const toggle = dropdown.querySelector('.dropdown-toggle');
        toggle.setAttribute('aria-expanded', 'false');
    }

    attachMobileMenuListener() {
        const btn = document.querySelector('.mobile-menu-btn');
        if (!btn) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMobileMenu();
        });
    }

    toggleMobileMenu() {
        const nav = document.querySelector('.nav');
        const btn = document.querySelector('.mobile-menu-btn');
        const overlay = document.querySelector('.nav-overlay');

        if (!nav || !btn) return;

        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        btn.classList.toggle('active', this.isMobileMenuOpen);

        if (this.isMobileMenuOpen) {
            nav.classList.add('mobile-open');
            btn.innerHTML = '✕';
            btn.setAttribute('aria-label', 'Закрыть меню');
            overlay.classList.add('active');
            document.body.classList.add('menu-open');
        } else {
            this.closeMobileMenu();
        }
    }

    closeMobileMenu() {
        const nav = document.querySelector('.nav');
        const btn = document.querySelector('.mobile-menu-btn');
        const overlay = document.querySelector('.nav-overlay');

        if (nav) nav.classList.remove('mobile-open');
        if (btn) {
            btn.innerHTML = '☰';
            btn.classList.remove('active');
            btn.setAttribute('aria-label', 'Открыть меню');
        }
        if (overlay) overlay.classList.remove('active');

        document.body.classList.remove('menu-open');
        this.isMobileMenuOpen = false;
        this.closeAllDropdowns();
    }

    closeAllDropdowns() {
        document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
            this.closeDropdown(dropdown);
        });
        this.currentOpenDropdown = null;
    }

    handleResize() {
        // Дебаунс ресайза
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            if (window.innerWidth > 768 && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            } else if (window.innerWidth <= 768) {
                this.closeAllDropdowns();
            }
        }, 150);
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('index.html') || path.endsWith('/') || path.includes('/kinoclub-odisseya/')) return 'index';
    if (path.includes('setup-guide.html')) return 'setup-guide';
    if (path.includes('quiz.html') || path.includes('Interactive-game.html') || 
        path.includes('crocodile-game.html') || path.includes('randomizer.html') ||
        path.includes('santa-game.html')) return 'games';
    return '';
}

function initNavigation(currentPage = '') {
    try {
        new NavigationModule().init('.nav-container', currentPage);
    } catch (error) {
        console.error('Failed to initialize navigation:', error);
    }
}

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initNavigation(getCurrentPage()));
} else {
    initNavigation(getCurrentPage());
}
