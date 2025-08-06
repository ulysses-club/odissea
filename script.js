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
                title: 'Название',
                year: 'Год',
                director: 'Режиссер',
                genre: 'Жанр',
                discussion: 'Номер обсуждения',
                date: 'Дата',
                rating: 'Рейтинг',
                poster: 'Постер URL'
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
        maxTopItems: 10
    },

    // Селекторы DOM
    selectors: {
        filmsContainer: '#films-container',
        worksContainer: '#works-container',
        topFilmsList: '#top-films-list',
        topDirectorsList: '#top-directors-list',
        topGenresList: '#top-genres-list',
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
    works: [],
    topFilms: [],
    topDirectors: [],
    topGenres: [],
    isOnline: navigator.onLine,
    menuOpen: false
};

// DOM элементы
const DOM = {
    filmsContainer: null,
    worksContainer: null,
    topFilmsList: null,
    topDirectorsList: null,
    topGenresList: null,
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
}

/**
 * Инициализация обработчиков событий
 */
function initEventListeners() {

    // События онлайн/офлайн
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
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
        <p>Вы сейчас офлайн. Некоторые функции могут быть недоступны.</p>
        <button onclick="window.location.reload()">Обновить</button>
    `;
    document.body.prepend(offlineMessage);
}

/**
 * Загрузка начальных данных
 */
async function loadInitialData() {
    try {
        await Promise.all([
            loadFilmsData(),
            loadWorksData(),
            loadTopLists()
        ]);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError(DOM.filmsContainer, error);
    }
}

/**
 * Загрузка данных о фильмах
 */
async function loadFilmsData() {
    try {
        showLoading(DOM.filmsContainer);
        const data = await fetchData(CONFIG.sheets.films.id, CONFIG.sheets.films.name);
        STATE.films = data;
        renderFilms(data);
        updateTopFilms(data);
    } catch (error) {
        showError(DOM.filmsContainer, error, loadFilmsData);
    }
}

/**
 * Загрузка данных о работах
 */
async function loadWorksData() {
    try {
        showLoading(DOM.worksContainer);
        const data = await fetchData(CONFIG.sheets.works.id, CONFIG.sheets.works.name);
        STATE.works = data;
        renderWorks(data);
    } catch (error) {
        showError(DOM.worksContainer, error, loadWorksData);
    }
}

/**
 * Загрузка топ-списков
 */
async function loadTopLists() {
    try {
        if (!STATE.films || !STATE.films.length) {
            await loadFilmsData();
        }

        updateTopFilms(STATE.films);
        updateTopDirectors(STATE.films);
        updateTopGenres(STATE.films);
    } catch (error) {
        console.error('Ошибка загрузки топ-списков:', error);
        showError(DOM.topFilmsList, error);
    }
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
    const sortedGenres = Object.entries(genresMap)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, CONFIG.defaults.maxTopItems);

    STATE.topGenres = sortedGenres;
    renderTopList(sortedGenres, DOM.topGenresList, false);
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
    const sortedDirectors = Object.entries(directorsMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, CONFIG.defaults.maxTopItems);

    STATE.topDirectors = sortedDirectors;
    renderTopList(sortedDirectors, DOM.topDirectorsList, false);
}

/**
 * Обновление топ фильмов
 */
function updateTopFilms(films) {
    if (!films || !films.length) return;
    const fields = CONFIG.sheets.films.fields;
    const sortedFilms = [...films]
        .filter(film => film[fields.rating])
        .sort((a, b) => parseFloat(b[fields.rating]) - parseFloat(a[fields.rating]))
        .slice(0, CONFIG.defaults.maxTopItems);

    const formattedFilms = sortedFilms.map(film => ({
        title: film[fields.title],
        rating: parseFloat(film[fields.rating]).toFixed(CONFIG.defaults.ratingPrecision)
    }));

    STATE.topFilms = formattedFilms;
    renderTopList(formattedFilms, DOM.topFilmsList, true);
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
            <p>${CONFIG.messages.genericError}</p>
            <p>${errorMessage}</p>
            ${retryFunction ? `
                <button class="retry-button" aria-label="${CONFIG.messages.retry}">
                    ${CONFIG.messages.retry}
                </button>
            ` : ''}
        </div>
    `;
    container.classList.remove('loading-state');

    if (retryFunction) {
        container.querySelector('.retry-button')?.addEventListener('click', retryFunction);
    }
}

/**
 * Рендеринг списка фильмов
 */
function renderFilms(films) {
    if (!DOM.filmsContainer) return;

    if (!films?.length) {
        DOM.filmsContainer.innerHTML = `<p class="no-data">${CONFIG.messages.noFilms}</p>`;
        return;
    }

    const fields = CONFIG.sheets.films.fields;
    const sortedFilms = [...films].sort((a, b) => {
        const dateA = new Date(a[fields.date] || 0);
        const dateB = new Date(b[fields.date] || 0);
        return dateB - dateA;
    });

    DOM.filmsContainer.innerHTML = sortedFilms.map(film => {
        const rating = parseFloat(film[fields.rating]) || 0;
        const formattedRating = rating.toFixed(CONFIG.defaults.ratingPrecision);

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
                <p class="film-director">Режиссер: ${film[fields.director] || 'неизвестен'}</p>
                <p class="film-genre">Жанр: ${film[fields.genre] || 'не указан'}</p>
                ${film['Комментарий'] ? `<p class="film-comment">${film['Комментарий']}</p>` : ''}
            </div>
        </article>
        `;
    }).join('');
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
 * Форматирование даты в строгом формате дд.мм.гггг
 * с защитой от перестановки дня и месяца
 */
function formatDate(dateString) {
    if (!dateString) return 'дата не указана';

    try {
        // Парсим дату с учетом возможного разного формата
        let date;

        // Если дата в формате "гггг-мм-дд" (ISO)
        if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
            const [year, month, day] = dateString.split('-');
            date = new Date(year, month - 1, day);
        }
        // Если дата в формате "дд.мм.гггг"
        else if (/^\d{2}\.\d{2}\.\d{4}/.test(dateString)) {
            const [day, month, year] = dateString.split('.');
            date = new Date(year, month - 1, day);
        }
        // Если дата в другом формате (пробуем стандартный парсинг)
        else {
            date = new Date(dateString);
        }

        // Проверяем валидность даты
        if (isNaN(date.getTime())) {
            return dateString; // возвращаем как есть, если не распарсилось
        }

        // Форматируем в дд.мм.гггг
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}.${month}.${year}`;

    } catch (e) {
        console.error('Ошибка форматирования даты:', e);
        return dateString;
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', initApp);

// Экспорт в глобальную область видимости для отладки
window.App = {
    config: CONFIG,
    state: STATE,
    dom: DOM,
    reloadFilms: loadFilmsData,
    reloadWorks: loadWorksData
};
