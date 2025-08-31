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
        topLimit: 10
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

const DATE_FORMATS = [
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
];

// Хранилище для обработчиков событий
const EVENT_HANDLERS = {
    online: null,
    offline: null,
    scroll: null
};

let scrollTimeout = null;

function initApp() {
    cacheDOM();
    initEventListeners();
    checkConnectivity();
    loadInitialData();
    loadNextMeeting();
    updateOnlineStatus();
    initScrollToTop();
}

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

function checkConnectivity() {
    STATE.isOnline = navigator.onLine;
    if (!STATE.isOnline) showOfflineMessage();
}

function updateOnlineStatus() {
    STATE.isOnline = navigator.onLine;
    const statusElement = document.createElement('div');
    statusElement.className = `network-status ${STATE.isOnline ? 'online' : 'offline'}`;
    statusElement.textContent = STATE.isOnline ? 'Онлайн' : 'Офлайн';
    statusElement.setAttribute('aria-live', 'polite');

    document.body.appendChild(statusElement);
    setTimeout(() => statusElement.remove(), 3000);
}

function showOfflineMessage() {
    const offlineMessage = document.createElement('div');
    offlineMessage.className = 'offline-message';
    offlineMessage.innerHTML = `<p>${CONFIG.messages.offline}</p><button class="retry-button">${CONFIG.messages.retry}</button>`;
    document.body.prepend(offlineMessage);
}

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

async function loadNextMeeting() {
    try {
        const data = await fetchDataWithFallback(CONFIG.dataSources.nextMeeting);
        if (data && typeof data === 'object') {
            STATE.nextMeeting = data;
            renderNextMeeting(data);
        } else {
            throw new Error('Неверный формат данных о встрече');
        }
    } catch (error) {
        console.error('Ошибка загрузки информации о встрече:', error);
        showNextMeetingError();
        loadMockNextMeetingData();
    }
}

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
}

function createMeetingDetail(icon, label, value) {
    return value ? `<div class="next-meeting-detail"><span class="detail-icon">${icon}</span><span><strong>${label}</strong> ${value}</span></div>` : '';
}

function showNextMeetingError() {
    if (!DOM.nextMeetingContainer) return;
    DOM.nextMeetingContainer.innerHTML = `<div class="error-message"><p>Не удалось загрузить информацию о встрече</p><button class="retry-button" onclick="loadNextMeeting()">${CONFIG.messages.retry}</button></div>`;
}

function showLoadingForTops() {
    const loadingHTML = `<div class="loading-message"><div class="spinner" aria-hidden="true"></div><p>${CONFIG.messages.loading}</p></div>`;
    [DOM.topBestFilms, DOM.topWorstFilms, DOM.topGenres, DOM.topDirectors].forEach(container => {
        if (container) container.innerHTML = loadingHTML;
    });
}

function loadFromCache() {
    const { cache } = STATE;
    if (cache.films) STATE.films = cache.films;
    if (cache.works) STATE.works = cache.works;
    if (cache.nextMeeting) STATE.nextMeeting = cache.nextMeeting;
    if (cache.tops) {
        renderTopsFromCache();
        return;
    }
    
    sortFilmsByDate();
    resetPagination();
    renderAllData();
    analyzeDataAndCreateTops();
}

function sortFilmsByDate() {
    STATE.sortedFilms = [...STATE.films].sort((a, b) => {
        const dateA = parseDate(a['Дата']);
        const dateB = parseDate(b['Дата']);
        return dateB - dateA;
    });
}

function resetPagination() {
    STATE.pagination = {
        currentPage: 1,
        totalFilms: STATE.sortedFilms.length,
        hasMore: STATE.sortedFilms.length > CONFIG.defaults.filmsPerPage
    };
}

function isCacheValid() {
    return STATE.lastUpdated && (Date.now() - STATE.lastUpdated) < CONFIG.defaults.cacheTTL;
}

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

function loadMoreFilms() {
    if (!STATE.pagination.hasMore) return;
    STATE.pagination.currentPage += 1;
    renderFilms();
}

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

function createFilmMeta(label, value) {
    return value ? `<p class="film-meta"><span class="meta-label">${label}</span> ${value}</p>` : '';
}

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

function renderAllData() {
    renderFilms();
    renderWorks(STATE.works);
}

function showLoading(container) {
    if (!container) return;
    container.innerHTML = `<div class="loading"><div class="spinner" aria-hidden="true"></div><p>${CONFIG.messages.loading}</p></div>`;
    container.classList.add('loading-state');
}

function showError(container, error, retryFunction = null) {
    if (!container) return;
    console.error('Ошибка:', error);
    const errorMessage = error.message.includes('Failed to fetch') ? CONFIG.messages.connectionError : error.message || CONFIG.messages.genericError;
    container.innerHTML = `<div class="error-message"><p>${errorMessage}</p>${retryFunction ? `<button class="retry-button" aria-label="${CONFIG.messages.retry}">${CONFIG.messages.retry}</button>` : ''}</div>`;
    container.classList.remove('loading-state');
}

function createRatingStars(rating) {
    const num = parseFloat(rating) || 0;
    const clamped = Math.min(Math.max(num, 0), CONFIG.defaults.maxRating);
    const full = Math.floor(clamped);
    const half = clamped % 1 >= 0.5 ? 1 : 0;
    const empty = CONFIG.defaults.maxRating - full - half;
    return `<span class="rating-stars" aria-hidden="true">${'★'.repeat(full)}${half ? '⯨' : ''}${'☆'.repeat(empty)}</span>`;
}

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

function formatDate(dateString) {
    if (!dateString) return 'дата не указана';
    const date = parseDate(dateString);
    if (isNaN(date.getTime())) return dateString;
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}

function initScrollToTop() {
    if (!DOM.scrollToTopBtn) return;
    EVENT_HANDLERS.scroll = handleScroll;
    window.addEventListener('scroll', EVENT_HANDLERS.scroll);
    DOM.scrollToTopBtn.addEventListener('click', scrollToTop);
}

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

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function analyzeDataAndCreateTops() {
    if (!STATE.films.length) {
        showNoDataForTops();
        return;
    }
    
    createTopFilms('best');
    createTopFilms('worst');
    createTopGenres();
    createTopDirectors();
}

function showNoDataForTops() {
    const noDataHTML = `<p class="no-data">${CONFIG.messages.noTopData}</p>`;
    [DOM.topBestFilms, DOM.topWorstFilms, DOM.topGenres, DOM.topDirectors].forEach(container => {
        if (container) container.innerHTML = noDataHTML;
    });
}

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

function createTopGenres() {
    if (!DOM.topGenres) return;
    const topGenres = getTopGenres();
    
    if (!topGenres.length) {
        DOM.topGenres.innerHTML = `<p class="no-data">${CONFIG.messages.noTopData}</p>`;
        return;
    }
    
    DOM.topGenres.innerHTML = topGenres.map(({genre, count}, index) => `
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

function createTopDirectors() {
    if (!DOM.topDirectors) return;
    const topDirectors = getTopDirectors();
    
    if (!topDirectors.length) {
        DOM.topDirectors.innerHTML = `<p class="no-data">${CONFIG.messages.noTopData}</p>`;
        return;
    }
    
    DOM.topDirectors.innerHTML = topDirectors.map(({director, count}, index) => `
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

function getRussianWordForm(number, one, two, five) {
    const n = Math.abs(number) % 100;
    if (n >= 5 && n <= 20) return five;
    switch (n % 10) {
        case 1: return one;
        case 2: case 3: case 4: return two;
        default: return five;
    }
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

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
        .sort(([,a], [,b]) => b - a)
        .slice(0, CONFIG.defaults.topLimit)
        .map(([genre, count]) => ({ genre, count }));
}

function getTopDirectors() {
    const directorCount = {};
    
    STATE.films.forEach(film => {
        const director = film['Режиссер'];
        if (director) {
            const normalizedDirector = director.trim().toLowerCase();
            if (normalizedDirector) directorCount[normalizedDirector] = (directorCount[normalizedDirector] || 0) + 1;
        }
    });
    
    return Object.entries(directorCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, CONFIG.defaults.topLimit)
        .map(([director, count]) => ({ director, count }));
}

function renderTopsFromCache() {
    if (!STATE.cache.tops) return;
    const { tops } = STATE.cache;
    
    if (DOM.topBestFilms && tops.best) renderTopFromCache(DOM.topBestFilms, tops.best);
    if (DOM.topWorstFilms && tops.worst) renderTopFromCache(DOM.topWorstFilms, tops.worst);
    
    if (DOM.topGenres && tops.genres) {
        DOM.topGenres.innerHTML = tops.genres.map(({genre, count}, index) => `
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
    
    if (DOM.topDirectors && tops.directors) {
        DOM.topDirectors.innerHTML = tops.directors.map(({director, count}, index) => `
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
}

function renderTopFromCache(container, films) {
    container.innerHTML = films.map((film, index) => {
        const posterUrl = film['Постер URL'] || CONFIG.defaults.poster;
        const rating = parseFloat(film['Оценка']);
        return `
        <div class="top-item">
            <div class="top-rank">${index + 1}</div>
            <div class="top-poster">
                <img src="${posterUrl}" alt="${film['Фильм']}" loading="lazy" onerror="this.src='${CONFIG.defaults.poster}'">
            </div>
            <div class="top-info">
                <div class="top-film-title">${film['Фильм']} (${film['Год']})</div>
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

function initYandexMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer || typeof ymaps === 'undefined') {
        showMapFallback();
        return;
    }

    try {
        ymaps.ready(() => {
            try {
                const map = new ymaps.Map('map', {
                    center: [44.601145, 33.520966],
                    zoom: 16,
                    controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
                });

                const placemark = new ymaps.Placemark([44.601145, 33.520966], {
                    hintContent: 'Кофейня "Том Сойер"',
                    balloonContent: '<strong>Кофейня "Том Сойер"</strong><br>ул. Шмидта, 12, Севастополь<br><em>Место встреч киноклуба</em>'
                }, {
                    iconLayout: 'default#image',
                    iconImageHref: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiM2YTExY2IiIGZpbGwtb3BhY2l0eT0iMC44IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIyMCIgeT0iMjUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSJib2xkIj7QmtC+PC90ZXh0Pgo8L3N2Zz4=',
                    iconImageSize: [40, 40],
                    iconImageOffset: [-20, -40]
                });

                map.geoObjects.add(placemark);
                
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

function showMapFallback() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    
    let fallback = mapContainer.querySelector('.map-fallback');
    
    if (!fallback) {
        fallback = document.createElement('div');
        fallback.className = 'map-fallback';
        fallback.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#2c3e50,#34495e);color:white;text-align:center;padding:20px;border-radius:8px';
        fallback.innerHTML = `
            <div>
                <div style="font-size:3rem;margin-bottom:1rem;">🗺️</div>
                <h3 style="margin-bottom:1rem;color:#6a11cb;">Карта временно недоступна</h3>
                <p style="margin-bottom:0.5rem;"><strong>Адрес:</strong> ул. Шмидта, 12, Севастополь</p>
                <p style="margin-bottom:1rem;"><strong>Место:</strong> Кофейня "Том Сойер"</p>
                <p style="font-size:0.9rem;opacity:0.8;">Мы встречаемся здесь каждую неделю!</p>
            </div>
        `;
        mapContainer.appendChild(fallback);
    } else {
        fallback.style.display = 'flex';
    }
}

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