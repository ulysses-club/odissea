// Конфигурация приложения
const CONFIG = {
    dataSources: {
        films: {
            url: 'https://raw.githubusercontent.com/ulysses-club/odissea/main/assets/data/films.json',
            type: 'json',
            fallback: 'assets/data/films.json',
            useProxy: true
        },
        works: {
            url: 'https://raw.githubusercontent.com/ulysses-club/odissea/main/assets/data/works.json',
            type: 'json',
            fallback: 'assets/data/works.json',
            useProxy: true
        },
        nextMeeting: {
            url: 'https://raw.githubusercontent.com/ulysses-club/odissea/main/assets/data/next-meeting.json',
            type: 'json',
            fallback: 'assets/data/next-meeting.json',
            useProxy: true
        }
    },

    defaults: {
        poster: 'assets/images/default-poster.jpg',
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
        topGenres: '#top-genres',
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
    topGenres: null,
    topDirectors: null,
    loadMoreBtn: null,
    scrollToTopBtn: null
};

const PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/'
];

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
    initMobileMenu();
    cacheDOM();
    initEventListeners();
    checkConnectivity();
    loadInitialData();
    loadNextMeeting();
    updateOnlineStatus();
    initScrollToTop();
    initTopsControls();
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
    DOM.nextMeetingContainer = document.querySelector(selectors.nextMeetingContainer);
    DOM.topBestFilms = document.querySelector(selectors.topBestFilms);
    DOM.topWorstFilms = document.querySelector(selectors.topWorstFilms);
    DOM.topGenres = document.querySelector(selectors.topGenres);
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
 * Выполняет запрос к данным через CORS-прокси с fallback-механизмом
 * 
 * @param {string} url - URL для запроса
 * @param {string} fallbackUrl - Резервный URL
 * @param {number} timeout - Таймаут запроса в миллисекундах
 * @returns {Promise<object>} - Данные в формате JSON
 * @throws {Error} - Если все источники данных недоступны
 */
async function fetchWithCorsProxy(url, fallbackUrl, timeout = 10000) {
    if (!url || !fallbackUrl) {
        throw new Error('Не указаны URL для запроса');
    }

    for (const proxy of PROXIES) {
        try {
            const proxyUrl = proxy === PROXIES[2] ? `${proxy}${url}` : `${proxy}${encodeURIComponent(url)}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(proxyUrl, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn(`Proxy ${proxy} timeout`);
            } else {
                console.warn(`Proxy ${proxy} не сработал:`, error.message);
            }
            continue;
        }
    }

    // Пробуем локальный fallback
    try {
        const response = await fetch(fallbackUrl, {
            headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }
        });

        if (!response.ok) {
            throw new Error(`Local HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (localError) {
        console.error('Локальный fallback тоже не сработал:', localError);
        throw new Error('Все источники данных недоступны');
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
 * Инициализирует обработчики событий приложения
 * 
 * @returns {void}
 */
function initEventListeners() {
    // Удаляем старые обработчики если есть
    cleanupEventListeners();

    EVENT_HANDLERS.online = updateOnlineStatus;
    EVENT_HANDLERS.offline = updateOnlineStatus;

    window.addEventListener('online', EVENT_HANDLERS.online);
    window.addEventListener('offline', EVENT_HANDLERS.offline);

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('retry-button')) {
            loadInitialData();
            loadNextMeeting();
        }
    });

    if (DOM.loadMoreBtn) DOM.loadMoreBtn.addEventListener('click', loadMoreFilms);

    // Добавляем очистку при размонтировании
    window.addEventListener('beforeunload', cleanupEventListeners);
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
 * Загружает начальные данные приложения (фильмы и работы)
 * 
 * @returns {Promise<void>}
 */
async function loadInitialData() {
    try {
        const cachedFilms = tryLoadFromCache(CONFIG.dataSources.films);
        const cachedWorks = tryLoadFromCache(CONFIG.dataSources.works);

        if (cachedFilms && cachedWorks && isCacheValid()) {
            STATE.films = cachedFilms;
            STATE.works = cachedWorks;
            loadFromCache();
            return;
        }

        showLoading(DOM.filmsContainer);
        showLoading(DOM.worksContainer);
        showLoadingForTops();

        await Promise.all([loadFilmsData(), loadWorksData()]);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError(DOM.filmsContainer, error);
    }
}

/**
 * Загружает информацию о следующей встрече киноклуба
 * 
 * @returns {Promise<void>}
 */
async function loadNextMeeting() {
    try {
        const data = await fetchDataWithFallback(CONFIG.dataSources.nextMeeting);
        if (data && typeof data === 'object') {
            STATE.nextMeeting = data;
            renderNextMeeting(data);

            // Обновляем карту с новыми данными
            if (typeof ymaps !== 'undefined') {
                initYandexMap();
            } else {
                updateMapInfo(getMeetingAddress(data), getMeetingPlaceName(data));
            }
        } else {
            throw new Error('Неверный формат данных о встрече');
        }
    } catch (error) {
        console.error('Ошибка загрузки информации о встрече:', error);
        showNextMeetingError();
        loadMockNextMeetingData();
    }
}

/**
 * Рендерит информацию о следующей встрече с таймером
 * 
 * @param {object} meetingData - Данные о встрече
 * @returns {void}
 */
function renderNextMeeting(meetingData) {
    if (!DOM.nextMeetingContainer || !meetingData || typeof meetingData !== 'object') {
        DOM.nextMeetingContainer.innerHTML = `<div class="no-data"><p>${CONFIG.messages.noMeeting}</p><p>Следите за обновлениями в наших соцсетях</p></div>`;
        return;
    }

    const { defaults, messages } = CONFIG;
    const { date, time, place, film, director, genre, country, year, poster, discussionNumber, description, requirements } = meetingData;

    // Проверяем, актуальна ли дата встречи
    try {
        const meetingDate = parseDate(date || '');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (meetingDate < today) {
            DOM.nextMeetingContainer.innerHTML = `
                <div class="next-meeting-card">
                    <div class="next-meeting-info">
                        <div class="next-meeting-header">
                            <h3 class="next-meeting-title">Следующая встреча</h3>
                        </div>
                        <div class="next-meeting-description">
                            <p>Информация о следующей встрече будет анонсирована позже.</p>
                            <p>Следите за обновлениями в наших соцсетях:</p>
                            <div style="margin-top: 1rem;">
                                <a href="https://vk.com/club199046020" target="_blank" class="btn btn--primary" style="margin-right: 0.5rem;">ВКонтакте</a>
                                <a href="https://t.me/Odyssey_Cinema_Club_bot" target="_blank" class="btn btn--outline">Telegram</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
    } catch (dateError) {
        console.warn('Ошибка парсинга даты:', dateError);
    }

    // Генерируем ссылку на КиноПоиск
    const kinopoiskUrl = generateKinopoiskUrl(film, year);

    // HTML с местом для таймера
    DOM.nextMeetingContainer.innerHTML = `
        <div class="next-meeting-card">
            <div class="next-meeting-poster">
                <img src="${poster || defaults.poster}" alt="Постер: ${film || 'Фильм'} (${year || 'Год'})" loading="lazy" onerror="this.src='${defaults.poster}'">
                <div class="next-meeting-badge">Обсуждение #${discussionNumber || 'N/A'}</div>
            </div>
            <div class="next-meeting-info">
                <div class="next-meeting-header">
                    <h3 class="next-meeting-title">${film || 'Фильм'} (${year || 'Год'})</h3>
                    <div class="next-meeting-meta">
                        <span class="next-meeting-datetime">📅 ${date || 'Дата не указана'} 🕒 ${time || 'Время не указано'}</span>
                    </div>
                </div>
                <div class="next-meeting-details">
                    ${createMeetingDetail('🎬', 'Режиссер:', director)}
                    ${createMeetingDetail('🎭', 'Жанр:', genre)}
                    ${createMeetingDetail('🌍', 'Страна:', country)}
                    ${createMeetingDetail('📍', 'Место:', place)}
                </div>
                
                <div id="meeting-countdown"></div>
                
                ${description ? `
                    <div class="next-meeting-description">
                        <p>${description}</p>
                    </div>
                ` : ''}
                
                ${kinopoiskUrl ? `
                    <a href="${kinopoiskUrl}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="next-meeting-kinopoisk-btn">
                       🎬 Информация о фильме на КиноПоиске
                    </a>
                ` : ''}
                ${requirements ? `<div class="next-meeting-requirements"><p>⚠️ <strong>Важно:</strong> ${requirements}</p></div>` : ''}
            </div>
        </div>
    `;

    // Таймер после отрисовки основной информации (исправленная часть)
    const countdownContainer = document.getElementById('meeting-countdown');
    if (countdownContainer && date && time) {
        try {
            const timerElement = createCountdownTimer(meetingData);
            if (timerElement) {
                countdownContainer.appendChild(timerElement);

                // Запускаем таймер после добавления в DOM
                setTimeout(() => {
                    const meetingDateTime = parseMeetingDateTime(date, time);
                    if (meetingDateTime && !isNaN(meetingDateTime.getTime())) {
                        startCountdown(timerElement, meetingDateTime);
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Ошибка создания таймера:', error);
            countdownContainer.innerHTML = `<div class="countdown-error"><p>Таймер временно недоступен</p></div>`;
        }
    } else if (countdownContainer) {
        countdownContainer.innerHTML = `<div class="countdown-error"><p>Дата и время встречи не указаны</p></div>`;
    }
}

/**
 * Создает HTML-элемент детали информации о встрече
 * 
 * @param {string} icon - Иконка элемента
 * @param {string} label - Подпись элемента
 * @param {string} value - Значение элемента
 * @returns {string} - HTML-строка элемента
 */
function createMeetingDetail(icon, label, value) {
    return value ? `<div class="next-meeting-detail"><span class="detail-icon">${icon}</span><span><strong>${label}</strong> ${value}</span></div>` : '';
}

/**
 * Показывает сообщение об ошибке загрузки информации о встрече
 * 
 * @returns {void}
 */
function showNextMeetingError() {
    if (!DOM.nextMeetingContainer) return;
    DOM.nextMeetingContainer.innerHTML = `<div class="error-message"><p>Не удалось загрузить информацию о встрече</p><button class="retry-button" onclick="loadNextMeeting()">${CONFIG.messages.retry}</button></div>`;
}

/**
 * Показывает индикатор загрузки для топ-списков
 * 
 * @returns {void}
 */
function showLoadingForTops() {
    const loadingHTML = `<div class="loading-message"><div class="spinner" aria-hidden="true"></div><p>${CONFIG.messages.loading}</p></div>`;
    [DOM.topBestFilms, DOM.topWorstFilms, DOM.topGenres, DOM.topDirectors].forEach(container => {
        if (container) container.innerHTML = loadingHTML;
    });
}

/**
 * Загружает данные из кэша и рендерит их
 * 
 * @returns {void}
 */
function loadFromCache() {
    const { cache } = STATE;
    if (cache.films) STATE.films = cache.films;
    if (cache.works) STATE.works = cache.works;
    if (cache.nextMeeting) STATE.nextMeeting = cache.nextMeeting;
    if (cache.tops) {
        renderTopsFromCache();
        initTopsControls();
        return;
    }

    sortFilmsByDate();
    resetPagination();
    renderAllData();
    analyzeDataAndCreateTops();
}

/**
 * Сортирует фильмы по дате в порядке убывания
 * 
 * @returns {void}
 */
function sortFilmsByDate() {
    STATE.sortedFilms = [...STATE.films].sort((a, b) => {
        const dateA = parseDate(a['Дата']);
        const dateB = parseDate(b['Дата']);
        return dateB - dateA;
    });
}

/**
 * Сбрасывает состояние пагинации
 * 
 * @returns {void}
 */
function resetPagination() {
    STATE.pagination = {
        currentPage: 1,
        totalFilms: STATE.sortedFilms.length,
        hasMore: STATE.sortedFilms.length > CONFIG.defaults.filmsPerPage
    };
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
        nextMeeting: STATE.nextMeeting,
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
 * Загружает данные о фильмах
 * 
 * @returns {Promise<void>}
 */
async function loadFilmsData() {
    try {
        const data = await fetchDataWithFallback(CONFIG.dataSources.films);
        STATE.films = data;
        sortFilmsByDate();
        resetPagination();
        renderFilms();
        analyzeDataAndCreateTops();
        saveToCache();
    } catch (error) {
        console.error('Ошибка загрузки фильмов:', error);
        tryLoadFromLocalStorage();
        if (!STATE.films.length) loadMockFilmsData();
    }
}

/**
 * Загружает данные о работах участников
 * 
 * @returns {Promise<void>}
 */
async function loadWorksData() {
    try {
        const data = await fetchDataWithFallback(CONFIG.dataSources.works);
        STATE.works = data;
        renderWorks(data);
        saveToCache();
    } catch (error) {
        console.error('Ошибка загрузки работ:', error);
        loadMockWorksData();
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
 * Пытается загрузить данные из localStorage
 * 
 * @returns {void}
 */
function tryLoadFromLocalStorage() {
    try {
        const cache = localStorage.getItem('cinemaClubCache');
        const lastUpdated = localStorage.getItem('cinemaClubLastUpdated');

        if (cache && lastUpdated) {
            STATE.cache = JSON.parse(cache);
            STATE.lastUpdated = parseInt(lastUpdated);
            if (isCacheValid()) loadFromCache();
        }
    } catch (e) {
        console.error('Ошибка загрузки из кэша:', e);
    }
}

/**
 * Загружает следующую порцию фильмов для пагинации
 * 
 * @returns {void}
 */
function loadMoreFilms() {
    if (!STATE.pagination.hasMore) return;
    STATE.pagination.currentPage += 1;
    renderFilms();
}

/**
 * Рендерит список фильмов с учетом пагинации
 * 
 * @returns {void}
 */
function renderFilms() {
    if (!DOM.filmsContainer || !STATE.sortedFilms) {
        console.warn('Контейнер фильмов или данные не доступны');
        return;
    }

    if (!STATE.sortedFilms.length) {
        DOM.filmsContainer.innerHTML = `<p class="no-data">${CONFIG.messages.noFilms}</p>`;
        if (DOM.loadMoreBtn) DOM.loadMoreBtn.style.display = 'none';
        return;
    }

    const filmsToShow = Math.min(
        CONFIG.defaults.filmsPerPage * STATE.pagination.currentPage,
        STATE.sortedFilms.length
    );

    const paginatedFilms = STATE.sortedFilms.slice(0, filmsToShow);
    STATE.pagination.hasMore = STATE.sortedFilms.length > filmsToShow;

    updateLoadMoreButton();

    const filmsHTML = paginatedFilms.map(film =>
        createFilmCard(film, { showFullInfo: true })
    ).join('');

    DOM.filmsContainer.innerHTML = filmsHTML;
}

/**
 * Создает HTML-карточку фильма
 * 
 * @param {object} film - Данные фильма
 * @param {object} options - Опции отображения
 * @param {boolean} options.showDiscussionNumber - Показывать номер обсуждения
 * @param {boolean} options.showDate - Показывать дату
 * @param {boolean} options.isTopItem - Является ли элементом топа
 * @param {boolean} options.showFullInfo - Показывать полную информацию
 * @returns {string} - HTML-строка карточки фильма
 */
function createFilmCard(film, options = {}) {
    const {
        showDiscussionNumber = true,
        showDate = true,
        isTopItem = false,
        showFullInfo = true
    } = options;

    const { defaults } = CONFIG;
    const rating = parseFloat(film['Оценка']) || 0;
    const formattedRating = rating.toFixed(defaults.ratingPrecision);
    const filmName = film['Фильм'] || 'Неизвестный фильм';
    const filmYear = film['Год'] || '';
    const discussionNumber = film['Номер обсуждения'] || 'N/A';

    const kinopoiskUrl = generateKinopoiskUrl(filmName, filmYear);

    const baseHTML = `
    <article class="film-card ${isTopItem ? 'top-item' : ''}" role="article" 
             aria-labelledby="film-${discussionNumber}-title">
        <div class="film-card-image">
            <img src="${film['Постер URL'] || defaults.poster}" 
                 alt="Постер: ${filmName} (${filmYear})" 
                 class="film-thumbnail"
                 loading="lazy"
                 onerror="this.src='${defaults.poster}'">
            <div class="film-rating" aria-label="Рейтинг: ${formattedRating}">
                ${createRatingStars(rating)}
                <span class="rating-number">${formattedRating}</span>
            </div>
            
            ${kinopoiskUrl ? `
            <div class="poster-overlay">
                <a href="${kinopoiskUrl}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   class="kinopoisk-poster-button"
                   aria-label="Информация о фильме ${filmName} на КиноПоиске">
                   🎬 ${isTopItem ? 'КиноПоиск' : 'Информация о фильме'}
                </a>
            </div>
            ` : ''}
        </div>
        <div class="film-info">
            ${showDiscussionNumber ? `
            <div class="discussion-header">
                <span class="discussion-number">Обсуждение #${discussionNumber}</span>
                ${showDate ? `<span class="discussion-date">${formatDate(film['Дата'])}</span>` : ''}
            </div>
            ` : ''}
            
            <h3 id="film-${discussionNumber}-title">
                ${filmName} ${filmYear ? `(${filmYear})` : ''}
            </h3>
            
            ${showFullInfo ? `
            ${createFilmMeta('Режиссер:', film['Режиссер'])}
            ${createFilmMeta('Жанр:', film['Жанр'])}
            ${createFilmMeta('Страна:', film['Страна'])}
            ${createFilmMeta('Участников:', film['Участников'])}
            ${film['Описание'] ? `<p class="film-description">${film['Описание']}</p>` : ''}
            ` : ''}
        </div>
    </article>
    `;

    return isTopItem ? baseHTML.replace('film-card', 'top-film-card') : baseHTML;
}

/**
 * Создает HTML-элемент мета-информации фильма
 * 
 * @param {string} label - Подпись мета-информации
 * @param {string} value - Значение мета-информации
 * @returns {string} - HTML-строка элемента
 */
function createFilmMeta(label, value) {
    return value ? `<p class="film-meta"><span class="meta-label">${label}</span> ${value}</p>` : '';
}

/**
 * Обновляет состояние кнопки "Загрузить еще"
 * 
 * @returns {void}
 */
function updateLoadMoreButton() {
    if (!DOM.loadMoreBtn) return;

    if (STATE.pagination.hasMore) {
        DOM.loadMoreBtn.style.display = 'block';
        DOM.loadMoreBtn.textContent = CONFIG.messages.loadMore;
        DOM.loadMoreBtn.removeAttribute('disabled');
    } else if (STATE.pagination.currentPage > 1) {
        DOM.loadMoreBtn.textContent = CONFIG.messages.allFilmsLoaded;
        DOM.loadMoreBtn.setAttribute('disabled', 'true');
        setTimeout(() => {
            DOM.loadMoreBtn.style.display = 'none';
        }, 3000);
    } else {
        DOM.loadMoreBtn.style.display = 'none';
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
 * Рендерит все данные приложения
 * 
 * @returns {void}
 */
function renderAllData() {
    renderFilms();
    renderWorks(STATE.works);
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
 * Анализирует данные и создает топ-списки
 * 
 * @returns {void}
 */
function analyzeDataAndCreateTops() {
    if (!STATE.films.length) {
        showNoDataForTops();
        return;
    }

    createTopFilms('best');
    createTopFilms('worst');
    createTopGenres();
    createTopDirectors();
    renderTops();
    initTopsControls();
}

/**
 * Покажает сообщение об отсутствии данных для топ-списков
 * 
 * @returns {void}
 */
function showNoDataForTops() {
    const noDataHTML = `<p class="no-data">${CONFIG.messages.noTopData}</p>`;
    [DOM.topBestFilms, DOM.topWorstFilms, DOM.topGenres, DOM.topDirectors].forEach(container => {
        if (container) container.innerHTML = noDataHTML;
    });
}

/**
 * Создает топ-список фильмов (лучшие/худшие)
 * 
 * @param {string} type - Тип топа ('best' или 'worst')
 * @returns {void}
 */
function createTopFilms(type) {
    const container = type === 'best' ? DOM.topBestFilms : DOM.topWorstFilms;
    if (!container) return;

    const topFilms = getTopFilms(type);

    if (topFilms.length < 3) {
        container.innerHTML = `<p class="no-data">${CONFIG.messages.noTopData}</p>`;
        return;
    }

    container.innerHTML = topFilms.map((film, index) => {
        const posterUrl = film['Постер URL'] || CONFIG.defaults.poster;
        const rating = parseFloat(film['Оценка']);
        const filmName = film['Фильм'] || 'Неизвестный фильм';
        const filmYear = film['Год'] || '';
        const kinopoiskUrl = generateKinopoiskUrl(filmName, filmYear);

        return `
        <div class="top-item">
            <div class="top-rank">${index + 1}</div>
            <div class="top-poster">
                <img src="${posterUrl}" 
                     alt="${filmName}" 
                     loading="lazy"
                     onerror="this.src='${CONFIG.defaults.poster}'">
                ${kinopoiskUrl ? `
                <div class="poster-overlay">
                    <a href="${kinopoiskUrl}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="kinopoisk-poster-button"
                       aria-label="Информация о фильме на КиноПоиске">
                       🎬 КиноПоиск
                    </a>
                </div>
                ` : ''}
            </div>
            <div class="top-info">
                <div class="top-film-title">${filmName} ${filmYear ? `(${filmYear})` : ''}</div>
                <div class="top-film-meta">
                    <span class="top-director">${film['Режиссер'] || 'Неизвестен'}</span>
                    <span class="top-rating">
                        <span class="rating-stars">${createRatingStars(rating)}</span>
                        ${rating.toFixed(1)}
                    </span>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

/**
 * Создает топ-список жанров
 * 
 * @returns {void}
 */
function createTopGenres() {
    if (!DOM.topGenres) return;
    const topGenres = getTopGenres();

    if (!topGenres.length) {
        DOM.topGenres.innerHTML = `<p class="no-data">${CONFIG.messages.noTopData}</p>`;
        return;
    }

    DOM.topGenres.innerHTML = topGenres.map(({ genre, count }, index) => `
        <div class="top-item">
            <div class="top-rank">${index + 1}</div>
            <div class="top-info">
                <div class="top-film-title">${capitalizeFirstLetter(genre)}</div>
                <div class="top-film-meta">
                    <span class="rating-badge">${count} ${getRussianWordForm(count, 'фильм', 'фильма', 'фильмов')}</span>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Создает топ-список режиссеров
 * 
 * @returns {void}
 */
function createTopDirectors() {
    if (!DOM.topDirectors) return;
    const topDirectors = getTopDirectors();

    if (!topDirectors.length) {
        DOM.topDirectors.innerHTML = `<p class="no-data">${CONFIG.messages.noTopData}</p>`;
        return;
    }

    DOM.topDirectors.innerHTML = topDirectors.map(({ director, count }, index) => `
        <div class="top-item">
            <div class="top-rank">${index + 1}</div>
            <div class="top-info">
                <div class="top-film-title">${capitalizeFirstLetter(director)}</div>
                <div class="top-film-meta">
                    <span class="rating-badge">${count} ${getRussianWordForm(count, 'фильм', 'фильма', 'фильмов')}</span>
                </div>
            </div>
        </div>
    `).join('');
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
 * Возвращает топ-N фильмов по рейтингу
 * 
 * @param {string} type - Тип топа ('best' или 'worst')
 * @returns {Array} - Массив топ-фильмов
 */
function getTopFilms(type) {
    const ratedFilms = STATE.films.filter(film => {
        const rating = parseFloat(film['Оценка']);
        return !isNaN(rating) && rating > 0;
    });

    return [...ratedFilms].sort((a, b) => {
        const ratingA = parseFloat(a['Оценка']);
        const ratingB = parseFloat(b['Оценка']);
        return type === 'best' ? ratingB - ratingA : ratingA - ratingB;
    }).slice(0, CONFIG.defaults.topLimit);
}

/**
 * Возвращает топ-N жанров по количеству фильмов
 * 
 * @returns {Array} - Массив объектов {genre, count}
 */
function getTopGenres() {
    const genreCount = {};

    STATE.films.forEach(film => {
        const genre = film['Жанр'];
        if (genre) {
            genre.split(',').map(g => g.trim().toLowerCase()).filter(g => g).forEach(normalizedGenre => {
                genreCount[normalizedGenre] = (genreCount[normalizedGenre] || 0) + 1;
            });
        }
    });

    return Object.entries(genreCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, CONFIG.defaults.topLimit)
        .map(([genre, count]) => ({ genre, count }));
}

/**
 * Возвращает топ-N режиссеров по количеству фильмов
 * 
 * @returns {Array} - Массив объектов {director, count}
 */
function getTopDirectors() {
    const directorCount = {};

    STATE.films.forEach(film => {
        const director = film['Режиссер'];
        if (director) {
            const normalizedDirector = capitalizeFirstLetter(director.trim().toLowerCase());
            if (normalizedDirector) directorCount[normalizedDirector] = (directorCount[normalizedDirector] || 0) + 1;
        }
    });

    return Object.entries(directorCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, CONFIG.defaults.topLimit)
        .map(([director, count]) => ({ director, count }));
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
 * Рендерит все топ-списки
 * 
 * @returns {void}
 */
function renderTops() {
    if (!STATE.films.length) return;

    const bestFilms = getTopFilms('best');
    const worstFilms = getTopFilms('worst');
    const topGenres = getTopGenres();
    const topDirectors = getTopDirectors();

    // Рендерим лучшие фильмы
    if (DOM.topBestFilms && bestFilms.length) {
        DOM.topBestFilms.innerHTML = bestFilms.map((film, index) =>
            createTopItem(film, index, 'film', STATE.topsView.limit === 3)
        ).join('');
    }

    // Рендерим худшие фильмы
    if (DOM.topWorstFilms && worstFilms.length) {
        DOM.topWorstFilms.innerHTML = worstFilms.map((film, index) =>
            createTopItem(film, index, 'film', STATE.topsView.limit === 3)
        ).join('');
    }

    // Рендерим жанры
    if (DOM.topGenres && topGenres.length) {
        DOM.topGenres.innerHTML = topGenres.map((genre, index) =>
            createTopItem(genre, index, 'genre', STATE.topsView.limit === 3)
        ).join('');
    }

    // Рендерим режиссеров
    if (DOM.topDirectors && topDirectors.length) {
        DOM.topDirectors.innerHTML = topDirectors.map((director, index) =>
            createTopItem(director, index, 'director', STATE.topsView.limit === 3)
        ).join('');
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
 * Рендерит топ-списки из кэша
 * 
 * @returns {void}
 */
function renderTopsFromCache() {
    if (!STATE.cache.tops) return;
    const { tops } = STATE.cache;

    // Рендерим лучшие фильмы
    if (DOM.topBestFilms && tops.best) {
        DOM.topBestFilms.innerHTML = tops.best.map((film, index) =>
            createTopItem(film, index, 'film', STATE.topsView.limit === 3)
        ).join('');
    }

    // Рендерим худшие фильмы
    if (DOM.topWorstFilms && tops.worst) {
        DOM.topWorstFilms.innerHTML = tops.worst.map((film, index) =>
            createTopItem(film, index, 'film', STATE.topsView.limit === 3)
        ).join('');
    }

    // Рендерим жанры
    if (DOM.topGenres && tops.genres) {
        DOM.topGenres.innerHTML = tops.genres.map((genre, index) =>
            createTopItem(genre, index, 'genre', STATE.topsView.limit === 3)
        ).join('');
    }

    // Рендерим режиссеров
    if (DOM.topDirectors && tops.directors) {
        DOM.topDirectors.innerHTML = tops.directors.map((director, index) =>
            createTopItem(director, index, 'director', STATE.topsView.limit === 3)
        ).join('');
    }

    initTopsControls();
}

/**
 * Загружает демонстрационные данные о фильмах
 * 
 * @returns {void}
 */
function loadMockFilmsData() {
    const mockFilms = [
        {
            "Фильм": "Начало", "Режиссер": "Кристофер Нолан", "Жанр": "Фантастика, Триллер",
            "Страна": "США, Великобритания", "Год": "2010", "Оценка": "8.7",
            "Номер обсуждения": "1", "Дата": "01.01.2023", "Постер URL": "assets/images/default-poster.jpg",
            "Описание": "Проникая в сны других людей, Дом Кобб должен выполнить задание, которое станет возможностью искупить его прошлые прегрешения.",
            "Участников": "7"
        },
        {
            "Фильм": "Паразиты", "Режиссер": "Пон Джун Хо", "Жанр": "Драма, Комедия",
            "Страна": "Южная Корея", "Год": "2019", "Оценка": "8.6",
            "Номер обсуждения": "2", "Дата": "08.01.2023", "Постер URL": "assets/images/default-poster.jpg",
            "Описание": "Бедная корейская семья внедряется в жизнь богатого дома, что приводит к неожиданным последствиям.",
            "Участников": "6"
        },
        {
            "Фильм": "Криминальное чтиво", "Режиссер": "Квентин Тарантино", "Жанр": "Криминал, Драма",
            "Страна": "США", "Год": "1994", "Оценка": "8.9",
            "Номер обсуждения": "3", "Дата": "15.01.2023", "Постер URL": "assets/images/default-poster.jpg",
            "Описание": "Несколько взаимосвязанных историй из жизни бандитов и мелких преступников.",
            "Участников": "8"
        },
        {
            "Фильм": "Я шагаю по Москве",
            "Режиссер": "Георгий Данелия",
            "Жанр": "Мелодрама, Комедия",
            "Страна": "",
            "Год": "1963",
            "Оценка": "8.80",
            "Номер обсуждения": "250",
            "Дата": "27.07.2025",
            "Постер URL": "https://sun9-28.userapi.com/s/v1/ig2/avMk0VPo2hy47jkANqXzuBbfSTX-IWBnaRdnbjmZ0-kdRoINPxmXKcQT-P-Gb8Lmjxem02G2Ci6aM1BSkAOujeHO.jpg?quality=95&as=32x41,48x62,72x93,108x139,160x206,240x310,360x465,480x619,540x697,640x826,720x929,1080x1394,1249x1612&from=bu&cs=1249x0",
            "Описание": "",
            "Участников": ""
        },
        {
            "Фильм": "All Eyez on Me/2pac: Легенда",
            "Режиссер": "Бенни Бум",
            "Жанр": "Биография, Музыка, Драма",
            "Страна": "",
            "Год": "2017",
            "Оценка": "6.00",
            "Номер обсуждения": "249",
            "Дата": "20.07.2025",
            "Постер URL": "https://sun9-81.userapi.com/s/v1/ig2/28GRwIEEU_mGAaYKwrNTQ3AxL0P7rLfWwW4TqvoLYhmQ2_8M9M9T0BN6WyAN3anIoxtGd6d8WbeHf4tpRyB1-ycG.jpg?quality=95&as=32x46,48x69,72x103,108x154,160x229,240x343,360x514,480x686,540x771,640x914,720x1029,1080x1543,1280x1829,1440x2057,1792x2560&from=bu&cs=1792x0",
            "Описание": "",
            "Участников": ""
        },
        {
            "Фильм": "Amores perros/Сука-любовь",
            "Режиссер": "Алехандро Гонсалес Иньярриту",
            "Жанр": "Триллер, Драма, Криминал",
            "Страна": "",
            "Год": "2000",
            "Оценка": "7.10",
            "Номер обсуждения": "248",
            "Дата": "13.07.2025",
            "Постер URL": "https://sun9-77.userapi.com/s/v1/ig2/Q91kMgxR5t6YrRGSs3bx2uFJjj98U4Gl0JYTY-DWHmJe7gKzIQLw842yglmdJlLcqyWlE_TmHxDCwB8ER5HZPW5G.jpg?quality=95&as=32x44,48x66,72x99,108x148,160x219,240x329,360x494,480x658,540x741,640x878,720x988,729x1000&from=bu&cs=729x0",
            "Описание": "",
            "Участников": ""
        }
    ];

    STATE.films = mockFilms;
    sortFilmsByDate();
    resetPagination();
    renderFilms();
    analyzeDataAndCreateTops();

    showMockDataWarning('фильмов');
}

/**
 * Загружает демонстрационные данные о работах
 * 
 * @returns {void}
 */
function loadMockWorksData() {
    const mockWorks = [
        {
            "Название": "Экспериментальное видео 'Рассвет'", "Год": "2023", "Тип": "Короткометражный фильм",
            "Ссылка на видео": "#", "URL постера": "assets/images/default-poster.jpg",
            "Описание": "Пример творческой работы участников киноклуба"
        },
        {
            "Название": "Документальный этюд", "Год": "2023", "Тип": "Документальный фильм",
            "Ссылка на видео": "#", "URL постера": "assets/images/default-poster.jpg",
            "Описание": "Исследование городской среды через призму кинокамеры"
        }
    ];

    STATE.works = mockWorks;
    renderWorks(mockWorks);

    showMockDataWarning('работ');
}

/**
 * Загружает демонстрационные данные о следующей встрече
 * 
 * @returns {void}
 */
function loadMockNextMeetingData() {
    const mockMeeting = {
        "date": "31.08.2025", "time": "15:00", "place": "Кофейня \"Том Сойер\", ул. Шмидта, 12",
        "film": "Sommaren med Monika/Лето с Моникой", "director": "Ингмар Бергман",
        "genre": "Драма, Мелодрама", "country": "Швеция", "year": "1953",
        "poster": "assets/images/default-poster.jpg", "discussionNumber": "255",
        "description": "Молодые влюбленные пытаются сбежать от скучной реальности, но их идиллическое лето заканчивается суровым столкновением с действительностью.",
        "requirements": "Рекомендуем посмотреть фильм заранее"
    };

    STATE.nextMeeting = mockMeeting;
    renderNextMeeting(mockMeeting);

    showMockDataWarning('информации о встрече');
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
    }, 10000);
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

// Загрузка кэша из localStorage при загрузке страницы
window.addEventListener('load', () => {
    try {
        const cache = localStorage.getItem('cinemaClubCache');
        const lastUpdated = localStorage.getItem('cinemaClubLastUpdated');

        if (cache && lastUpdated) {
            STATE.cache = JSON.parse(cache);
            STATE.lastUpdated = parseInt(lastUpdated);

            if (isCacheValid() && STATE.cache.tops) renderTopsFromCache();
            if (isCacheValid() && STATE.cache.nextMeeting) renderNextMeeting(STATE.cache.nextMeeting);
        }
    } catch (e) {
        console.error('Ошибка загрузки кэша:', e);
    }
});

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
 * Создает и возвращает элемент таймера обратного отсчета до встречи
 * 
 * @param {object} meetingData - Данные о встрече
 * @returns {HTMLElement} - Элемент таймера
 */
function createCountdownTimer(meetingData) {
    if (!meetingData || !meetingData.date || !meetingData.time) {
        return createErrorElement('Дата и время встречи не указаны');
    }

    try {
        // Создаем контейнер таймера
        const timerContainer = document.createElement('div');
        timerContainer.className = 'countdown-timer';
        timerContainer.setAttribute('role', 'timer');
        timerContainer.setAttribute('aria-live', 'polite');

        // Создаем HTML структуру таймера с начальными значениями
        timerContainer.innerHTML = `
            <div class="countdown-title">До встречи осталось:</div>
            <div class="countdown-grid">
                <div class="countdown-item">
                    <div class="countdown-number" id="countdown-days">--</div>
                    <div class="countdown-label">дней</div>
                </div>
                <div class="countdown-item">
                    <div class="countdown-number" id="countdown-hours">--</div>
                    <div class="countdown-label">часов</div>
                </div>
                <div class="countdown-item">
                    <div class="countdown-number" id="countdown-minutes">--</div>
                    <div class="countdown-label">минут</div>
                </div>
                <div class="countdown-item">
                    <div class="countdown-number" id="countdown-seconds">--</div>
                    <div class="countdown-label">секунд</div>
                </div>
            </div>
            <div class="countdown-completed" style="display: none;">
                <span class="completed-icon">🎬</span>
                <span>Встреча началась!</span>
            </div>
        `;

        return timerContainer;

    } catch (error) {
        console.error('Ошибка создания таймера:', error);
        return createErrorElement('Ошибка создания таймера');
    }
}

/**
 * Парсит дату и время встречи в объект Date
 * 
 * @param {string} dateStr - Строка даты в формате "ДД.ММ.ГГГГ"
 * @param {string} timeStr - Строка времени в формате "ЧЧ:ММ"
 * @returns {Date} - Объект Date
 */
function parseMeetingDateTime(dateStr, timeStr) {
    const [day, month, year] = dateStr.split('.').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Запускает обратный отсчет
 * 
 * @param {HTMLElement} timerContainer - Контейнер таймера
 * @param {Date} targetDate - Целевая дата и время
 */
function startCountdown(timerContainer, targetDate) {
    let previousValues = {
        days: -1,
        hours: -1,
        minutes: -1,
        seconds: -1
    };

    function updateTimer() {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;

        // Если время истекло
        if (distance < 0) {
            showCompletedMessage(timerContainer);
            return;
        }

        // Вычисляем единицы времени
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Обновляем отображение только если значения изменились
        updateNumberIfChanged('days', days, previousValues.days, timerContainer);
        updateNumberIfChanged('hours', hours, previousValues.hours, timerContainer);
        updateNumberIfChanged('minutes', minutes, previousValues.minutes, timerContainer);
        updateNumberIfChanged('seconds', seconds, previousValues.seconds, timerContainer);

        // Сохраняем текущие значения
        previousValues = { days, hours, minutes, seconds };

        // Планируем следующее обновление
        setTimeout(updateTimer, 1000);
    }

    // Запускаем первоначальное обновление
    updateTimer();
}

/**
 * Обновляет число в таймере если оно изменилось
 * 
 * @param {string} unit - Единица времени (days, hours, etc.)
 * @param {number} newValue - Новое значение
 * @param {number} oldValue - Старое значение
 * @param {HTMLElement} container - Контейнер таймера
 */
function updateNumberIfChanged(unit, newValue, oldValue, container) {
    if (newValue !== oldValue) {
        const element = container.querySelector(`#countdown-${unit}`);
        if (element) {
            // Добавляем анимацию обновления
            element.classList.remove('updated');
            void element.offsetWidth; // Trigger reflow
            element.textContent = String(newValue).padStart(2, '0');
            element.classList.add('updated');
        }
    }
}

/**
 * Показывает сообщение о завершении отсчета
 * 
 * @param {HTMLElement} timerContainer - Контейнер таймера
 */
function showCompletedMessage(timerContainer) {
    const grid = timerContainer.querySelector('.countdown-grid');
    const completedMessage = timerContainer.querySelector('.countdown-completed');

    if (grid && completedMessage) {
        grid.style.display = 'none';
        completedMessage.style.display = 'flex';

        // Обновляем ARIA-атрибуты
        timerContainer.setAttribute('aria-label', 'Встреча началась');
    }
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
 * Извлекает адрес из данных о встрече или возвращает адрес по умолчанию
 * 
 * @param {object} meetingData - Данные о встрече
 * @returns {string} - Адрес места встречи
 */
function getMeetingAddress(meetingData) {
    if (meetingData && meetingData.place) {
        return meetingData.place;
    }

    // Адрес по умолчанию
    return "ул. Шмидта, 12, Севастополь";
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
