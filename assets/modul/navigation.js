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
                        { title: "Рандомайзер", href: "randomizer.html", badge: "NEW" }
                    ]
                },
                {
                    title: "Игры",
                    href: "crocodile-game.html",
                    dropdown: [
                        { title: "Тайный Санта", href: "santa-game.html", badge: "NEW" },
                        { title: "Квиз Odissea", href: "quiz.html", badge: "DEMO" },
                        { title: "Интерактивная игра", href: "Interactive-game.html" },
                        { title: "Крокодил", href: "crocodile-game.html" },
                        { title: "Рандомайзер", href: "randomizer.html" }
                    ]
                }
            ]
        };

        this.isMobileMenuOpen = false;
        this.hoverTimeouts = new Map();
        this.currentOpenDropdown = null;
    }

    /**
     * Генерирует HTML для навигации
     * Создает полную HTML разметку навигационного меню
     * 
     * @param {string} currentPage - Текущая страница для определения активного пункта
     * @returns {string} - HTML строка навигационного меню
     */
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
            'games': 2,
            'santa-game': 2,
            'randomizer': 2
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
        if (!container) return console.error('Navigation container not found:', containerSelector);

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

        overlay.addEventListener('click', () => {
            this.closeMobileMenu();
        });
    }

    /**
     * Прикрепляет обработчики событий
     * Назначает обработчики для десктопных и мобильных взаимодействий
     */
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

    /**
     * Обрабатывает наведение на выпадающее меню (десктоп)
     * Открывает выпадающее меню при наведении курсора
     * 
     * @param {HTMLElement} dropdown - Элемент выпадающего меню
     */
    handleDropdownEnter(dropdown) {
        if (window.innerWidth <= 768) return;

        this.cancelDropdownClose(dropdown);
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

        this.scheduleDropdownClose(dropdown);
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
    }

    /**
     * Открывает выпадающее меню
     * Добавляет класс open к выпадающему меню
     * 
     * @param {HTMLElement} dropdown - Элемент выпадающего меню
     */
    openDropdown(dropdown) {
        dropdown.classList.add('open');
        this.currentOpenDropdown = dropdown;
    }

    /**
     * Закрывает выпадающее меню
     * Удаляет класс open у выпадающего меню
     * 
     * @param {HTMLElement} dropdown - Элемент выпадающего меню
     */
    closeDropdown(dropdown) {
        dropdown.classList.remove('open');
        this.currentOpenDropdown === dropdown && (this.currentOpenDropdown = null);
        this.cancelDropdownClose(dropdown);
    }

    /**
     * Запланировать закрытие выпадающего меню
     * Устанавливает таймаут для закрытия меню через 2 секунды
     * 
     * @param {HTMLElement} dropdown - Элемент выпадающего меню
     */
    scheduleDropdownClose(dropdown) {
        this.cancelDropdownClose(dropdown);
        const timeoutId = setTimeout(() => {
            this.closeDropdown(dropdown);
            this.hoverTimeouts.delete(dropdown);
        }, 2000);
        this.hoverTimeouts.set(dropdown, timeoutId);
    }

    /**
     * Отменить запланированное закрытие выпадающего меню
     * Отменяет таймаут закрытия меню
     * 
     * @param {HTMLElement} dropdown - Элемент выпадающего меню
     */
    cancelDropdownClose(dropdown) {
        const timeoutId = this.hoverTimeouts.get(dropdown);
        timeoutId && (clearTimeout(timeoutId), this.hoverTimeouts.delete(dropdown));
    }

    /**
     * Прикрепляет обработчик мобильного меню
     * Назначает обработчик клика для кнопки мобильного меню
     */
    attachMobileMenuListener() {
        const btn = document.querySelector('.mobile-menu-btn');
        if (!btn) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMobileMenu();
        });
    }

    /**
     * Переключает состояние мобильного меню
     * Открывает или закрывает мобильное меню
     */
    toggleMobileMenu() {
        const nav = document.querySelector('.nav');
        const btn = document.querySelector('.mobile-menu-btn');
        const overlay = document.querySelector('.nav-overlay');

        if (!nav || !btn) return;

        this.isMobileMenuOpen = !this.isMobileMenuOpen;

        if (this.isMobileMenuOpen) {
            nav.classList.add('mobile-open');
            btn.innerHTML = '✕';
            overlay.classList.add('active');
            document.body.classList.add('menu-open');
        } else {
            this.closeMobileMenu();
        }
    }

    /**
     * Закрывает мобильное меню
     * Сбрасывает состояние мобильного меню в закрытое положение
     */
    closeMobileMenu() {
        const nav = document.querySelector('.nav');
        const btn = document.querySelector('.mobile-menu-btn');
        const overlay = document.querySelector('.nav-overlay');

        if (nav) nav.classList.remove('mobile-open');
        if (btn) btn.innerHTML = '☰';
        if (overlay) overlay.classList.remove('active');

        document.body.classList.remove('menu-open');
        this.isMobileMenuOpen = false;
        this.closeAllDropdowns();
    }

    /**
     * Закрывает все выпадающие меню
     * Сбрасывает состояние всех открытых выпадающих меню
     */
    closeAllDropdowns() {
        document.querySelectorAll('.nav-dropdown').forEach(dropdown => this.closeDropdown(dropdown));
        this.hoverTimeouts.clear();
        this.currentOpenDropdown = null;
    }

    /**
     * Обрабатывает изменение размера окна
     * Адаптирует поведение меню при изменении размера экрана
     */
    handleResize() {
        if (window.innerWidth > 768 && this.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else if (window.innerWidth <= 768) {
            this.closeAllDropdowns();
        }
    }
}

/**
 * Функция инициализации навигации
 * Создает экземпляр NavigationModule и инициализирует навигацию
 * 
 * @param {string} currentPage - Текущая страница
 */
function initNavigation(currentPage = '') {
    try {
        new NavigationModule().init('.nav-container', currentPage);
    } catch (error) {
        console.error('Failed to initialize navigation:', error);
    }
}

/**
 * Определяет текущую страницу
 * Анализирует URL для определения типа текущей страницы
 * 
 * @returns {string} - Ключ текущей страницы
 */
const getCurrentPage = () => {
    const path = window.location.pathname;
    if (path.includes('index.html') || path.endsWith('/') || path.includes('/kinoclub-odisseya/')) return 'index';
    if (path.includes('setup-guide.html')) return 'setup-guide';
    if (path.includes('quiz.html') || path.includes('Interactive-game.html') || path.includes('crocodile-game.html') || path.includes('randomizer.html')) return 'games';
    return '';
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initNavigation(getCurrentPage()));
} else {
    initNavigation(getCurrentPage());
}
