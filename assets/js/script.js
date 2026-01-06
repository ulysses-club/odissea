/**
 * КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ
 * @typedef {Object} AppConfig
 * @property {Object} defaults - Настройки по умолчанию
 * @property {Object} messages - Системные сообщения
 */
const CONFIG = {
    defaults: {
        poster: '../images/default-poster.jpg',
        maxRating: 10
    },
    messages: {
        loading: 'Загрузка данных...',
        noData: 'Нет данных для отображения',
        connectionError: 'Ошибка подключения',
        retry: 'Попробовать снова',
        offline: 'Вы сейчас офлайн'
    }
};

/**
 * СОСТОЯНИЕ ПРИЛОЖЕНИЯ
 * @typedef {Object} AppState
 * @property {boolean} isOnline - Статус подключения к сети
 */
const STATE = {
    isOnline: navigator.onLine
};

/**
 * DOM КЭШ
 * @typedef {Object} DOMCache
 * Кэшированные DOM-элементы для быстрого доступа
 */
const DOM = {};

/**
 * ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
 * @method initApp
 * @description Основная функция инициализации всех модулей
 * Вызывается при загрузке DOM, запускает все необходимые модули
 */
function initApp() {
    console.log('🎬 Инициализация Киноклуба "Одиссея"...');

    initMobileMenu();      // Мобильная навигация
    initSmoothScroll();    // Плавная прокрутка
    initScrollAnimations();// Анимации при скролле
    initFAQAnimations();   // Анимации FAQ
    initSeasonEffects();   // Сезонные эффекты
    initWeatherModule();   // Модуль погоды
    initVKSyncModule();    // Синхронизация с ВК

    // Инициализация кэша DOM-элементов
    cacheDOMElements();

    console.log('✅ Приложение инициализировано');
}

/**
 * ИНИЦИАЛИЗАЦИЯ FAQ АНИМАЦИЙ
 * @method initFAQAnimations
 * @description Простые анимации для FAQ элементов при скролле
 * @optimization Использует Intersection Observer с минимальными настройками
 */
function initFAQAnimations() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.faq-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            observer.observe(el);
        });
    }
}

/**
 * КЭШИРОВАНИЕ DOM-ЭЛЕМЕНТОВ
 * @method cacheDOMElements
 * @description Сохраняет часто используемые DOM-элементы в кэш для быстрого доступа
 */
function cacheDOMElements() {
    DOM.header = document.querySelector('.header');
    DOM.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    DOM.nav = document.querySelector('.nav');
    DOM.main = document.querySelector('main');
}

/**
 * МОБИЛЬНОЕ МЕНЮ
 * @method initMobileMenu
 * @description Инициализирует гамбургер-меню для мобильных устройств
 * Создает оверлей, управляет открытием/закрытием, ARIA-атрибутами
 */
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');

    if (!menuBtn || !nav) return;

    // Создаем оверлей для закрытия меню
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    /**
     * Переключение состояния меню
     * @method toggleMenu
     * @private
     */
    const toggleMenu = () => {
        const isActive = nav.classList.toggle('active');
        overlay.classList.toggle('active');
        menuBtn.setAttribute('aria-expanded', isActive);
        document.body.classList.toggle('no-scroll', isActive);
    };

    /**
     * Закрытие меню
     * @method closeMenu
     * @private
     */
    const closeMenu = () => {
        nav.classList.remove('active');
        overlay.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
    };

    // Обработчики событий
    menuBtn.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);

    // Закрытие при клике на ссылку
    nav.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}

/**
 * ПЛАВНАЯ ПРОКРУТКА
 * @method initSmoothScroll
 * @description Настраивает плавную прокрутку для якорных ссылок
 * Обрабатывает клики по ссылкам с #, предотвращает стандартное поведение
 */
function initSmoothScroll() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link || link.hash === '#') return;

        e.preventDefault();
        const target = document.getElementById(link.hash.slice(1));
        if (target) {
            const headerHeight = DOM.header ? DOM.header.offsetHeight : 0;
            const targetPosition = target.offsetTop - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
}

/**
 * АНИМАЦИИ ПРИ СКРОЛЛЕ
 * @method initScrollAnimations
 * @description Настраивает Intersection Observer для анимаций
 * Добавляет класс 'animated' элементам при их появлении в viewport
 */
function initScrollAnimations() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        }
    );

    // Наблюдаем за всеми анимируемыми элементами
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/**
 * УТИЛИТЫ ДЛЯ ФОРМАТИРОВАНИЯ
 */

/**
 * Форматирование даты
 * @method formatDate
 * @param {string} dateString - Строка с датой
 * @returns {string} Отформатированная дата в формате "дд.мм.гггг"
 */
function formatDate(dateString) {
    if (!dateString) return 'дата не указана';
    const date = new Date(dateString);
    return isNaN(date) ? dateString :
        `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}

/**
 * Создание звёзд рейтинга
 * @method createRatingStars
 * @param {number|string} rating - Числовой рейтинг
 * @returns {string} HTML со звёздами
 */
function createRatingStars(rating) {
    const num = Math.min(Math.max(parseFloat(rating) || 0, 0), CONFIG.defaults.maxRating);
    const full = Math.floor(num);
    const half = num % 1 >= 0.5 ? 1 : 0;
    const empty = CONFIG.defaults.maxRating - full - half;

    return `<span class="rating-stars" aria-hidden="true">
        ${'★'.repeat(full)}${half ? '⯨' : ''}${'☆'.repeat(empty)}
    </span>`;
}

/**
 * Отображение сообщения об ошибке
 * @method showError
 * @param {HTMLElement} container - Контейнер для сообщения
 * @param {Error} error - Объект ошибки
 * @param {Function} retryFn - Функция для повтора (опционально)
 */
function showError(container, error, retryFn = null) {
    if (!container) return;

    const message = error.message.includes('Failed to fetch')
        ? CONFIG.messages.connectionError
        : error.message || 'Произошла ошибка';

    container.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            ${retryFn ? `<button class="retry-button">${CONFIG.messages.retry}</button>` : ''}
        </div>
    `;

    // Добавляем обработчик для кнопки повтора
    if (retryFn) {
        container.querySelector('.retry-button').addEventListener('click', retryFn);
    }
}

/**
 * ПРОВЕРКА ПОДКЛЮЧЕНИЯ
 * @method initConnectivityCheck
 * @description Отслеживает изменения состояния сети
 * Показывает уведомления при переходе онлайн/офлайн
 */
function initConnectivityCheck() {
    const updateStatus = () => {
        STATE.isOnline = navigator.onLine;
        const status = document.createElement('div');
        status.className = `network-status ${STATE.isOnline ? 'online' : 'offline'}`;
        status.textContent = STATE.isOnline ? 'Онлайн' : 'Офлайн';
        status.setAttribute('aria-live', 'polite');

        // Удаляем старый статус если есть
        const oldStatus = document.querySelector('.network-status');
        if (oldStatus) oldStatus.remove();

        document.body.appendChild(status);
        setTimeout(() => status.remove(), 3000);
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
}

/**
 * ЗАГРУЗКА ДАННЫХ
 * @method loadData
 * @param {string} url - URL для загрузки
 * @param {Object} options - Опции fetch
 * @returns {Promise<any>} Promise с данными
 */
async function loadData(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        throw error;
    }
}

/**
 * ИНИЦИАЛИЗАЦИЯ СЕЗОННЫХ ЭФФЕКТОВ (заглушка)
 * @method initSeasonEffects
 * @description Инициализирует модуль сезонных эффектов
 */
function initSeasonEffects() {
    // Реализация в seasons-effects.js
    console.log('🌿 Сезонные эффекты инициализированы');
}

/**
 * ИНИЦИАЛИЗАЦИЯ МОДУЛЯ ПОГОДЫ (заглушка)
 * @method initWeatherModule
 * @description Инициализирует модуль погоды
 */
function initWeatherModule() {
    // Реализация в weather-module.js
    console.log('☀️ Модуль погоды инициализирован');
}

/**
 * ИНИЦИАЛИЗАЦИЯ МОДУЛЯ СИНХРОНИЗАЦИИ ВК (заглушка)
 * @method initVKSyncModule
 * @description Инициализирует модуль синхронизации с ВК
 */
function initVKSyncModule() {
    // Реализация в vk-sync-module.js
    console.log('🔄 Модуль синхронизации ВК инициализирован');
}

/**
 * ФУНКЦИЯ ДЕБАУНСА
 * @method debounce
 * @param {Function} func - Функция для дебаунса
 * @param {number} wait - Время ожидания в ms
 * @returns {Function} Дебаунсированная функция
 */
function debounce(func, wait) {
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
 * ФУНКЦИЯ ТРОТТЛИНГА
 * @method throttle
 * @param {Function} func - Функция для троттлинга
 * @param {number} limit - Лимит времени в ms
 * @returns {Function} Троттлированная функция
 */
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * ПРОВЕРКА ВИДИМОСТИ ЭЛЕМЕНТА
 * @method isElementVisible
 * @param {HTMLElement} el - DOM-элемент для проверки
 * @returns {boolean} Виден ли элемент
 */
function isElementVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * СКРОЛЛ К ЭЛЕМЕНТУ
 * @method scrollToElement
 * @param {HTMLElement} element - Целевой элемент
 * @param {Object} options - Опции скролла
 */
function scrollToElement(element, options = {}) {
    const defaultOptions = {
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
    };

    element.scrollIntoView({ ...defaultOptions, ...options });
}

/**
 * ПРОВЕРКА ТИПА УСТРОЙСТВА
 * @method isMobileDevice
 * @returns {boolean} Мобильное ли устройство
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * ПРЕОБРАЗОВАНИЕ ПУТИ К ИЗОБРАЖЕНИЮ
 * @method getImagePath
 * @param {string} filename - Имя файла изображения
 * @returns {string} Полный путь к изображению
 */
function getImagePath(filename) {
    return `../images/${filename}`;
}

// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ С ДЕБАУНСОМ
window.addEventListener('resize', debounce(() => {
    if (window.innerWidth < 768) {
        document.querySelectorAll('.container').forEach(el => {
            el.style.width = '100%';
            el.style.padding = '0 15px';
        });
    }
}, 250));

// Инициализация проверки подключения
initConnectivityCheck();

// Экспорт полезных функций для использования в других модулях
window.AppUtils = {
    formatDate,
    createRatingStars,
    debounce,
    throttle,
    loadData,
    showError,
    scrollToElement,
    isMobileDevice,
    getImagePath
};

console.log('🚀 Utils готовы к использованию');
