// Конфигурация приложения
const CONFIG = {
    // Настройки данных через GitHub
    dataSources: {
        films: {
            url: 'https://raw.githubusercontent.com/ulysses-club/odissea/main/assets/data/films.json',
            type: 'json',
            fallback: 'assets/data/films.json'
        },
        works: {
            url: 'https://raw.githubusercontent.com/ulysses-club/odissea/main/assets/data/works.json',
            type: 'json',
            fallback: 'assets/data/works.json'
        }
    },

    // Настройки по умолчанию
    defaults: {
        poster: 'assets/images/default-poster.jpg',
        ratingPrecision: 1,
        maxRating: 10,
        cacheTTL: 3600000, // 1 час в миллисекундах
        filmsPerPage: 20,
        topLimit: 10 // Ограничение топов до 10 элементов
    },

    // Селекторы DOM
    selectors: {
        filmsContainer: '#films-container',
        worksContainer: '#works-container',
        topBestFilms: '#top-best-films',
        topWorstFilms: '#top-worst-films',
        topGenres: '#top-genres',
        topDirectors: '#top-directors',
        loadMoreBtn: '#load-more-films',
        scrollToTopBtn: '#scroll-to-top'
    },

    // Сообщения
    messages: {
        loading: 'Загрузка данных...',
        noData: 'Нет данных для отображения',
        noFilms: 'Нет данных о фильмах',
        noWorks: 'Нет данных о работах',
        connectionError: 'Ошибка подключения к интернету',
        serverError: 'Ошибка сервера',
        genericError: 'Произошла ошибка',
        retry: 'Попробовать снова',
        offline: 'Вы сейчас офлайн. Показаны кэшированные данные.',
        loadMore: 'Показать еще',
        allFilmsLoaded: 'Все фильмы загружены',
        noTopData: 'Недостаточно данных для формирования топа'
    },

    // API
    api: {
        timeout: 10000 // 10 секунд
    }
};

// Состояние приложения
const STATE = {
    films: [],
    sortedFilms: [],
    works: [],
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
        tops: null
    }
};

// DOM элементы
const DOM = {
    filmsContainer: null,
    worksContainer: null,
    topBestFilms: null,
    topWorstFilms: null,
    topGenres: null,
    topDirectors: null,
    loadMoreBtn: null,
    scrollToTopBtn: null
};

/**
 * Инициализация приложения
 */
function initApp() {
    cacheDOM();
    initEventListeners();
    checkConnectivity();
    loadInitialData();
    updateOnlineStatus();
    initScrollToTop();
}

/**
 * Кэширование DOM элементов
 */
function cacheDOM() {
    DOM.filmsContainer = document.querySelector(CONFIG.selectors.filmsContainer);
    DOM.worksContainer = document.querySelector(CONFIG.selectors.worksContainer);
    DOM.topBestFilms = document.querySelector(CONFIG.selectors.topBestFilms);
    DOM.topWorstFilms = document.querySelector(CONFIG.selectors.topWorstFilms);
    DOM.topGenres = document.querySelector(CONFIG.selectors.topGenres);
    DOM.topDirectors = document.querySelector(CONFIG.selectors.topDirectors);
    DOM.scrollToTopBtn = document.querySelector(CONFIG.selectors.scrollToTopBtn);
    
    // Создаем кнопку "Показать еще", если ее нет в DOM
    if (!DOM.loadMoreBtn) {
        DOM.loadMoreBtn = document.createElement('button');
        DOM.loadMoreBtn.id = 'load-more-films';
        DOM.loadMoreBtn.className = 'load-more-btn';
        DOM.loadMoreBtn.textContent = CONFIG.messages.loadMore;
        DOM.loadMoreBtn.setAttribute('aria-label', 'Загрузить больше фильмов');
        DOM.loadMoreBtn.style.display = 'none';
        
        const filmArchiveSection = document.querySelector('#film-archive');
        if (filmArchiveSection) {
            filmArchiveSection.appendChild(DOM.loadMoreBtn);
        }
    }
}

/**
 * Инициализация обработчиков событий
 */
function initEventListeners() {
    // События онлайн/офлайн
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Кнопка "Попробовать снова"
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('retry-button')) {
            loadInitialData();
        }
    });
    
    // Кнопка "Показать еще"
    if (DOM.loadMoreBtn) {
        DOM.loadMoreBtn.addEventListener('click', loadMoreFilms);
    }

    // Прокрутка страницы
    window.addEventListener('scroll', handleScroll);
}

/**
 * Проверка подключения к интернету
 */
function checkConnectivity() {
    STATE.isOnline = navigator.onLine;
    if (!STATE.isOnline) {
        showOfflineMessage();
    }
}

/**
 * Обновление статуса онлайн
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
 * Показать сообщение об отсутствии интернета
 */
function showOfflineMessage() {
    const offlineMessage = document.createElement('div');
    offlineMessage.className = 'offline-message';
    offlineMessage.innerHTML = `
        <p>${CONFIG.messages.offline}</p>
        <button class="retry-button">${CONFIG.messages.retry}</button>
    `;
    document.body.prepend(offlineMessage);
}

/**
 * Загрузка начальных данных
 */
async function loadInitialData() {
    try {
        // Проверяем кэш перед загрузкой
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

        // Загружаем данные с GitHub или fallback
        await Promise.all([
            loadFilmsData(),
            loadWorksData()
        ]);
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError(DOM.filmsContainer, error);
    }
}

/**
 * Показать состояние загрузки для топов
 */
function showLoadingForTops() {
    const loadingHTML = `
        <div class="loading-message">
            <div class="spinner" aria-hidden="true"></div>
            <p>${CONFIG.messages.loading}</p>
        </div>
    `;
    
    if (DOM.topBestFilms) DOM.topBestFilms.innerHTML = loadingHTML;
    if (DOM.topWorstFilms) DOM.topWorstFilms.innerHTML = loadingHTML;
    if (DOM.topGenres) DOM.topGenres.innerHTML = loadingHTML;
    if (DOM.topDirectors) DOM.topDirectors.innerHTML = loadingHTML;
}

/**
 * Загрузка данных из кэша
 */
function loadFromCache() {
    if (STATE.cache?.films) STATE.films = STATE.cache.films;
    if (STATE.cache?.works) STATE.works = STATE.cache.works;
    if (STATE.cache?.tops) {
        renderTopsFromCache();
        return;
    }
    
    sortFilmsByDate();
    resetPagination();
    renderAllData();
    analyzeDataAndCreateTops();
}

/**
 * Сортировка фильмов по дате (новые сверху)
 */
function sortFilmsByDate() {
    STATE.sortedFilms = [...STATE.films].sort((a, b) => {
        const dateA = parseDate(a['Дата']);
        const dateB = parseDate(b['Дата']);
        return dateB - dateA;
    });
}

/**
 * Сброс состояния пагинации
 */
function resetPagination() {
    STATE.pagination = {
        currentPage: 1,
        totalFilms: STATE.sortedFilms.length,
        hasMore: STATE.sortedFilms.length > CONFIG.defaults.filmsPerPage
    };
}

/**
 * Проверка валидности кэша
 */
function isCacheValid() {
    if (!STATE.lastUpdated) return false;
    return (Date.now() - STATE.lastUpdated) < CONFIG.defaults.cacheTTL;
}

/**
 * Сохранение данных в кэш
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
 * Загрузка данных о фильмах
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
        // Если кэш тоже не работает - загружаем mock данные
        if (!STATE.films.length) {
            loadMockFilmsData();
        }
    }
}

/**
 * Загрузка данных о работах
 */
async function loadWorksData() {
    try {
        const data = await fetchDataWithFallback(CONFIG.dataSources.works);
        STATE.works = data;
        renderWorks(data);
        saveToCache();
    } catch (error) {
        console.error('Ошибка загрузки работ:', error);
        // Загружаем mock данные
        loadMockWorksData();
    }
}

/**
 * Загрузка данных с fallback механизмом
 */
async function fetchDataWithFallback(sourceConfig) {
    try {
        // Пытаемся загрузить с GitHub
        console.log('Загрузка данных с GitHub:', sourceConfig.url);
        const data = await fetchRemoteData(sourceConfig.url);
        
        if (data && data.length > 0) {
            // Сохраняем успешные данные в кэш
            cacheSuccessfulData(sourceConfig.url, data);
            return data;
        }
        throw new Error('Пустые данные с GitHub');
        
    } catch (githubError) {
        console.warn('GitHub недоступен, пробуем локальный fallback:', githubError);
        
        try {
            // Пробуем локальный fallback
            const localData = await fetchRemoteData(sourceConfig.fallback);
            if (localData && localData.length > 0) {
                return localData;
            }
            throw new Error('Пустые локальные данные');
            
        } catch (localError) {
            console.error('Локальный fallback тоже не сработал:', localError);
            throw new Error('Все источники данных недоступны');
        }
    }
}

/**
 * Загрузка удаленных данных
 */
async function fetchRemoteData(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.api.timeout);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
        
    } catch (error) {
        console.error('Ошибка загрузки с', url, error);
        throw error;
    }
}

/**
 * Кэширование успешных данных
 */
function cacheSuccessfulData(url, data) {
    try {
        const cacheKey = `cache_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const cacheData = {
            data: data,
            timestamp: Date.now(),
            url: url
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (e) {
        console.warn('Не удалось сохранить в кэш:', e);
    }
}

/**
 * Попытка загрузки из кэша
 */
function tryLoadFromCache(sourceConfig) {
    try {
        const cacheKey = `cache_${sourceConfig.url.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            const cacheData = JSON.parse(cached);
            // Проверяем актуальность кэша (1 день)
            if (Date.now() - cacheData.timestamp < 86400000) {
                return cacheData.data;
            }
        }
    } catch (e) {
        console.warn('Ошибка загрузки из кэша:', e);
    }
    return null;
}

/**
 * Попытка загрузки из localStorage
 */
function tryLoadFromLocalStorage() {
    try {
        const cache = localStorage.getItem('cinemaClubCache');
        const lastUpdated = localStorage.getItem('cinemaClubLastUpdated');
        
        if (cache && lastUpdated) {
            STATE.cache = JSON.parse(cache);
            STATE.lastUpdated = parseInt(lastUpdated);
            
            if (isCacheValid()) {
                loadFromCache();
            }
        }
    } catch (e) {
        console.error('Ошибка загрузки из кэша:', e);
    }
}

/**
 * Загрузка дополнительных фильмов
 */
function loadMoreFilms() {
    if (!STATE.pagination.hasMore) return;
    
    STATE.pagination.currentPage += 1;
    renderFilms();
}

/**
 * Рендеринг списка фильмов с пагинацией
 */
function renderFilms() {
    if (!DOM.filmsContainer) return;

    if (!STATE.sortedFilms?.length) {
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

    const filmsHTML = paginatedFilms.map(film => createFilmCard(film)).join('');

    if (STATE.pagination.currentPage === 1) {
        DOM.filmsContainer.innerHTML = filmsHTML;
    } else {
        const newFilmsStart = CONFIG.defaults.filmsPerPage * (STATE.pagination.currentPage - 1);
        const newFilms = STATE.sortedFilms.slice(newFilmsStart, filmsToShow);
        addFilmsWithAnimation(newFilms);
    }
}

/**
 * Создает HTML для карточки фильма
 */
function createFilmCard(film) {
    const rating = parseFloat(film['Оценка']) || 0;
    const formattedRating = rating.toFixed(CONFIG.defaults.ratingPrecision);
    
    const director = film['Режиссер'] || 'Неизвестен';
    const genre = film['Жанр'] || 'Не указан';
    const country = film['Страна'] || 'Не указана';
    const participants = film['Участников'] || 'Не указано';

    return `
    <article class="film-card" role="article" aria-labelledby="film-${film['Номер обсуждения']}-title">
        <div class="film-card-image">
            <img src="${film['Постер URL'] || CONFIG.defaults.poster}"
                 alt="Постер: ${film['Фильм']} (${film['Год']})"
                 class="film-thumbnail"
                 loading="lazy"
                 onerror="this.src='${CONFIG.defaults.poster}'">
            <div class="film-rating" aria-label="Рейтинг: ${formattedRating}">
                ${createRatingStars(rating)}
                <span class="rating-number">${formattedRating}</span>
            </div>
        </div>
        <div class="film-info">
            <div class="discussion-header">
                <span class="discussion-number">Обсуждение #${film['Номер обсуждения'] || 'N/A'}</span>
                <span class="discussion-date">${formatDate(film['Дата'])}</span>
            </div>
            <h3 id="film-${film['Номер обсуждения']}-title">${film['Фильм']} (${film['Год']})</h3>
            <p class="film-meta"><span class="meta-label">Режиссер:</span> ${director}</p>
            <p class="film-meta"><span class="meta-label">Жанр:</span> ${genre}</p>
            <p class="film-meta"><span class="meta-label">Страна:</span> ${country}</p>
            <p class="film-meta"><span class="meta-label">Участников:</span> ${participants}</p>
            ${film['Описание'] ? `<p class="film-description">${film['Описание']}</p>` : ''}
        </div>
    </article>
    `;
}

/**
 * Добавляет новые фильмы с анимацией
 */
function addFilmsWithAnimation(newFilms) {
    newFilms.forEach((film, index) => {
        const filmHTML = createFilmCard(film);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = filmHTML;
        const filmElement = tempDiv.firstElementChild;
        
        filmElement.style.opacity = '0';
        filmElement.style.transform = 'translateY(20px)';
        filmElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        filmElement.style.transitionDelay = `${index * 0.1}s`;
        
        DOM.filmsContainer.appendChild(filmElement);
        
        setTimeout(() => {
            filmElement.style.opacity = '1';
            filmElement.style.transform = 'translateY(0)';
        }, 10);
    });
}

/**
 * Обновляет состояние кнопки "Показать еще"
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
 * Рендеринг работ
 */
function renderWorks(works) {
    if (!DOM.worksContainer) return;

    if (!works?.length) {
        DOM.worksContainer.innerHTML = `<p class="no-data">${CONFIG.messages.noWorks}</p>`;
        return;
    }

    DOM.worksContainer.innerHTML = works.map(work => `
        <article class="film-poster" role="article" aria-labelledby="work-${work['Название']}-title">
            <a href="${work['Ссылка на видео'] || '#'}"
               ${work['Ссылка на видео'] ? 'target="_blank" rel="noopener noreferrer"' : ''}
               class="video-link"
               aria-label="${work['Тип'] || 'Работа'}: ${work['Название']} (${work['Год']})">
                <img src="${work['URL постера'] || CONFIG.defaults.poster}"
                     alt="${work['Название']} (${work['Год']})"
                     class="poster-image"
                     loading="lazy"
                     onerror="this.src='${CONFIG.defaults.poster}'">
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
 * Рендеринг всех данных
 */
function renderAllData() {
    renderFilms();
    renderWorks(STATE.works);
}

/**
 * Показать состояние загрузки
 */
function showLoading(container) {
    if (!container) return;

    container.innerHTML = `
        <div class="loading">
            <div class="spinner" aria-hidden="true"></div>
            <p>${CONFIG.messages.loading}</p>
        </div>
    `;
    container.classList.add('loading-state');
}

/**
 * Показать ошибку
 */
function showError(container, error, retryFunction = null) {
    if (!container) return;

    console.error('Ошибка:', error);
    const errorMessage = error.message.includes('Failed to fetch')
        ? CONFIG.messages.connectionError
        : error.message || CONFIG.messages.genericError;

    container.innerHTML = `
        <div class="error-message">
            <p>${errorMessage}</p>
            ${retryFunction ? `
                <button class="retry-button" aria-label="${CONFIG.messages.retry}">
                    ${CONFIG.messages.retry}
                </button>
            ` : ''}
        </div>
    `;
    container.classList.remove('loading-state');
}

/**
 * Создание звезд рейтинга
 */
function createRatingStars(rating) {
    const num = parseFloat(rating) || 0;
    const clamped = Math.min(Math.max(num, 0), CONFIG.defaults.maxRating);
    const full = Math.floor(clamped);
    const half = clamped % 1 >= 0.5 ? 1 : 0;
    const empty = CONFIG.defaults.maxRating - full - half;

    return `
        <span class="rating-stars" aria-hidden="true">
            ${'★'.repeat(full)}${half ? '⯨' : ''}${'☆'.repeat(empty)}
        </span>
    `;
}

/**
 * Парсинг даты из строки
 */
function parseDate(dateString) {
    if (!dateString) return new Date(0);
    
    const formats = [
        /^(\d{2})\.(\d{2})\.(\d{4})$/, // дд.мм.гггг
        /^(\d{4})-(\d{2})-(\d{2})$/,    // гггг-мм-дд
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/ // мм/дд/гггг
    ];
    
    for (const format of formats) {
        const match = dateString.match(format);
        if (match) {
            if (format === formats[0]) { // дд.мм.гггг
                return new Date(`${match[3]}-${match[2]}-${match[1]}`);
            } else if (format === formats[1]) { // гггг-мм-дд
                return new Date(dateString);
            } else { // мм/дд/гггг
                return new Date(`${match[3]}-${match[1]}-${match[2]}`);
            }
        }
    }
    
    return new Date();
}

/**
 * Форматирование даты в строгом формате дд.мм.гггг
 */
function formatDate(dateString) {
    if (!dateString) return 'дата не указана';
    
    const date = parseDate(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
}

/**
 * Прокрутка вверх
 */
function initScrollToTop() {
    if (!DOM.scrollToTopBtn) return;
    
    window.addEventListener('scroll', handleScroll);
    DOM.scrollToTopBtn.addEventListener('click', scrollToTop);
}

function handleScroll() {
    if (!DOM.scrollToTopBtn) return;
    
    if (window.pageYOffset > 300) {
        DOM.scrollToTopBtn.classList.add('visible');
    } else {
        DOM.scrollToTopBtn.classList.remove('visible');
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Анализ данных и создание топов
 */
function analyzeDataAndCreateTops() {
    if (!STATE.films.length) {
        showNoDataForTops();
        return;
    }
    
    // Создаем топы
    createTopFilms('best');
    createTopFilms('worst');
    createTopGenres();
    createTopDirectors();
}

/**
 * Показать сообщение об отсутствии данных для топов
 */
function showNoDataForTops() {
    const noDataHTML = `<p class="no-data">${CONFIG.messages.noTopData}</p>`;
    
    if (DOM.topBestFilms) DOM.topBestFilms.innerHTML = noDataHTML;
    if (DOM.topWorstFilms) DOM.topWorstFilms.innerHTML = noDataHTML;
    if (DOM.topGenres) DOM.topGenres.innerHTML = noDataHTML;
    if (DOM.topDirectors) DOM.topDirectors.innerHTML = noDataHTML;
}

/**
 * Создание топов фильмов
 */
function createTopFilms(type) {
    const containerId = type === 'best' ? 'top-best-films' : 'top-worst-films';
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    const topFilms = getTopFilms(type);
    
    if (topFilms.length < 3) {
        container.innerHTML = `<p class="no-data">${CONFIG.messages.noTopData}</p>`;
        return;
    }
    
    const filmsHTML = topFilms.map((film, index) => {
        const posterUrl = film['Постер URL'] || CONFIG.defaults.poster;
        return `
        <div class="top-item">
            <div class="top-rank">${index + 1}</div>
            <div class="top-poster">
                <img src="${posterUrl}" 
                     alt="${film['Фильм']}" 
                     loading="lazy"
                     onerror="this.src='${CONFIG.defaults.poster}'">
            </div>
            <div class="top-info">
                <div class="top-film-title">${film['Фильм']} (${film['Год']})</div>
                <div class="top-film-meta">
                    <span class="top-director">${film['Режиссер'] || 'Неизвестен'}</span>
                    <span class="top-rating">
                        <span class="rating-stars">${createRatingStars(parseFloat(film['Оценка']))}</span>
                        ${parseFloat(film['Оценка']).toFixed(1)}
                    </span>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    container.innerHTML = filmsHTML;
}

/**
 * Создание топов жанров
 */
function createTopGenres() {
    const container = document.getElementById('top-genres');
    if (!container) return;
    
    const topGenres = getTopGenres();
    
    if (!topGenres.length) {
        container.innerHTML = `<p class="no-data">${CONFIG.messages.noTopData}</p>`;
        return;
    }
    
    const genresHTML = topGenres.map(({genre, count}, index) => `
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
    
    container.innerHTML = genresHTML;
}

/**
 * Создание топов режиссеров
 */
function createTopDirectors() {
    const container = document.getElementById('top-directors');
    if (!container) return;
    
    const topDirectors = getTopDirectors();
    
    if (!topDirectors.length) {
        container.innerHTML = `<p class="no-data">${CONFIG.messages.noTopData}</p>`;
        return;
    }
    
    const directorsHTML = topDirectors.map(({director, count}, index) => `
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
    
    container.innerHTML = directorsHTML;
}

/**
 * Вспомогательная функция для склонения слов
 */
function getRussianWordForm(number, one, two, five) {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) {
        return five;
    }
    n %= 10;
    if (n === 1) {
        return one;
    }
    if (n >= 2 && n <= 4) {
        return two;
    }
    return five;
}

/**
 * Вспомогательная функция для капитализации первой буквы
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Получить топ фильмов
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
 * Получить топ жанров
 */
function getTopGenres() {
    const genreCount = {};
    
    STATE.films.forEach(film => {
        const genre = film['Жанр'];
        if (genre) {
            // Разделяем жанры по запятой и обрабатываем каждый
            const genres = genre.split(',').map(g => g.trim().toLowerCase()).filter(g => g);
            
            genres.forEach(normalizedGenre => {
                if (normalizedGenre) {
                    genreCount[normalizedGenre] = (genreCount[normalizedGenre] || 0) + 1;
                }
            });
        }
    });
    
    return Object.entries(genreCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, CONFIG.defaults.topLimit)
        .map(([genre, count]) => ({ genre, count }));
}

/**
 * Получить топ режиссеров
 */
function getTopDirectors() {
    const directorCount = {};
    
    STATE.films.forEach(film => {
        const director = film['Режиссер'];
        if (director) {
            const normalizedDirector = director.trim().toLowerCase();
            if (normalizedDirector) {
                directorCount[normalizedDirector] = (directorCount[normalizedDirector] || 0) + 1;
            }
        }
    });
    
    return Object.entries(directorCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, CONFIG.defaults.topLimit)
        .map(([director, count]) => ({ director, count }));
}

/**
 * Рендеринг топов из кэша
 */
function renderTopsFromCache() {
    if (!STATE.cache.tops) return;
    
    // Рендерим лучшие фильмы
    if (DOM.topBestFilms && STATE.cache.tops.best) {
        const bestFilmsHTML = STATE.cache.tops.best.map((film, index) => {
            const posterUrl = film['Постер URL'] || CONFIG.defaults.poster;
            return `
            <div class="top-item">
                <div class="top-rank">${index + 1}</div>
                <div class="top-poster">
                    <img src="${posterUrl}" 
                         alt="${film['Фильм']}" 
                         loading="lazy"
                         onerror="this.src='${CONFIG.defaults.poster}'">
                </div>
                <div class="top-info">
                    <div class="top-film-title">${film['Фильм']} (${film['Год']})</div>
                    <div class="top-film-meta">
                        <span class="top-director">${film['Режиссер'] || 'Неизвестен'}</span>
                        <span class="top-rating">
                            <span class="rating-stars">${createRatingStars(parseFloat(film['Оценка']))}</span>
                            ${parseFloat(film['Оценка']).toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        DOM.topBestFilms.innerHTML = bestFilmsHTML;
    }
    
    // Рендерим худшие фильмы
    if (DOM.topWorstFilms && STATE.cache.tops.worst) {
        const worstFilmsHTML = STATE.cache.tops.worst.map((film, index) => {
            const posterUrl = film['Постер URL'] || CONFIG.defaults.poster;
            return `
            <div class="top-item">
                <div class="top-rank">${index + 1}</div>
                <div class="top-poster">
                    <img src="${posterUrl}" 
                         alt="${film['Фильм']}" 
                         loading="lazy"
                         onerror="this.src='${CONFIG.defaults.poster}'">
                </div>
                <div class="top-info">
                    <div class="top-film-title">${film['Фильм']} (${film['Год']})</div>
                    <div class="top-film-meta">
                        <span class="top-director">${film['Режиссер'] || 'Неизвестен'}</span>
                        <span class="top-rating">
                            <span class="rating-stars">${createRatingStars(parseFloat(film['Оценка']))}</span>
                            ${parseFloat(film['Оценка']).toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        DOM.topWorstFilms.innerHTML = worstFilmsHTML;
    }
    
    // Рендерим жанры
    if (DOM.topGenres && STATE.cache.tops.genres) {
        const genresHTML = STATE.cache.tops.genres.map(({genre, count}, index) => `
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
        DOM.topGenres.innerHTML = genresHTML;
    }
    
    // Рендерим режиссеров
    if (DOM.topDirectors && STATE.cache.tops.directors) {
        const directorsHTML = STATE.cache.tops.directors.map(({director, count}, index) => `
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
        DOM.topDirectors.innerHTML = directorsHTML;
    }
}

/**
 * Mock данные для фильмов (fallback)
 */
function loadMockFilmsData() {
    const mockFilms = [
        {
            "Фильм": "Начало",
            "Режиссер": "Кристофер Нолан",
            "Жанр": "Фантастика, Триллер",
            "Страна": "США, Великобритания",
            "Год": "2010",
            "Оценка": "8.7",
            "Номер обсуждения": "1",
            "Дата": "01.01.2023",
            "Постер URL": "assets/images/default-poster.jpg",
            "Описание": "Проникая в сны других людей, Дом Кобб должен выполнить задание, которое станет возможностью искупить его прошлые прегрешения.",
            "Участников": "7"
        },
        {
            "Фильм": "Паразиты",
            "Режиссер": "Пон Джун Хо",
            "Жанр": "Драма, Комедия",
            "Страна": "Южная Корея",
            "Год": "2019",
            "Оценка": "8.6",
            "Номер обсуждения": "2",
            "Дата": "08.01.2023",
            "Постер URL": "assets/images/default-poster.jpg",
            "Описание": "Бедная корейская семья внедряется в жизнь богатого дома, что приводит к неожиданным последствиям.",
            "Участников": "6"
        },
        {
            "Фильм": "Криминальное чтиво",
            "Режиссер": "Квентин Тарантино",
            "Жанр": "Криминал, Драма",
            "Страна": "США",
            "Год": "1994",
            "Оценка": "8.9",
            "Номер обсуждения": "3",
            "Дата": "15.01.2023",
            "Постер URL": "assets/images/default-poster.jpg",
            "Описание": "Несколько взаимосвязанных историй из жизни бандитов и мелких преступников.",
            "Участников": "8"
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
 * Mock данные для работ (fallback)
 */
function loadMockWorksData() {
    const mockWorks = [
        {
            "Название": "Экспериментальное видео 'Рассвет'",
            "Год": "2023",
            "Тип": "Короткометражный фильм",
            "Ссылка на видео": "#",
            "URL постера": "assets/images/default-poster.jpg",
            "Описание": "Пример творческой работы участников киноклуба"
        },
        {
            "Название": "Документальный этюд",
            "Гой": "2023",
            "Тип": "Документальный фильм",
            "Ссылка на видео": "#",
            "URL постера": "assets/images/default-poster.jpg",
            "Описание": "Исследование городской среды через призму кинокамеры"
        }
    ];
    
    STATE.works = mockWorks;
    renderWorks(mockWorks);
    
    showMockDataWarning('работ');
}

/**
 * Показать предупреждение о mock данных
 */
function showMockDataWarning(dataType) {
    // Убираем предыдущие предупреждения
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
    
    // Автоматическое скрытие через 10 секунд
    setTimeout(() => {
        if (warning.parentNode) {
            warning.style.opacity = '0';
            setTimeout(() => warning.remove(), 500);
        }
    }, 10000);
}

// Загрузка кэша из localStorage при загрузке страницы
window.addEventListener('load', () => {
    try {
        const cache = localStorage.getItem('cinemaClubCache');
        const lastUpdated = localStorage.getItem('cinemaClubLastUpdated');
        
        if (cache && lastUpdated) {
            STATE.cache = JSON.parse(cache);
            STATE.lastUpdated = parseInt(lastUpdated);
            
            if (isCacheValid() && STATE.cache.tops) {
                renderTopsFromCache();
            }
        }
    } catch (e) {
        console.error('Ошибка загрузки кэша:', e);
    }
});

// Инициализация карты
function initYandexMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    
    // Проверяем, загружены ли Яндекс Карты
    if (typeof ymaps === 'undefined') {
        showMapFallback();
        return;
    }

    try {
        ymaps.ready(function() {
            try {
                const map = new ymaps.Map('map', {
                    center: [44.601145, 33.520966],
                    zoom: 16,
                    controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
                });

                const placemark = new ymaps.Placemark([44.601145, 33.520966], {
                    hintContent: 'Кофейня "Том Сойер"',
                    balloonContent: `
                        <strong>Кофейня "Том Сойер"</strong><br>
                        ул. Шмидта, 12, Севастополь<br>
                        <em>Место встреч киноклуба</em>
                    `
                }, {
                    iconLayout: 'default#image',
                    iconImageHref: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiM2YTExY2IiIGZpbGwtb3BhY2l0eT0iMC44IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIyMCIgeT0iMjUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSJib2xkIj7QmtC+PC90ZXh0Pgo8L3N2Zz4=',
                    iconImageSize: [40, 40],
                    iconImageOffset: [-20, -40]
                });

                map.geoObjects.add(placemark);
                
                // Убираем fallback если карта успешно загрузилась
                const fallback = mapContainer.querySelector('.map-fallback');
                if (fallback) {
                    fallback.style.display = 'none';
                }
                
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

// Показать fallback для карты
function showMapFallback() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    
    let fallback = mapContainer.querySelector('.map-fallback');
    
    if (!fallback) {
        fallback = document.createElement('div');
        fallback.className = 'map-fallback';
        fallback.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
        `;
        
        fallback.innerHTML = `
            <div>
                <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
                <h3 style="margin-bottom: 1rem; color: #6a11cb;">Карта временно недоступна</h3>
                <p style="margin-bottom: 0.5rem;"><strong>Адрес:</strong> ул. Шмидта, 12, Севастополь</p>
                <p style="margin-bottom: 1rem;"><strong>Место:</strong> Кофейня "Том Сойер"</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">Мы встречаемся здесь каждую неделю!</p>
            </div>
        `;
        
        mapContainer.appendChild(fallback);
    } else {
        fallback.style.display = 'flex';
    }
}

// Загрузка Яндекс Карт
function loadYandexMaps() {
    // Проверяем, не загружены ли карты уже
    if (typeof ymaps !== 'undefined') {
        initYandexMap();
        return;
    }
    
    // Создаем script для загрузки API Яндекс Карт
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=ваш_api_ключ&lang=ru_RU';
    script.async = true;
    
    script.onload = function() {
        if (typeof ymaps !== 'undefined') {
            initYandexMap();
        } else {
            showMapFallback();
        }
    };
    
    script.onerror = function() {
        console.error('Не удалось загрузить Яндекс Карты');
        showMapFallback();
    };
    
    document.head.appendChild(script);
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    // Загружаем Яндекс Карты после инициализации приложения
    setTimeout(loadYandexMaps, 1000);
});

// Добавляем стили для предупреждения о mock данных
const style = document.createElement('style');
style.textContent = `
    .mock-warning {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #ff9800, #f44336);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        max-width: 90%;
        animation: slideDown 0.3s ease;
    }
    
    .mock-warning p {
        margin: 0 0 1rem 0;
        font-weight: 500;
    }
    
    .network-status {
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: bold;
        z-index: 2000;
        animation: slideIn 0.3s ease;
    }
    
    .network-status.online {
        background: #4CAF50;
        color: white;
    }
    
    .network-status.offline {
        background: #f44336;
        color: white;
    }
    
    .offline-message {
        background: #f44336;
        color: white;
        padding: 1rem;
        text-align: center;
        position: sticky;
        top: 0;
        z-index: 1000;
    }
    
    .retry-button {
        background: white;
        color: #f44336;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        margin-left: 1rem;
        cursor: pointer;
        font-weight: bold;
    }
    
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.02); }
        100% { opacity: 1; transform: scale(1); }
    }
    
    .no-data {
        text-align: center;
        color: var(--gray);
        padding: 2rem;
        font-style: italic;
    }
    
    .error-message {
        text-align: center;
        color: var(--accent);
        padding: 2rem;
    }
    
    .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        color: var(--gray);
    }
    
    @media (max-width: 768px) {
        .mock-warning {
            top: 10px;
            padding: 0.8rem 1rem;
            font-size: 0.9rem;
        }
        
        .offline-message {
            flex-direction: column;
            gap: 0.5rem;
            padding: 0.5rem;
        }
    }
`;
document.head.appendChild(style);