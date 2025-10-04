// Конфигурация приложения
const CONFIG = {
    defaults: {
        poster: '../images/default-poster.jpg',
        ratingPrecision: 1,
        maxRating: 10,
        cacheTTL: 3600000,
        filmsPerPage: 20,
        topLimit: 10,
        compactTopLimit: 3
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
    },

    api: {
        timeout: 10000
    }
};

const STATE = {
    films: [],
    sortedFilms: [],
    works: [],
    nextMeeting: null,
    isOnline: navigator.onLine,
    lastUpdated: null,
    pagination: {
        currentPage: 1,
        totalFilms: 0,
        hasMore: true
    },
    cache: {
        films: null,
        works: null,
        nextMeeting: null,
        tops: null
    },
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
 * Инициализирует мобильное меню с оверлеем и обработчиками событий
 * 
 * @returns {void}
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
 * 
 * @returns {void}
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
 * 
 * @returns {void}
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
 * 
 * @returns {void}
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
 * 
 * @returns {void}
 */
function checkConnectivity() {
    STATE.isOnline = navigator.onLine;
    if (!STATE.isOnline) showOfflineMessage();
}

/**
 * Обновляет отображение статуса онлайн/офлайн
 * 
 * @returns {void}
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
 * 
 * @returns {void}
 */
function showOfflineMessage() {
    const offlineMessage = document.createElement('div');
    offlineMessage.className = 'offline-message';
    offlineMessage.innerHTML = `<p>${CONFIG.messages.offline}</p><button class="retry-button">${CONFIG.messages.retry}</button>`;
    document.body.prepend(offlineMessage);
}

/**
 * Проверяет валидность кэша на основе TTL
 * 
 * @returns {boolean} - true если кэш валиден
 */
function isCacheValid() {
    return STATE.lastUpdated && (Date.now() - STATE.lastUpdated) < CONFIG.defaults.cacheTTL;
}

/**
 * Сохраняет текущие данные в кэш
 * 
 * @returns {void}
 */
function saveToCache() {
    STATE.cache = {
        films: STATE.films,
        works: STATE.works,
        tops: {
            best: getTopFilms('best'),
            worst: getTopFilms('worst'),
            genres: getTopGenres(),
            directors: getTopDirectors()
        }
    };
    STATE.lastUpdated = Date.now();

    try {
        localStorage.setItem('cinemaClubCache', JSON.stringify(STATE.cache));
        localStorage.setItem('cinemaClubLastUpdated', STATE.lastUpdated.toString());
    } catch (e) {
        console.error('Ошибка сохранения в localStorage:', e);
    }
}

/**
 * Выполняет запрос данных с fallback-механизмом
 * 
 * @param {object} sourceConfig - Конфигурация источника данных
 * @returns {Promise<object>} - Данные в формате JSON
 * @throws {Error} - Если все источники данных недоступны
 */
async function fetchDataWithFallback(sourceConfig) {
    try {
        if (sourceConfig.useProxy && sourceConfig.url.includes('github.com')) {
            return await fetchWithCorsProxy(sourceConfig.url, sourceConfig.fallback);
        } else {
            const response = await fetch(sourceConfig.fallback, {
                headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        try {
            const localResponse = await fetch(sourceConfig.fallback);
            if (!localResponse.ok) throw new Error(`Local HTTP error! status: ${localResponse.status}`);
            return await localResponse.json();
        } catch (localError) {
            console.error('Локальный fallback тоже не сработал:', localError);
            throw new Error('Все источники данных недоступны');
        }
    }
}

/**
 * Пытается загрузить данные из локального кэша
 * 
 * @param {object} sourceConfig - Конфигурация источника данных
 * @returns {object|null} - Данные из кэша или null
 */
function tryLoadFromCache(sourceConfig) {
    if (!sourceConfig || !sourceConfig.url) {
        console.warn('Неверная конфигурация для кэша');
        return null;
    }

    try {
        const safeUrl = String(sourceConfig.url || '');
        const cacheKey = `cache_${safeUrl.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const cached = localStorage.getItem(cacheKey);

        if (!cached) return null;

        const cacheData = JSON.parse(cached);
        const isCacheValid = cacheData.timestamp &&
            (Date.now() - cacheData.timestamp < 86400000);

        return isCacheValid ? cacheData.data : null;

    } catch (e) {
        console.warn('Ошибка загрузки из кэша:', e);
        return null;
    }
}

/**
 * Рендерит список работ участников
 * 
 * @param {Array} works - Массив работ
 * @returns {void}
 */
function renderWorks(works) {
    if (!DOM.worksContainer) {
        console.warn('Контейнер работ не доступен');
        return;
    }

    if (!works?.length) {
        DOM.worksContainer.innerHTML = `<p class="no-data">${CONFIG.messages.noWorks}</p>`;
        return;
    }

    DOM.worksContainer.innerHTML = works.map(work => `
        <article class="film-poster" role="article" aria-labelledby="work-${work['Название']}-title">
            <a href="${work['Ссылка на видео'] || '#'}" ${work['Ссылка на видео'] ? 'target="_blank" rel="noopener noreferrer"' : ''} class="video-link" aria-label="${work['Тип'] || 'Работа'}: ${work['Название']} (${work['Год']})">
                <img src="${work['URL постера'] || CONFIG.defaults.poster}" alt="${work['Название']} (${work['Год']})" class="poster-image" loading="lazy" onerror="this.src='${CONFIG.defaults.poster}'">
                <div class="play-overlay">
                    <div class="play-button" aria-hidden="true">▶</div>
                    <p class="watch-text">Смотреть ${work['Тип'] || 'работу'}</p>
                </div>
            </a>
            <div class="work-info">
                <h3 id="work-${work['Название']}-title">${work['Название']} (${work['Год']})</h3>
                ${work['Описание'] ? `<p class="work-description">${work['Описание']}</p>` : ''}
            </div>
        </article>
    `).join('');
}

/**
 * Показывает индикатор загрузки в контейнере
 * 
 * @param {HTMLElement} container - Контейнер для отображения загрузки
 * @returns {void}
 */
function showLoading(container) {
    if (!container) return;
    container.innerHTML = `<div class="loading"><div class="spinner" aria-hidden="true"></div><p>${CONFIG.messages.loading}</p></div>`;
    container.classList.add('loading-state');
}

/**
 * Показывает сообщение об ошибке в контейнере
 * 
 * @param {HTMLElement} container - Контейнер для отображения ошибки
 * @param {Error} error - Объект ошибки
 * @param {Function|null} retryFunction - Функция повторной попытки
 * @returns {void}
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
 * 
 * @param {number} rating - Значение рейтинга
 * @returns {string} - HTML-строка звезд рейтинга
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
 * Парсит строку даты в объект Date
 * 
 * @param {string} dateString - Строка даты
 * @returns {Date} - Объект Date
 * @throws {Error} - Если формат даты не распознан
 */
function parseDate(dateString) {
    if (!dateString) return new Date(0);

    // Обработка формата "дд.мм.гггг"
    const ddMMyyyyMatch = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (ddMMyyyyMatch) {
        const day = parseInt(ddMMyyyyMatch[1], 10);
        const month = parseInt(ddMMyyyyMatch[2], 10) - 1; // Месяцы в JS: 0-11
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
 * Форматирует дату в строку формата "дд.мм.гггг"
 * 
 * @param {string} dateString - Строка даты для форматирования
 * @returns {string} - Отформатированная дата
 */
function formatDate(dateString) {
    if (!dateString) return 'дата не указана';
    const date = parseDate(dateString);
    if (isNaN(date.getTime())) return dateString;
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}

/**
 * Инициализирует функциональность кнопки прокрутки вверх
 * 
 * @returns {void}
 */
function initScrollToTop() {
    if (!DOM.scrollToTopBtn) return;
    EVENT_HANDLERS.scroll = handleScroll;
    window.addEventListener('scroll', EVENT_HANDLERS.scroll);
    DOM.scrollToTopBtn.addEventListener('click', scrollToTop);
}

/**
 * Обрабатывает событие прокрутки страницы
 * 
 * @returns {void}
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
 * 
 * @returns {void}
 */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Возвращает правильную форму слова для русского языка
 * 
 * @param {number} number - Число для склонения
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
 * 
 * @param {string} string - Строка для капитализации
 * @returns {string} - Капитализированная строка
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
 * Создает HTML-элемент для топ-списка
 * 
 * @param {object} item - Элемент топа
 * @param {number} index - Индекс элемента
 * @param {string} type - Тип элемента ('film', 'genre', 'director')
 * @param {boolean} isCompact - Компактный режим отображения
 * @returns {string} - HTML-строка элемента
 */
function createTopItem(item, index, type, isCompact = false) {
    const isVisible = index < STATE.topsView.limit;
    const itemClass = `top-item ${isCompact ? 'compact' : ''} ${isVisible ? 'visible' : 'hidden'}`;

    if (type === 'film') {
        const posterUrl = item['Постер URL'] || CONFIG.defaults.poster;
        const rating = parseFloat(item['Оценка']);
        const filmName = item['Фильм'] || 'Неизвестный фильм';
        const filmYear = item['Год'] || '';

        return `
        <div class="${itemClass}" data-index="${index}">
            <div class="top-rank">${index + 1}</div>
            <div class="top-poster">
                <img src="${posterUrl}" alt="${filmName}" loading="lazy" 
                     onerror="this.src='${CONFIG.defaults.poster}'">
            </div>
            <div class="top-info">
                <div class="top-film-title">${filmName} ${filmYear ? `(${filmYear})` : ''}</div>
                <div class="top-film-meta">
                    <span class="top-director">${item['Режиссер'] || 'Неизвестен'}</span>
                    <span class="top-rating">
                        <span class="rating-stars">${createRatingStars(rating)}</span>
                        ${rating.toFixed(1)}
                    </span>
                </div>
            </div>
        </div>
        `;
    } else if (type === 'genre') {
        return `
        <div class="${itemClass}" data-index="${index}">
            <div class="top-rank">${index + 1}</div>
            <div class="top-info">
                <div class="top-film-title">${capitalizeFirstLetter(item.genre)}</div>
                <div class="top-film-meta">
                    <span class="rating-badge">${item.count} ${getRussianWordForm(item.count, 'фильм', 'фильма', 'фильмов')}</span>
                </div>
            </div>
        </div>
        `;
    } else if (type === 'director') {
        return `
        <div class="${itemClass}" data-index="${index}">
            <div class="top-rank">${index + 1}</div>
            <div class="top-info">
                <div class="top-film-title">${capitalizeFirstLetter(item.director)}</div>
                <div class="top-film-meta">
                    <span class="rating-badge">${item.count} ${getRussianWordForm(item.count, 'фильм', 'фильма', 'фильмов')}</span>
                </div>
            </div>
        </div>
        `;
    }
}

/**
 * Переключает лимит отображения топ-списков
 * 
 * @param {number} limit - Новый лимит отображения
 * @returns {void}
 */
function toggleTopsLimit(limit) {
    STATE.topsView.limit = limit;
    STATE.topsView.expanded = limit === 10;

    // Обновляем активную кнопку
    document.querySelectorAll('.toggle-tops-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.limit) === limit);
    });

    // Перерисовываем топы
    renderTops();
}

/**
 * Инициализирует управление отображением топ-списков
 * 
 * @returns {void}
 */
function initTopsControls() {
    const buttons = document.querySelectorAll('.toggle-tops-btn');

    buttons.forEach(button => {
        button.addEventListener('click', function () {
            const limit = parseInt(this.dataset.limit);
            toggleTopsLimit(limit);
        });
    });
}

/**
 * Показывает предупреждение о загрузке демонстрационных данных
 * 
 * @param {string} dataType - Тип данных для отображения в сообщении
 * @returns {void}
 */
function showMockDataWarning(dataType) {
    const existingWarning = document.querySelector('.mock-warning');
    if (existingWarning) existingWarning.remove();

    const warning = document.createElement('div');
    warning.className = 'mock-warning';
    warning.innerHTML = `
        <p>⚠️ Данные ${dataType} загружены в демо-режиме. 
        Для актуальной информации обновите файлы на GitHub.</p>
        <button onclick="location.reload()" class="retry-button">Обновить страницу</button>
    `;
    document.body.prepend(warning);

    setTimeout(() => {
        if (warning.parentNode) {
            warning.style.opacity = '0';
            setTimeout(() => warning.remove(), 500);
        }
    }, 5000);
}

/**
 * Генерирует URL для поиска фильма на КиноПоиске
 * 
 * @param {string} filmName - Название фильма
 * @param {string} filmYear - Год выпуска фильма
 * @returns {string|null} - URL для КиноПоиска или null
 */
function generateKinopoiskUrl(filmName, filmYear) {
    if (!filmName) return null;

    // Очищаем название от лишних символов и формируем поисковый запрос
    const cleanName = filmName
        .replace(/[^\w\sа-яА-ЯёЁ]/gi, ' ') // Убираем спецсимволы
        .replace(/\s+/g, ' ') // Заменяем множественные пробелы на один
        .trim();

    const searchQuery = filmYear ? `${cleanName} ${filmYear}` : cleanName;
    const encodedQuery = encodeURIComponent(searchQuery);

    return `https://www.kinopoisk.ru/index.php?kp_query=${encodedQuery}`;
}

/**
 * Инициализирует Яндекс.Карту с меткой места встреч на основе данных о встрече
 * 
 * @returns {void}
 */
function initYandexMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer || typeof ymaps === 'undefined') {
        showMapFallback();
        return;
    }

    try {
        ymaps.ready(() => {
            try {
                // Получаем данные о месте встречи
                const address = getMeetingAddress(STATE.nextMeeting);
                const placeName = getMeetingPlaceName(STATE.nextMeeting);

                // Координаты по умолчанию (Севастополь)
                let coordinates = [44.601145, 33.520966];

                // Если есть конкретный адрес, можно попробовать геокодировать
                // Пока используем координаты по умолчанию, но можно доработать

                const map = new ymaps.Map('map', {
                    center: coordinates,
                    zoom: 16,
                    controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
                });

                const placemark = new ymaps.Placemark(coordinates, {
                    hintContent: placeName,
                    balloonContent: `
                        <strong>${placeName}</strong><br>
                        ${address}<br>
                        <em>Место встреч киноклуба</em>
                    `
                }, {
                    iconLayout: 'default#image',
                    iconImageHref: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiM2YTExY2IiIGZpbGwtb3BhY2l0eT0iMC44IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIyMCIgeT0iMjUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSJib2xkIj7QmtC+PC90ZXh0Pgo8L3N2Zz4=',
                    iconImageSize: [40, 40],
                    iconImageOffset: [-20, -40]
                });

                map.geoObjects.add(placemark);

                // Обновляем информацию под картой
                updateMapInfo(address, placeName);

                const fallback = mapContainer.querySelector('.map-fallback');
                if (fallback) fallback.style.display = 'none';

            } catch (error) {
                console.error('Ошибка инициализации карты:', error);
                showMapFallback();
            }
        });
    } catch (error) {
        console.error('Ошибка ymaps.ready:', error);
        showMapFallback();
    }
}

/**
 * Обновляет информацию под картой на основе данных о встрече
 * 
 * @param {string} address - Адрес места встречи
 * @param {string} placeName - Название места
 * @returns {void}
 */
function updateMapInfo(address, placeName) {
    const mapInfo = document.querySelector('.map-info');
    if (!mapInfo) return;

    mapInfo.innerHTML = `
        <h3>${placeName}</h3>
        <p>${address}</p>
        ${placeName.includes('Том Сойер') ?
            `<a href="https://vk.com/tomsoyerbartending" target="_blank" rel="noopener noreferrer" class="contact-card__link">Tom Soyer Bartending</a>` :
            ''
        }
        <p>Собираемся каждую неделю в выходные</p>
        <p>Точное время и дату узнавать тут:</p>
        <a href="https://t.me/Odyssey_Cinema_Club_bot" target="_blank" rel="noopener noreferrer" class="contact-card__link">@Odyssey_Cinema_Club_bot</a>
    `;
}

/**
 * Показывает fallback-контент при недоступности карты
 * 
 * @returns {void}
 */
function showMapFallback() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    let fallback = mapContainer.querySelector('.map-fallback');

    // Получаем актуальные данные о месте
    const address = getMeetingAddress(STATE.nextMeeting);
    const placeName = getMeetingPlaceName(STATE.nextMeeting);

    if (!fallback) {
        fallback = document.createElement('div');
        fallback.className = 'map-fallback';
        fallback.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#2c3e50,#34495e);color:white;text-align:center;padding:20px;border-radius:8px';
        fallback.innerHTML = `
            <div>
                <div style="font-size:3rem;margin-bottom:1rem;">🗺️</div>
                <h3 style="margin-bottom:1rem;color:#6a11cb;">Карта временно недоступна</h3>
                <p style="margin-bottom:0.5rem;"><strong>Место:</strong> ${placeName}</p>
                <p style="margin-bottom:0.5rem;"><strong>Адрес:</strong> ${address}</p>
                <p style="margin-bottom:1rem;"><em>Место встреч киноклуба</em></p>
                <p style="font-size:0.9rem;opacity:0.8;">Мы встречаемся здесь каждую неделю!</p>
            </div>
        `;
        mapContainer.appendChild(fallback);
    } else {
        // Обновляем существующий fallback
        fallback.innerHTML = `
            <div>
                <div style="font-size:3rem;margin-bottom:1rem;">🗺️</div>
                <h3 style="margin-bottom:1rem;color:#6a11cb;">Карта временно недоступна</h3>
                <p style="margin-bottom:0.5rem;"><strong>Место:</strong> ${placeName}</p>
                <p style="margin-bottom:0.5rem;"><strong>Адрес:</strong> ${address}</p>
                <p style="margin-bottom:1rem;"><em>Место встреч киноклуба</em></p>
                <p style="font-size:0.9rem;opacity:0.8;">Мы встречаемся здесь каждую неделю!</p>
            </div>
        `;
        fallback.style.display = 'flex';
    }

    // Также обновляем информацию под картой
    updateMapInfo(address, placeName);
}

/**
 * Загружает API Яндекс.Карт и инициализирует карту с учетом данных о встрече
 * 
 * @returns {void}
 */
function loadYandexMaps() {
    if (typeof ymaps !== 'undefined') {
        initYandexMap();
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=ваш_api_ключ&lang=ru_RU';
    script.async = true;

    script.onload = () => typeof ymaps !== 'undefined' ? initYandexMap() : showMapFallback();
    script.onerror = () => {
        console.error('Не удалось загрузить Яндекс Карты');
        showMapFallback();
    };

    document.head.appendChild(script);
}

/**
 * Создает элемент с сообщением об ошибке
 * 
 * @param {string} message - Текст ошибки
 * @returns {HTMLElement} - Элемент с ошибкой
 */
function createErrorElement(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'countdown-error';
    errorElement.innerHTML = `
        <div style="color: var(--accent); text-align: center; padding: var(--space-md);">
            <span style="opacity: 0.7;">⏰</span>
            <p style="margin: var(--space-sm) 0 0 0; font-size: var(--text-sm);">${message}</p>
        </div>
    `;
    return errorElement;
}

/**
 * Извлекает название места из данных о встрече
 * 
 * @param {object} meetingData - Данные о встрече
 * @returns {string} - Название места
 */
function getMeetingPlaceName(meetingData) {
    if (meetingData && meetingData.place) {
        // Пытаемся извлечь название места из адреса (первая часть до запятой)
        const placeParts = meetingData.place.split(',');
        return placeParts[0].trim();
    }

    return "Кофейня \"Том Сойер\"";
}

/**
 * Геокодирует адрес в координаты с использованием Яндекс.Геокодера
 * 
 * @param {string} address - Адрес для геокодирования
 * @returns {Promise<number[]>} - Promise с массивом [широта, долгота]
 */
function geocodeAddress(address) {
    return new Promise((resolve, reject) => {
        if (typeof ymaps === 'undefined') {
            reject(new Error('Yandex Maps API не загружен'));
            return;
        }

        ymaps.geocode(address, {
            results: 1
        }).then(function (res) {
            const firstGeoObject = res.geoObjects.get(0);
            if (firstGeoObject) {
                const coordinates = firstGeoObject.geometry.getCoordinates();
                resolve(coordinates);
            } else {
                reject(new Error('Адрес не найден'));
            }
        }).catch(reject);
    });
}

/**
 * Получает координаты места встречи с fallback на координаты по умолчанию
 * 
 * @param {object} meetingData - Данные о встрече
 * @returns {Promise<number[]>} - Promise с координатами [широта, долгота]
 */
async function getMeetingCoordinates(meetingData) {
    const address = getMeetingAddress(meetingData);

    // Если адрес по умолчанию, используем заранее известные координаты
    if (address === "ул. Шмидта, 12, Севастополь") {
        return [44.601145, 33.520966]; // Кофейня "Том Сойер"
    }

    try {
        const coordinates = await geocodeAddress(address);
        console.log('Найдены координаты для адреса:', address, coordinates);
        return coordinates;
    } catch (error) {
        console.warn('Не удалось геокодировать адрес, используем координаты по умолчанию:', error);
        return [44.601145, 33.520966]; // Fallback координаты
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setTimeout(loadYandexMaps, 1000);
});

// Стили для кнопки КиноПоиска на постере
const kinopoiskStyles = `
    .film-card-image {
        position: relative;
        overflow: hidden;
    }
    
    .poster-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    }
    
    .film-card-image:hover .poster-overlay {
        opacity: 1;
        pointer-events: auto;
    }
    
    .kinopoisk-poster-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.8rem 1.5rem;
        background: linear-gradient(135deg, #3d13af69, #1558776b);
        color: white !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.3s ease;
        transform: translateY(20px);
        opacity: 0;
    }
    
    .film-card-image:hover .kinopoisk-poster-button {
        transform: translateY(0);
        opacity: 1;
    }
    
    .kinopoisk-poster-button:hover {
        background: linear-gradient(135deg, #6200ffff, #0084ffff);
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(160, 160, 160, 0.8);
    }
    
    .top-poster {
        position: relative;
        overflow: hidden;
    }
    
    .top-poster .poster-overlay {
        background: rgba(0, 0, 0, 0.8);
    }
    
    .top-poster .kinopoisk-poster-button {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
        .kinopoisk-poster-button {
            padding: 0.6rem 1.2rem;
            font-size: 0.9rem;
        }
        
        .top-poster .kinopoisk-poster-button {
            padding: 0.4rem 0.8rem;
            font-size: 0.8rem;
        }
        
        .poster-overlay {
            opacity: 1;
            background: rgba(0, 0, 0, 0.6);
        }
        
        .kinopoisk-poster-button {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;

if (document.querySelector('#kinopoisk-styles')) {
    document.querySelector('#kinopoisk-styles').textContent = kinopoiskStyles;
} else {
    const styleElement = document.createElement('style');
    styleElement.id = 'kinopoisk-styles';
    styleElement.textContent = kinopoiskStyles;
    document.head.appendChild(styleElement);
}

const style = document.createElement('style');
style.textContent = `
    .mock-warning {
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: linear-gradient(135deg, #ff9800, #f44336); color: white;
        padding: 1rem 1.5rem; border-radius: 8px; text-align: center; z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3); max-width: 90%; animation: slideDown 0.3s ease;
    }
    .mock-warning p { margin: 0 0 1rem 0; font-weight: 500; }
    .network-status {
        position: fixed; top: 10px; right: 10px; padding: 0.5rem 1rem; border-radius: 20px;
        font-size: 0.8rem; font-weight: bold; z-index: 2000; animation: slideIn 0.3s ease;
    }
    .network-status.online { background: #4CAF50; color: white; }
    .network-status.offline { background: #f44336; color: white; }
    .offline-message { background: #f44336; color: white; padding: 1rem; text-align: center; position: sticky; top: 0; z-index: 1000; }
    .retry-button { background: white; color: #f44336; border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-left: 1rem; cursor: pointer; font-weight: bold; }
    @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
    @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .no-data { text-align: center; color: var(--gray); padding: 2rem; font-style: italic; }
    .error-message { text-align: center; color: var(--accent); padding: 2rem; }
    .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; color: var(--gray); }
    @media (max-width: 768px) {
        .mock-warning { top: 10px; padding: 0.8rem 1rem; font-size: 0.9rem; }
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
