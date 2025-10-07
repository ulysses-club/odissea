// Конфигурация приложения
const CONFIG = {
    defaults: {
        poster: '../images/default-poster.jpg',
        ratingPrecision: 1,
        maxRating: 10
    },

    selectors: {
        filmsContainer: '#films-container',
        worksContainer: '#works-container',
        nextMeetingContainer: '#next-meeting-container',
        topBestFilms: '#top-best-films',
        topWorstFilms: '#top-worst-films',
        topDirectors: '#top-directors',
        loadMoreBtn: '#load-more-films',
        scrollToTopBtn: '#scroll-to-top'
    },

    messages: {
        loading: 'Загрузка данных...',
        noData: 'Нет данных для отображения',
        noFilms: 'Нет данных о фильмах',
        noWorks: 'Нет данных о работах',
        noMeeting: 'Информация о следующей встрече пока не доступна',
        connectionError: 'Ошибка подключения к интернету',
        serverError: 'Ошибка сервера',
        genericError: 'Произошла ошибка',
        retry: 'Попробовать снова',
        offline: 'Вы сейчас офлайн. Показаны кэшированные данные.',
        loadMore: 'Показать еще',
        allFilmsLoaded: 'Все фильмы загружены',
        noTopData: 'Недостаточно данных для формирования топа',
        meetingAnnouncement: 'Ближайшая встреча будет анонсирована позже'
    }
};

const STATE = {
    isOnline: navigator.onLine,
    topsView: {
        limit: 3,
        expanded: false
    }
};

const DOM = {
    filmsContainer: null,
    worksContainer: null,
    nextMeetingContainer: null,
    topBestFilms: null,
    topWorstFilms: null,
    topDirectors: null,
    loadMoreBtn: null,
    scrollToTopBtn: null
};

// Хранилище для обработчиков событий
const EVENT_HANDLERS = {
    online: null,
    offline: null,
    scroll: null
};

let scrollTimeout = null;

/**
 * Загружает данные о следующей встрече
 */
async function loadNextMeetingData() {
    try {
        const response = await fetch(CONFIG.dataSources.nextMeeting);
        if (!response.ok) throw new Error('Ошибка загрузки данных о встрече');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка загрузки данных о встрече:', error);
        return null;
    }
}

/**
 * Инициализирует мобильное меню с оверлеем и обработчиками событий
 * Создает оверлей для мобильного меню и настраивает взаимодействие
 */
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');
    const body = document.body;

    if (!menuBtn || !nav) return;

    // Создаем оверлей
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    menuBtn.addEventListener('click', function () {
        nav.classList.toggle('active');
        overlay.classList.toggle('active');
        menuBtn.setAttribute('aria-expanded',
            nav.classList.contains('active') ? 'true' : 'false'
        );
        body.classList.toggle('no-scroll');
    });

    overlay.addEventListener('click', function () {
        nav.classList.remove('active');
        overlay.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        body.classList.remove('no-scroll');
    });

    // Закрытие меню при клике на ссылку
    const navLinks = nav.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            nav.classList.remove('active');
            overlay.classList.remove('active');
            menuBtn.setAttribute('aria-expanded', 'false');
            body.classList.remove('no-scroll');
        });
    });
}

/**
 * Основная функция инициализации приложения
 * Запускает все необходимые модули и настройки приложения
 */
function initApp() {
    console.log('Инициализация приложения...');

    // Инициализация базовых обработчиков событий
    initMobileMenu();
    initSmoothScroll();
    initAnimations();

    // Инициализация модулей
    initSeasonEffects();
    initScrollToTop();

    console.log('Приложение инициализировано');
}

/**
 * Кэширует DOM-элементы для последующего использования
 * Находит и сохраняет основные DOM элементы в глобальном объекте DOM
 */
function cacheDOM() {
    const { selectors } = CONFIG;
    DOM.filmsContainer = document.querySelector(selectors.filmsContainer);
    DOM.worksContainer = document.querySelector(selectors.worksContainer);
    DOM.topBestFilms = document.querySelector(selectors.topBestFilms);
    DOM.topWorstFilms = document.querySelector(selectors.topWorstFilms);
    DOM.topDirectors = document.querySelector(selectors.topDirectors);
    DOM.scrollToTopBtn = document.querySelector(selectors.scrollToTopBtn);

    if (!DOM.loadMoreBtn) {
        DOM.loadMoreBtn = document.createElement('button');
        DOM.loadMoreBtn.id = 'load-more-films';
        DOM.loadMoreBtn.className = 'load-more-btn';
        DOM.loadMoreBtn.textContent = CONFIG.messages.loadMore;
        DOM.loadMoreBtn.setAttribute('aria-label', 'Загрузить больше фильмов');
        DOM.loadMoreBtn.style.display = 'none';

        const filmArchiveSection = document.querySelector('#film-archive');
        if (filmArchiveSection) filmArchiveSection.appendChild(DOM.loadMoreBtn);
    }
}

/**
 * Очищает все зарегистрированные обработчики событий
 * Удаляет все глобальные обработчики событий для предотвращения утечек памяти
 */
function cleanupEventListeners() {
    if (EVENT_HANDLERS.online) {
        window.removeEventListener('online', EVENT_HANDLERS.online);
    }
    if (EVENT_HANDLERS.offline) {
        window.removeEventListener('offline', EVENT_HANDLERS.offline);
    }
    if (EVENT_HANDLERS.scroll) {
        window.removeEventListener('scroll', EVENT_HANDLERS.scroll);
    }

    // Очищаем ссылки
    EVENT_HANDLERS.online = null;
    EVENT_HANDLERS.offline = null;
    EVENT_HANDLERS.scroll = null;
}

/**
 * Проверяет статус подключения к интернету
 * Обновляет состояние онлайн/офлайн и показывает сообщение при необходимости
 */
function checkConnectivity() {
    STATE.isOnline = navigator.onLine;
    if (!STATE.isOnline) showOfflineMessage();
}

/**
 * Обновляет отображение статуса онлайн/офлайн
 * Создает временное уведомление о статусе подключения
 */
function updateOnlineStatus() {
    STATE.isOnline = navigator.onLine;
    const statusElement = document.createElement('div');
    statusElement.className = `network-status ${STATE.isOnline ? 'online' : 'offline'}`;
    statusElement.textContent = STATE.isOnline ? 'Онлайн' : 'Офлайн';
    statusElement.setAttribute('aria-live', 'polite');

    document.body.appendChild(statusElement);
    setTimeout(() => statusElement.remove(), 3000);
}

/**
 * Показывает сообщение об офлайн-режиме
 * Создает баннер с информацией об отсутствии подключения и кнопкой повтора
 */
function showOfflineMessage() {
    const offlineMessage = document.createElement('div');
    offlineMessage.className = 'offline-message';
    offlineMessage.innerHTML = `<p>${CONFIG.messages.offline}</p><button class="retry-button">${CONFIG.messages.retry}</button>`;
    document.body.prepend(offlineMessage);
}

/**
 * Показывает индикатор загрузки в контейнере
 * Отображает спиннер и сообщение о загрузке в указанном контейнере
 * 
 * @param {HTMLElement} container - Контейнер для отображения индикатора загрузки
 */
function showLoading(container) {
    if (!container) return;
    container.innerHTML = `<div class="loading"><div class="spinner" aria-hidden="true"></div><p>${CONFIG.messages.loading}</p></div>`;
    container.classList.add('loading-state');
}

/**
 * Показывает сообщение об ошибке в контейнере
 * Отображает сообщение об ошибке с возможностью повтора действия
 * 
 * @param {HTMLElement} container - Контейнер для отображения ошибки
 * @param {Error} error - Объект ошибки
 * @param {Function|null} retryFunction - Функция для повтора действия (опционально)
 */
function showError(container, error, retryFunction = null) {
    if (!container) return;
    console.error('Ошибка:', error);
    const errorMessage = error.message.includes('Failed to fetch') ? CONFIG.messages.connectionError : error.message || CONFIG.messages.genericError;
    container.innerHTML = `<div class="error-message"><p>${errorMessage}</p>${retryFunction ? `<button class="retry-button" aria-label="${CONFIG.messages.retry}">${CONFIG.messages.retry}</button>` : ''}</div>`;
    container.classList.remove('loading-state');
}

/**
 * Создает HTML-представление звезд рейтинга
 * Генерирует визуальное отображение рейтинга в виде звезд
 * 
 * @param {number|string} rating - Числовой рейтинг
 * @returns {string} - HTML строка со звездами рейтинга
 */
function createRatingStars(rating) {
    const num = parseFloat(rating) || 0;
    const clamped = Math.min(Math.max(num, 0), CONFIG.defaults.maxRating);
    const full = Math.floor(clamped);
    const half = clamped % 1 >= 0.5 ? 1 : 0;
    const empty = CONFIG.defaults.maxRating - full - half;
    return `<span class="rating-stars" aria-hidden="true">${'★'.repeat(full)}${half ? '⯨' : ''}${'☆'.repeat(empty)}</span>`;
}

/**
 * Форматирует дату в строку формата "дд.мм.гггг"
 * Преобразует строку даты в единообразный формат
 * 
 * @param {string} dateString - Строка с датой
 * @returns {string} - Отформатированная дата или исходная строка при ошибке
 */
function formatDate(dateString) {
    if (!dateString) return 'дата не указана';
    const date = parseDate(dateString);
    if (isNaN(date.getTime())) return dateString;
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}

/**
 * Парсит строку даты в объект Date
 * Поддерживает различные форматы дат, включая "дд.мм.гггг"
 * 
 * @param {string} dateString - Строка с датой для парсинга
 * @returns {Date} - Объект Date
 * @throws {Error} - Если формат даты не распознан
 */
function parseDate(dateString) {
    if (!dateString) return new Date(0);

    // Обработка формата "дд.мм.гггг"
    const ddMMyyyyMatch = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (ddMMyyyyMatch) {
        const day = parseInt(ddMMyyyyMatch[1], 10);
        const month = parseInt(ddMMyyyyMatch[2], 10) - 1;
        const year = parseInt(ddMMyyyyMatch[3], 10);
        const result = new Date(year, month, day);
        if (isNaN(result.getTime())) throw new Error('Неверная дата');
        return result;
    }

    // Пробуем стандартный парсинг
    const result = new Date(dateString);
    if (isNaN(result.getTime())) throw new Error('Неизвестный формат даты');
    return result;
}

/**
 * Инициализирует функциональность кнопки прокрутки вверх
 * Настраивает отображение и поведение кнопки "Наверх"
 */
function initScrollToTop() {
    if (!DOM.scrollToTopBtn) return;
    EVENT_HANDLERS.scroll = handleScroll;
    window.addEventListener('scroll', EVENT_HANDLERS.scroll);
    DOM.scrollToTopBtn.addEventListener('click', scrollToTop);
}

/**
 * Обрабатывает событие прокрутки страницы
 * Управляет видимостью кнопки "Наверх" с дебаунсингом
 */
function handleScroll() {
    if (!DOM.scrollToTopBtn) return;

    // Отменяем предыдущий таймаут
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }

    // Дебаунс 100ms
    scrollTimeout = setTimeout(() => {
        DOM.scrollToTopBtn.classList.toggle('visible', window.pageYOffset > 300);
    }, 100);
}

/**
 * Плавно прокручивает страницу к началу
 * Выполняет анимированную прокрутку к верху страницы
 */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Возвращает правильную форму слова для русского языка
 * Выбирает соответствующую форму слова в зависимости от числа
 * 
 * @param {number} number - Число для определения формы
 * @param {string} one - Форма для 1
 * @param {string} two - Форма для 2-4
 * @param {string} five - Форма для 5-20
 * @returns {string} - Правильная форма слова
 */
function getRussianWordForm(number, one, two, five) {
    const n = Math.abs(number) % 100;
    if (n >= 5 && n <= 20) return five;
    switch (n % 10) {
        case 1: return one;
        case 2: case 3: case 4: return two;
        default: return five;
    }
}

/**
 * Капитализирует первую букву строки с учетом специальных случаев
 * Обрабатывает специальные префиксы типа Mc, Mac, O' и т.д.
 * 
 * @param {string} string - Исходная строка
 * @returns {string} - Строка с правильной капитализацией
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';

    // Разделяем строку на слова (учитываем пробелы, дефисы и апострофы)
    return string.split(/([\s\-']+)/)
        .map(word => {
            // Пропускаем разделители
            if (/^[\s\-']+$/.test(word)) return word;

            // Обрабатываем специальные случаи (Mc, Mac, O' и т.д.)
            if (word.match(/^(mc|mac|o'|d')[a-z]/i)) {
                return word.charAt(0).toUpperCase() +
                    word.charAt(1).toUpperCase() +
                    word.slice(2).toLowerCase();
            }

            // Стандартное преобразование: первая буква заглавная, остальные строчные
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
}

/**
 * Инициализирует плавную прокрутку для якорных ссылок
 * Настраивает плавную прокрутку при клике на ссылки с якорями
 */
function initSmoothScroll() {
    document.addEventListener('click', function (e) {
        const target = e.target.closest('a[href^="#"]');
        if (target && target.getAttribute('href') !== '#') {
            e.preventDefault();
            const targetId = target.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
}

/**
 * Инициализирует анимации появления элементов при скролле
 * Настраивает Intersection Observer для анимированного появления элементов
 */
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);

    // Наблюдаем за элементами с классами анимации
    document.querySelectorAll('.fade-in, .slide-in, .scale-in').forEach(el => {
        observer.observe(el);
    });
}

/**
 * Инициализирует сезонные эффекты (заглушка - реализация в отдельном модуле)
 * Заглушка для модуля сезонных эффектов
 */
function initSeasonEffects() {
    // Реализация в seasons-effects.js
    console.log('Сезонные эффекты инициализируются в отдельном модуле');
}

// Стили для уведомлений и состояний
const style = document.createElement('style');
style.textContent = `
    .network-status {
        position: fixed; top: 10px; right: 10px; padding: 0.5rem 1rem; border-radius: 20px;
        font-size: 0.8rem; font-weight: bold; z-index: 2000; animation: slideIn 0.3s ease;
    }
    .network-status.online { background: #4CAF50; color: white; }
    .network-status.offline { background: #f44336; color: white; }
    .offline-message { background: #f44336; color: white; padding: 1rem; text-align: center; position: sticky; top: 0; z-index: 1000; }
    .retry-button { background: white; color: #f44336; border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-left: 1rem; cursor: pointer; font-weight: bold; }
    @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .no-data { text-align: center; color: var(--gray); padding: 2rem; font-style: italic; }
    .error-message { text-align: center; color: var(--accent); padding: 2rem; }
    .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; color: var(--gray); }
    
    /* Анимации */
    .fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .fade-in.animated { opacity: 1; transform: translateY(0); }
    .fade-in.delay-1 { transition-delay: 0.1s; }
    .fade-in.delay-2 { transition-delay: 0.2s; }
    .fade-in.delay-3 { transition-delay: 0.3s; }
    .fade-in.delay-4 { transition-delay: 0.4s; }
    
    @media (max-width: 768px) {
        .offline-message { flex-direction: column; gap: 0.5rem; padding: 0.5rem; }
    }
`;
document.head.appendChild(style);

// Обработчик изменения размера окна
window.addEventListener('resize', function () {
    // Фикс ширины для мобильных
    if (window.innerWidth < 768) {
        const containers = [
            '.films-container',
            '.works-container',
            '.video-posters-grid',
            '.film-grid',
            '#gallery-container'
        ];

        containers.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.width = '100%';
                element.style.margin = '0 auto';
            }
        });
    }
});

// Инициализация приложения при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
