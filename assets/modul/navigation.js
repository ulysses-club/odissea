class NavigationModule {
    constructor() {
        // Данные навигации для всех страниц
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
                        { title: "Тайный Санта", href: "santa-game.html", badge: "NEW" }
                    ]
                }
            ]
        };

        this.state = {
            isMobileMenuOpen: false,
            currentOpenDropdown: null,
            isMobileView: window.innerWidth <= 768,
            closeDropdownTimeout: null, // Таймер для задержки закрытия
            isHoveringDropdown: false   // Флаг наведения на dropdown
        };

        // Кэш DOM элементов
        this.elements = {};

        // Дебаунс для ресайза
        this.debouncedResize = this.debounce(this.handleResize.bind(this), 150);

        // Привязываем обработчики с сохранением контекста и события
        this.boundHandleDropdownEnter = this.handleDropdownEnter.bind(this);
        this.boundHandleDropdownLeave = this.handleDropdownLeave.bind(this);
        this.boundHandleMenuEnter = this.handleMenuEnter.bind(this);
        this.boundHandleMenuLeave = this.handleMenuLeave.bind(this);
        this.boundHandleClick = this.handleClick.bind(this);
        this.boundHandleKeydown = this.handleKeydown.bind(this);
    }

    /**
     * Инициализация модуля
     */
    init(containerSelector = '.nav-container') {
        try {
            const container = document.querySelector(containerSelector);
            if (!container) {
                console.warn(`Навигация: контейнер ${containerSelector} не найден`);
                return;
            }

            // Определяем текущую страницу
            const currentPage = this.getCurrentPage();

            // Генерируем и вставляем навигацию
            container.innerHTML = this.generateNavigation(currentPage);

            // Кэшируем элементы
            this.cacheElements();

            // Настраиваем обработчики
            this.setupEventListeners();

            // Создаем оверлей для мобильного меню
            this.createMobileOverlay();

            console.log('Навигация инициализирована');
        } catch (error) {
            console.error('Ошибка инициализации навигации:', error);
        }
    }

    /**
     * Кэширование DOM элементов
     */
    cacheElements() {
        this.elements = {
            nav: document.querySelector('.nav'),
            mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
            overlay: document.querySelector('.nav-overlay'),
            dropdowns: document.querySelectorAll('.nav-dropdown')
        };
    }

    /**
     * Определение текущей страницы
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || '';

        if (page === 'index.html' || page === '' || path.includes('/kinoclub-odisseya/')) return 'index';
        if (page.includes('setup-guide')) return 'setup-guide';
        if (page.includes('quiz') || page.includes('Interactive-game') ||
            page.includes('crocodile-game') || page.includes('randomizer') ||
            page.includes('santa-game')) return 'games';

        return '';
    }

    /**
     * Генерация HTML навигации
     */
    generateNavigation(currentPage) {
        return `
            <nav class="nav" role="navigation" aria-label="Основное меню">
                ${this.navData.items.map((item, index) =>
            this.generateNavItem(item, currentPage, index)
        ).join('')}
            </nav>
        `;
    }

    /**
     * Генерация отдельного пункта меню
     */
    generateNavItem(item, currentPage, index) {
        const isActive = this.isItemActive(currentPage, index);
        const hasBadge = item.dropdown.some(subItem => subItem.badge);

        return `
            <div class="nav-dropdown" data-index="${index}">
                <a href="${item.href}" 
                   class="nav__link dropdown-toggle ${isActive ? 'active' : ''}" 
                   aria-expanded="false" 
                   aria-haspopup="true"
                   ${isActive ? 'aria-current="page"' : ''}>
                    ${item.title}
                    ${hasBadge ? '<span class="dropdown-indicator" aria-hidden="true">▼</span>' : ''}
                </a>
                <div class="dropdown-menu" role="menu" aria-hidden="true">
                    ${item.dropdown.map(subItem => `
                        <a href="${subItem.href}" 
                           class="dropdown-item" 
                           role="menuitem"
                           ${subItem.badge ? `data-badge="${subItem.badge}"` : ''}>
                            ${subItem.title}
                            ${subItem.badge ?
                `<span class="badge ${subItem.badge.toLowerCase()}-badge" aria-label="${subItem.badge} версия">
                                    ${subItem.badge}
                                </span>` : ''
            }
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Проверка активности пункта
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
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Делегирование событий для выпадающих меню
        document.addEventListener('mouseenter', this.boundHandleDropdownEnter, true);
        document.addEventListener('mouseleave', this.boundHandleDropdownLeave, true);
        document.addEventListener('click', this.boundHandleClick);
        document.addEventListener('keydown', this.boundHandleKeydown);

        // События для кнопки мобильного меню
        if (this.elements.mobileMenuBtn) {
            this.elements.mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMobileMenu();
            });
        }

        // Добавляем обработчики для самого выпадающего меню
        document.addEventListener('mouseenter', this.boundHandleMenuEnter, true);
        document.addEventListener('mouseleave', this.boundHandleMenuLeave, true);

        // Событие ресайза
        window.addEventListener('resize', this.debouncedResize);
    }

    /**
     * Обработчик наведения на выпадающее меню (десктоп)
     */
    handleDropdownEnter(e) {
        if (this.state.isMobileView) return;

        const target = e.target;
        if (!target || !target.closest) return;

        const dropdown = target.closest('.nav-dropdown');
        if (dropdown) {
            // Очищаем таймер закрытия
            if (this.state.closeDropdownTimeout) {
                clearTimeout(this.state.closeDropdownTimeout);
                this.state.closeDropdownTimeout = null;
            }
            this.openDropdown(dropdown);
        }
    }

    /**
     * Обработчик ухода с выпадающего меню (десктоп)
     */
    handleDropdownLeave(e) {
        if (this.state.isMobileView) return;

        const target = e.target;
        if (!target || !target.closest) return;

        const dropdown = target.closest('.nav-dropdown');
        if (dropdown && this.state.currentOpenDropdown === dropdown) {
            // Не закрываем сразу, если курсор перешел в меню
            if (this.state.isHoveringDropdown) return;

            // Задержка перед закрытием (100ms)
            this.state.closeDropdownTimeout = setTimeout(() => {
                if (!this.state.isHoveringDropdown) {
                    this.closeDropdown(dropdown);
                }
            }, 100);
        }
    }

    /**
     * Обработчик наведения на само меню
     */
    handleMenuEnter(e) {
        if (this.state.isMobileView) return;

        const target = e.target;
        if (!target || !target.closest) return;

        const menu = target.closest('.dropdown-menu');
        if (menu) {
            this.state.isHoveringDropdown = true;
            // Очищаем таймер закрытия
            if (this.state.closeDropdownTimeout) {
                clearTimeout(this.state.closeDropdownTimeout);
                this.state.closeDropdownTimeout = null;
            }
        }
    }

    /**
     * Обработчик ухода с меню
     */
    handleMenuLeave(e) {
        if (this.state.isMobileView) return;

        const target = e.target;
        if (!target || !target.closest) return;

        const menu = target.closest('.dropdown-menu');
        if (menu && !menu.contains(e.relatedTarget)) {
            this.state.isHoveringDropdown = false;

            const dropdown = menu.closest('.nav-dropdown');
            if (dropdown && this.state.currentOpenDropdown === dropdown) {
                // Задержка перед закрытием (100ms)
                this.state.closeDropdownTimeout = setTimeout(() => {
                    this.closeDropdown(dropdown);
                }, 100);
            }
        }
    }

    /**
     * Обработчик кликов
     */
    handleClick(e) {
        const target = e.target;
        if (!target || !target.closest) return;

        const dropdown = target.closest('.nav-dropdown');
        const toggle = target.closest('.dropdown-toggle');

        // Клик по переключателю на мобильном
        if (toggle && this.state.isMobileView) {
            e.preventDefault();
            this.toggleMobileDropdown(dropdown);
            return;
        }

        // Клик вне навигации
        if (!target.closest('.nav-container')) {
            this.closeAllDropdowns();
            if (this.state.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        }

        // Клик по ссылке в мобильном меню
        if (this.state.isMobileMenuOpen && target.closest('.dropdown-item')) {
            setTimeout(() => this.closeMobileMenu(), 300);
        }
    }

    /**
     * Обработчик клавиатуры
     */
    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.closeAllDropdowns();
            if (this.state.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        }

        // Навигация Tab внутри выпадающего меню
        if (e.key === 'Tab' && this.state.currentOpenDropdown) {
            const menu = this.state.currentOpenDropdown.querySelector('.dropdown-menu');
            const items = menu.querySelectorAll('.dropdown-item');
            const activeElement = document.activeElement;

            if (activeElement === items[items.length - 1] && !e.shiftKey) {
                e.preventDefault();
                this.closeDropdown(this.state.currentOpenDropdown);
            }
        }
    }

    /**
     * Открытие выпадающего меню
     */
    openDropdown(dropdown) {
        if (this.state.currentOpenDropdown && this.state.currentOpenDropdown !== dropdown) {
            this.closeDropdown(this.state.currentOpenDropdown);
        }

        dropdown.classList.add('open');
        const menu = dropdown.querySelector('.dropdown-menu');
        const toggle = dropdown.querySelector('.dropdown-toggle');

        menu.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', 'true');

        this.state.currentOpenDropdown = dropdown;
    }

    /**
     * Закрытие выпадающего меню
     */
    closeDropdown(dropdown) {
        if (!dropdown) return;

        dropdown.classList.remove('open');
        const menu = dropdown.querySelector('.dropdown-menu');
        const toggle = dropdown.querySelector('.dropdown-toggle');

        menu.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');

        if (this.state.currentOpenDropdown === dropdown) {
            this.state.currentOpenDropdown = null;
        }

        // Сбрасываем флаг
        this.state.isHoveringDropdown = false;
    }

    /**
     * Переключение выпадающего меню на мобильном
     */
    toggleMobileDropdown(dropdown) {
        const isOpening = !dropdown.classList.contains('open');

        // Закрываем другие открытые dropdowns
        this.elements.dropdowns.forEach(d => {
            if (d !== dropdown && d.classList.contains('open')) {
                this.closeDropdown(d);
            }
        });

        if (isOpening) {
            this.openDropdown(dropdown);
        } else {
            this.closeDropdown(dropdown);
        }
    }

    /**
     * Переключение мобильного меню
     */
    toggleMobileMenu() {
        if (this.state.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    /**
     * Открытие мобильного меню
     */
    openMobileMenu() {
        this.elements.nav?.classList.add('mobile-open');
        this.elements.mobileMenuBtn?.classList.add('active');
        this.elements.overlay?.classList.add('active');
        document.body.classList.add('menu-open');

        this.elements.mobileMenuBtn?.setAttribute('aria-label', 'Закрыть меню');
        this.state.isMobileMenuOpen = true;

        // Закрываем все dropdowns при открытии мобильного меню
        this.closeAllDropdowns();
    }

    /**
     * Закрытие мобильного меню
     */
    closeMobileMenu() {
        this.elements.nav?.classList.remove('mobile-open');
        this.elements.mobileMenuBtn?.classList.remove('active');
        this.elements.overlay?.classList.remove('active');
        document.body.classList.remove('menu-open');

        this.elements.mobileMenuBtn?.setAttribute('aria-label', 'Открыть меню');
        this.state.isMobileMenuOpen = false;
        this.closeAllDropdowns();
    }

    /**
     * Закрытие всех выпадающих меню
     */
    closeAllDropdowns() {
        // Очищаем таймер
        if (this.state.closeDropdownTimeout) {
            clearTimeout(this.state.closeDropdownTimeout);
            this.state.closeDropdownTimeout = null;
        }

        this.elements.dropdowns?.forEach(dropdown => {
            this.closeDropdown(dropdown);
        });
        this.state.currentOpenDropdown = null;
        this.state.isHoveringDropdown = false;
    }

    /**
     * Создание оверлея для мобильного меню
     */
    createMobileOverlay() {
        if (document.querySelector('.nav-overlay')) return;

        const overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => this.closeMobileMenu());
        this.elements.overlay = overlay;
    }

    /**
     * Обработчик изменения размера окна
     */
    handleResize() {
        const isNowMobile = window.innerWidth <= 768;

        // Если изменился режим (десктоп/мобильный)
        if (this.state.isMobileView !== isNowMobile) {
            this.state.isMobileView = isNowMobile;

            // При переходе на десктоп закрываем мобильное меню
            if (!isNowMobile && this.state.isMobileMenuOpen) {
                this.closeMobileMenu();
            }

            // Закрываем все dropdowns при смене режима
            this.closeAllDropdowns();
        }
    }

    /**
     * Утилита дебаунса
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Уничтожение модуля (cleanup)
     */
    destroy() {
        window.removeEventListener('resize', this.debouncedResize);
        document.removeEventListener('mouseenter', this.boundHandleDropdownEnter);
        document.removeEventListener('mouseleave', this.boundHandleDropdownLeave);
        document.removeEventListener('click', this.boundHandleClick);
        document.removeEventListener('keydown', this.boundHandleKeydown);
        document.removeEventListener('mouseenter', this.boundHandleMenuEnter);
        document.removeEventListener('mouseleave', this.boundHandleMenuLeave);

        // Очищаем таймер
        if (this.state.closeDropdownTimeout) {
            clearTimeout(this.state.closeDropdownTimeout);
        }

        if (this.elements.overlay) {
            this.elements.overlay.remove();
        }
    }
}

/**
 * Автоматическая инициализация при загрузке DOM
 */
function initNavigation() {
    // Создаем инстанс только если есть контейнер для навигации
    const navContainer = document.querySelector('.nav-container');
    if (!navContainer) return;

    // Инициализируем навигацию
    const navigation = new NavigationModule();
    navigation.init();

    // Делаем доступной глобально для отладки
    window.__navigation = navigation;
}

// Запускаем инициализацию
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationModule;
}
