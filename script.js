/**
 * Кино-клуб "Одиссея" - скрипт для веб-приложения
 * Основные функции: загрузка данных, рендеринг, управление UI
 */

// Конфигурация приложения
const CONFIG = {
    // Настройки Google Sheets
    sheets: {
        films: {
            id: '1a6EWO5ECaI1OveO4Gy7y9zH5LjFtlm8Alg9iSRP2heE',
            name: 'Films',
            fields: {
                title: 'Фильм',
                director: 'Режиссер',
                genre: 'Жанр',
                country: 'Страна',
                year: 'Год',
                rating: 'Оценка',
                discussion: 'Номер обсуждения',
                date: 'Дата',
                poster: 'Постер URL',
                description: 'Описание',
                participants: 'Участников'
            }
        },
        works: {
            id: '1KYU9mYAS5Wv6a9z-RImNxyP0n0Tpgf7BDRl2sNeSXmM',
            name: 'Video',
            fields: {
                title: 'Название',
                year: 'Год',
                type: 'Тип',
                videoLink: 'Ссылка на видео',
                poster: 'URL постера',
                description: 'Описание'
            }
        }
    },

    // Настройки по умолчанию
    defaults: {
        poster: 'images/default-poster.jpg',
        ratingPrecision: 1,
        maxRating: 10,
        maxTopItems: 10,
        cacheTTL: 3600000, // 1 час в миллисекундах
        filmsPerPage: 20
    },

    // Селекторы DOM
    selectors: {
        filmsContainer: '#films-container',
        worksContainer: '#works-container',
        topFilmsList: '#top-films-list',
        topDirectorsList: '#top-directors-list',
        topGenresList: '#top-genres-list',
        loadMoreBtn: '#load-more-films',
        scrollToTopBtn: '#scroll-to-top'
    },

    // Сообщения
    messages: {
        loading: 'Загрузка данных... или включи VPN',
        noData: 'Нет данных для отображения',
        noFilms: 'Нет данных о фильмах',
        noWorks: 'Нет данных о работах',
        connectionError: 'Ошибка подключения к интернету',
        serverError: 'Ошибка сервера',
        genericError: 'Произошла ошибка',
        retry: 'Попробовать снова',
        offline: 'Вы сейчас офлайн. Показаны кэшированные данные.',
        loadMore: 'Показать еще',
        allFilmsLoaded: 'Все фильмы загружены'
    },

    // API
    api: {
        baseUrl: 'https://opensheet.elk.sh',
        timeout: 10000
    }
};

// Состояние приложения
const STATE = {
    films: [],
    sortedFilms: [], // Отсортированная копия фильмов
    works: [],
    topFilms: [],
    topDirectors: [],
    topGenres: [],
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
        topLists: null
    }
};

// DOM элементы
const DOM = {
    filmsContainer: null,
    worksContainer: null,
    topFilmsList: null,
    topDirectorsList: null,
    topGenresList: null,
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
    DOM.topFilmsList = document.querySelector(CONFIG.selectors.topFilmsList);
    DOM.topDirectorsList = document.querySelector(CONFIG.selectors.topDirectorsList);
    DOM.topGenresList = document.querySelector(CONFIG.selectors.topGenresList);
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
        if (STATE.cache.films && isCacheValid()) {
            loadFromCache();
            return;
        }

        showLoading(DOM.filmsContainer);
        showLoading(DOM.worksContainer);
        showLoading(DOM.topFilmsList.parentElement);

        await Promise.all([
            loadFilmsData(),
            loadWorksData()
        ]);

        updateTopLists(STATE.films);
        saveToCache();
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError(DOM.filmsContainer, error);
    }
}

/**
 * Загрузка данных из кэша
 */
function loadFromCache() {
    STATE.films = STATE.cache.films;
    STATE.works = STATE.cache.works;
    STATE.topFilms = STATE.cache.topLists?.topFilms || [];
    STATE.topDirectors = STATE.cache.topLists?.topDirectors || [];
    STATE.topGenres = STATE.cache.topLists?.topGenres || [];
    
    sortFilmsByDate();
    resetPagination();
    renderAllData();
}

/**
 * Сортировка фильмов по дате (новые сверху)
 */
function sortFilmsByDate() {
    const fields = CONFIG.sheets.films.fields;
    STATE.sortedFilms = [...STATE.films].sort((a, b) => {
        const dateA = parseDate(a[fields.date]);
        const dateB = parseDate(b[fields.date]);
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
        topLists: {
            topFilms: STATE.topFilms,
            topDirectors: STATE.topDirectors,
            topGenres: STATE.topGenres
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
        const data = await fetchData(CONFIG.sheets.films.id, CONFIG.sheets.films.name);
        STATE.films = data;
        sortFilmsByDate();
        resetPagination();
        renderFilms();
    } catch (error) {
        tryLoadFromLocalStorage();
        throw error;
    }
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
                STATE.films = STATE.cache.films;
                sortFilmsByDate();
                resetPagination();
                renderFilms();
            }
        }
    } catch (e) {
        console.error('Ошибка загрузки из кэша:', e);
    }
}

/**
 * Загрузка данных о работах
 */
async function loadWorksData() {
    try {
        const data = await fetchData(CONFIG.sheets.works.id, CONFIG.sheets.works.name);
        STATE.works = data;
        renderWorks(data);
    } catch (error) {
        showError(DOM.worksContainer, error, loadWorksData);
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

    const fields = CONFIG.sheets.films.fields;
    const filmsHTML = paginatedFilms.map(film => createFilmCard(film, fields)).join('');

    if (STATE.pagination.currentPage === 1) {
        DOM.filmsContainer.innerHTML = filmsHTML;
    } else {
        const newFilmsStart = CONFIG.defaults.filmsPerPage * (STATE.pagination.currentPage - 1);
        const newFilms = STATE.sortedFilms.slice(newFilmsStart, filmsToShow);
        addFilmsWithAnimation(newFilms, fields);
    }
}

/**
 * Создает HTML для карточки фильма
 */
function createFilmCard(film, fields) {
    const rating = parseFloat(film[fields.rating]) || 0;
    const formattedRating = rating.toFixed(CONFIG.defaults.ratingPrecision);
    
    const director = film[fields.director] || 'Неизвестен';
    const genre = film[fields.genre] || 'Не указан';
    const country = film[fields.country] || 'Не указана';
    const participants = film[fields.participants] || 'Не указано';

    return `
    <article class="film-card" role="article" aria-labelledby="film-${film[fields.discussion]}-title">
        <div class="film-card-image">
            <img src="${film[fields.poster] || CONFIG.defaults.poster}"
                 alt="Постер: ${film[fields.title]} (${film[fields.year]})"
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
                <span class="discussion-number">Обсуждение #${film[fields.discussion] || 'N/A'}</span>
                <span class="discussion-date">${formatDate(film[fields.date])}</span>
            </div>
            <h3 id="film-${film[fields.discussion]}-title">${film[fields.title]} (${film[fields.year]})</h3>
            <p class="film-meta"><span class="meta-label">Режиссер:</span> ${director}</p>
            <p class="film-meta"><span class="meta-label">Жанр:</span> ${genre}</p>
            <p class="film-meta"><span class="meta-label">Страна:</span> ${country}</p>
            <p class="film-meta"><span class="meta-label">Участников:</span> ${participants}</p>
            ${film[fields.description] ? `<p class="film-description">${film[fields.description]}</p>` : ''}
        </div>
    </article>
    `;
}

/**
 * Добавляет новые фильмы с анимацией
 */
function addFilmsWithAnimation(newFilms, fields) {
    newFilms.forEach((film, index) => {
        const filmHTML = createFilmCard(film, fields);
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

    const fields = CONFIG.sheets.works.fields;

    DOM.worksContainer.innerHTML = works.map(work => `
        <article class="film-poster" role="article" aria-labelledby="work-${work[fields.title]}-title">
            <a href="${work[fields.videoLink]}"
               target="_blank"
               rel="noopener noreferrer"
               class="video-link"
               aria-label="${work[fields.type] || 'Работа'}: ${work[fields.title]} (${work[fields.year]})">
                <img src="${work[fields.poster] || CONFIG.defaults.poster}"
                     alt="${work[fields.title]} (${work[fields.year]})"
                     class="poster-image"
                     loading="lazy"
                     onerror="this.src='${CONFIG.defaults.poster}'">
                <div class="play-overlay">
                    <div class="play-button" aria-hidden="true">▶</div>
                    <p class="watch-text">Смотреть ${work[fields.type] || 'работу'}</p>
                </div>
            </a>
            <div class="work-info">
                <h3 id="work-${work[fields.title]}-title">${work[fields.title]} (${work[fields.year]})</h3>
                ${work[fields.description] ? `<p class="work-description">${work[fields.description]}</p>` : ''}
            </div>
        </article>
    `).join('');
}

/**
 * Обновление всех топ-списков
 */
function updateTopLists(films) {
    if (!films || !films.length) return;
    
    updateTopFilms(films);
    updateTopDirectors(films);
    updateTopGenres(films);
    
    renderTopLists();
}

/**
 * Рендеринг всех данных
 */
function renderAllData() {
    renderFilms();
    renderWorks(STATE.works);
    renderTopLists();
}

/**
 * Рендеринг всех топ-списков
 */
function renderTopLists() {
    renderTopList(STATE.topFilms, DOM.topFilmsList, true);
    renderTopList(STATE.topDirectors, DOM.topDirectorsList, false);
    renderTopList(STATE.topGenres, DOM.topGenresList, false);
}

/**
 * Обновление топ фильмов
 */
function updateTopFilms(films) {
    if (!films || !films.length) return;
    const fields = CONFIG.sheets.films.fields;
    
    const sortedFilms = [...films]
        .filter(film => film[fields.rating])
        .sort((a, b) => {
            const ratingA = parseFloat(a[fields.rating]) || 0;
            const ratingB = parseFloat(b[fields.rating]) || 0;
            return ratingB - ratingA;
        })
        .slice(0, CONFIG.defaults.maxTopItems);

    STATE.topFilms = sortedFilms.map(film => ({
        title: `${film[fields.title]} (${film[fields.year]})`,
        rating: parseFloat(film[fields.rating]).toFixed(CONFIG.defaults.ratingPrecision),
        director: film[fields.director],
        genre: film[fields.genre]
    }));
}

/**
 * Обновление топ режиссеров
 */
function updateTopDirectors(films) {
    if (!films || !films.length) return;
    const fields = CONFIG.sheets.films.fields;
    
    const directorsMap = films.reduce((acc, film) => {
        const director = film[fields.director] || 'Неизвестен';
        acc[director] = (acc[director] || 0) + 1;
        return acc;
    }, {});
    
    STATE.topDirectors = Object.entries(directorsMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, CONFIG.defaults.maxTopItems);
}

/**
 * Обновление топ жанров
 */
function updateTopGenres(films) {
    if (!films || !films.length) return;
    const fields = CONFIG.sheets.films.fields;
    
    const genresMap = films.reduce((acc, film) => {
        const genres = (film[fields.genre] || 'Не указан').split(',').map(g => g.trim());
        genres.forEach(genre => {
            acc[genre] = (acc[genre] || 0) + 1;
        });
        return acc;
    }, {});
    
    STATE.topGenres = Object.entries(genresMap)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, CONFIG.defaults.maxTopItems);
}

/**
 * Загрузка данных с Google Sheets
 */
async function fetchData(sheetId, sheetName) {
    if (!STATE.isOnline) {
        throw new Error(CONFIG.messages.connectionError);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.api.timeout);

    try {
        const response = await fetch(`${CONFIG.api.baseUrl}/${sheetId}/${sheetName}`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`${CONFIG.messages.serverError}: ${response.status}`);
        }

        const data = await response.json();
        return data?.length ? data : Promise.reject(new Error(CONFIG.messages.noData));
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Показать состояние загрузки
 */
function showLoading(container) {
    if (!container) return;

    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
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
 * Рендеринг топ-списка
 */
function renderTopList(items, container, showRating = false) {
    if (!container) return;

    if (!items?.length) {
        container.innerHTML = `<li class="no-items">${CONFIG.messages.noData}</li>`;
        return;
    }

    container.innerHTML = items.map((item, index) => {
        const ratingDisplay = showRating ? `
            <span class="item-rating">
                ${createRatingStars(item.rating)}
                <span class="rating-value">${item.rating}</span>
            </span>
        ` : `<span class="item-count">${item.count}</span>`;

        return `
            <li class="top-item">
                <span class="item-rank">${index + 1}.</span>
                <span class="item-title">${item.title || item.name || item.genre}</span>
                ${ratingDisplay}
            </li>
        `;
    }).join('');
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

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', initApp);

// Загрузка кэша из localStorage при загрузке страницы
window.addEventListener('load', () => {
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
        console.error('Ошибка загрузки кэша:', e);
    }
});

// Инициализация карты
if (typeof ymaps !== 'undefined') {
    initYandexMap();
} else {
    // Динамическая загрузка API Яндекс.Карт
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=ваш_api_ключ&lang=ru_RU';
    script.onload = initYandexMap;
    document.head.appendChild(script);
}

function initYandexMap() {
    ymaps.ready(function() {
        const map = new ymaps.Map('map', {
            center: [44.601145, 33.520966], // Координаты кофейни
            zoom: 16,
            controls: ['zoomControl']
        });

        // Добавляем метку
        const placemark = new ymaps.Placemark([44.601145, 33.520966], {
            hintContent: 'Кофейня "Том Сойер"',
            balloonContent: 'ул. Шмидта, 12<br>Место встреч киноклуба'
        }, {
            iconLayout: 'default#image',
            iconImageHref: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
            iconImageSize: [40, 40],
            iconImageOffset: [-20, -40]
        });

        map.geoObjects.add(placemark);
    });
}