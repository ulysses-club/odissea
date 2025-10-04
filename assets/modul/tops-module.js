/**
 * Модуль для управления секцией "Наши топы"
 */
class TopsModule {
    /**
     * Конструктор класса TopsModule
     * Инициализирует конфигурацию, состояние и запускает модуль топ-списков
     */
    constructor() {
        this.config = {
            dataSources: {
                films: '../data/films.json',
                works: '../data/works.json'
            },
            selectors: {
                topsControls: '.tops-controls',
                topBestFilms: '#top-best-films',
                topWorstFilms: '#top-worst-films',
                topGenres: '#top-genres',
                topDirectors: '#top-directors',
                toggleButtons: '.toggle-tops-btn'
            },
            defaults: {
                topLimit: 10,
                compactTopLimit: 3
            },
            messages: {
                noTopData: 'Недостаточно данных для формирования топа',
                loading: 'Загрузка данных...',
                error: 'Ошибка загрузки данных'
            }
        };

        this.state = {
            limit: 3,
            expanded: false,
            films: [],
            data: {
                bestFilms: [],
                worstFilms: [],
                genres: [],
                directors: []
            }
        };

        this.init();
    }

    /**
     * Инициализация модуля
     * Кэширует DOM элементы, инициализирует обработчики событий, загружает и анализирует данные
     */
    async init() {
        this.cacheDOM();
        this.initEventListeners();
        await this.loadData();
        this.analyzeData();
        this.renderTops();
    }

    /**
     * Кэширование DOM элементов
     * Находит и сохраняет ссылки на DOM элементы по селекторам из конфигурации
     */
    cacheDOM() {
        this.elements = {};
        Object.keys(this.config.selectors).forEach(key => {
            this.elements[key] = document.querySelector(this.config.selectors[key]);
        });
    }

    /**
     * Инициализация обработчиков событий
     * Назначает обработчики для элементов управления топ-списками
     */
    initEventListeners() {
        if (this.elements.topsControls) {
            this.elements.topsControls.addEventListener('click', (e) => {
                const button = e.target.closest('.toggle-tops-btn');
                if (button) {
                    this.handleToggleClick(button);
                }
            });
        }
    }

    /**
     * Загрузка данных из JSON
     * Загружает данные о фильмах из JSON файла с обработкой ошибок
     */
    async loadData() {
        try {
            this.showLoadingState();

            const response = await fetch(this.config.dataSources.films);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.state.films = Array.isArray(data) ? data : [];

        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showErrorState();
            this.state.films = [];
        }
    }

    /**
     * Показать состояние загрузки
     * Отображает индикаторы загрузки во всех контейнерах топ-списков
     */
    showLoadingState() {
        const containers = [
            this.elements.topBestFilms,
            this.elements.topWorstFilms,
            this.elements.topGenres,
            this.elements.topDirectors
        ];

        containers.forEach(container => {
            if (container) {
                container.innerHTML = `
                    <div class="loading-message">
                        <div class="spinner" aria-hidden="true"></div>
                        ${this.config.messages.loading}
                    </div>
                `;
            }
        });
    }

    /**
     * Показать состояние ошибки
     * Отображает сообщения об ошибке во всех контейнерах топ-списков
     */
    showErrorState() {
        const containers = [
            this.elements.topBestFilms,
            this.elements.topWorstFilms,
            this.elements.topGenres,
            this.elements.topDirectors
        ];

        containers.forEach(container => {
            if (container) {
                container.innerHTML = `<p class="no-data">${this.config.messages.error}</p>`;
            }
        });
    }

    /**
     * Обработка клика по кнопке переключения
     * Обрабатывает клики по кнопкам переключения лимита отображения
     * 
     * @param {HTMLElement} button - Нажатая кнопка переключения
     */
    handleToggleClick(button) {
        const limit = parseInt(button.dataset.limit);
        this.toggleTopsLimit(limit);
    }

    /**
     * Переключение лимита отображения
     * Изменяет количество отображаемых элементов в топ-списках
     * 
     * @param {number} limit - Новый лимит отображения
     */
    toggleTopsLimit(limit) {
        this.state.limit = limit;
        this.state.expanded = limit === this.config.defaults.topLimit;

        // Обновляем активную кнопку
        document.querySelectorAll('.toggle-tops-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.limit) === limit);
        });

        // Перерисовываем топы
        this.renderTops();
    }

    /**
     * Анализ данных для формирования топов
     * Анализирует загруженные данные и формирует топ-списки
     */
    analyzeData() {
        if (!this.state.films || this.state.films.length === 0) {
            console.warn('Нет данных о фильмах для анализа');
            return;
        }

        this.state.data.bestFilms = this.getTopFilms('best');
        this.state.data.worstFilms = this.getTopFilms('worst');
        this.state.data.genres = this.getTopGenres();
        this.state.data.directors = this.getTopDirectors();
    }

    /**
     * Получение топ-N фильмов по рейтингу
     * Сортирует фильмы по рейтингу и возвращает лучшие или худшие
     * 
     * @param {string} type - Тип топа ('best' для лучших, 'worst' для худших)
     * @returns {Array} - Отсортированный массив фильмов
     */
    getTopFilms(type) {
        const ratedFilms = this.state.films.filter(film => {
            const rating = this.parseRating(film['Оценка']);
            return !isNaN(rating) && rating > 0;
        });

        if (ratedFilms.length === 0) {
            return [];
        }

        return [...ratedFilms].sort((a, b) => {
            const ratingA = this.parseRating(a['Оценка']);
            const ratingB = this.parseRating(b['Оценка']);
            return type === 'best' ? ratingB - ratingA : ratingA - ratingB;
        }).slice(0, this.config.defaults.topLimit);
    }

    /**
     * Получение топ-N жанров
     * Анализирует частоту встречаемости жанров в фильмах
     * 
     * @returns {Array} - Массив объектов с жанрами и их количеством
     */
    getTopGenres() {
        const genreCount = {};

        this.state.films.forEach(film => {
            const genre = film['Жанр'];
            if (genre && typeof genre === 'string') {
                genre.split(',').map(g => g.trim().toLowerCase()).filter(g => g).forEach(normalizedGenre => {
                    genreCount[normalizedGenre] = (genreCount[normalizedGenre] || 0) + 1;
                });
            }
        });

        return Object.entries(genreCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, this.config.defaults.topLimit)
            .map(([genre, count]) => ({ genre, count }));
    }

    /**
     * Получение топ-N режиссеров
     * Анализирует частоту встречаемости режиссеров в фильмах
     * 
     * @returns {Array} - Массив объектов с режиссерами и их количеством
     */
    getTopDirectors() {
        const directorCount = {};

        this.state.films.forEach(film => {
            const director = film['Режиссер'];
            if (director && typeof director === 'string') {
                const normalizedDirector = this.capitalizeFirstLetter(director.trim().toLowerCase());
                if (normalizedDirector) {
                    directorCount[normalizedDirector] = (directorCount[normalizedDirector] || 0) + 1;
                }
            }
        });

        return Object.entries(directorCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, this.config.defaults.topLimit)
            .map(([director, count]) => ({ director, count }));
    }

    /**
     * Рендеринг всех топ-списков
     * Отображает все четыре типа топ-списков с текущим лимитом
     */
    renderTops() {
        this.renderTopFilms('best');
        this.renderTopFilms('worst');
        this.renderTopGenres();
        this.renderTopDirectors();
    }

    /**
     * Рендеринг топ-фильмов
     * Отображает список лучших или худших фильмов
     * 
     * @param {string} type - Тип топа ('best' или 'worst')
     */
    renderTopFilms(type) {
        const container = type === 'best' ? this.elements.topBestFilms : this.elements.topWorstFilms;
        if (!container) return;

        const films = type === 'best' ? this.state.data.bestFilms : this.state.data.worstFilms;

        if (films.length === 0) {
            container.innerHTML = `<p class="no-data">${this.config.messages.noTopData}</p>`;
            return;
        }

        container.innerHTML = films.slice(0, this.state.limit).map((film, index) =>
            this.createFilmTopItem(film, index, type)
        ).join('');
    }

    /**
     * Рендеринг топ-жанров
     * Отображает список самых популярных жанров
     */
    renderTopGenres() {
        if (!this.elements.topGenres) return;
        const genres = this.state.data.genres.slice(0, this.state.limit);

        if (genres.length === 0) {
            this.elements.topGenres.innerHTML = `<p class="no-data">${this.config.messages.noTopData}</p>`;
            return;
        }

        this.elements.topGenres.innerHTML = genres.map((genre, index) =>
            this.createGenreTopItem(genre, index)
        ).join('');
    }

    /**
     * Рендеринг топ-режиссеров
     * Отображает список самых частых режиссеров
     */
    renderTopDirectors() {
        if (!this.elements.topDirectors) return;
        const directors = this.state.data.directors.slice(0, this.state.limit);

        if (directors.length === 0) {
            this.elements.topDirectors.innerHTML = `<p class="no-data">${this.config.messages.noTopData}</p>`;
            return;
        }

        this.elements.topDirectors.innerHTML = directors.map((director, index) =>
            this.createDirectorTopItem(director, index)
        ).join('');
    }

    /**
     * Создание элемента топ-фильма
     * Генерирует HTML для элемента в списке топ-фильмов
     * 
     * @param {Object} film - Объект с данными о фильме
     * @param {number} index - Позиция в рейтинге
     * @param {string} type - Тип топа ('best' или 'worst')
     * @returns {string} - HTML строка элемента
     */
    createFilmTopItem(film, index, type) {
        const posterUrl = film['Постер URL'] || film['Постер'] || '../images/default-poster.jpg';
        const rating = this.parseRating(film['Оценка']);
        const filmName = film['Фильм'] || film['Название'] || 'Неизвестный фильм';
        const filmYear = film['Год'] || '';
        const director = film['Режиссер'] || 'Неизвестен';
        const kinopoiskUrl = this.generateKinopoiskUrl(filmName, filmYear);

        return `
        <div class="top-item ${this.state.limit === 3 ? 'compact' : ''}">
            <div class="top-rank">${index + 1}</div>
            <div class="top-poster">
                <img src="${posterUrl}" 
                     alt="${filmName}" 
                     loading="lazy"
                     onerror="this.src='../images/default-poster.jpg'">
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
                <div class="top-film-title">${this.escapeHtml(filmName)} ${filmYear ? `(${filmYear})` : ''}</div>
                <div class="top-film-meta">
                    <span class="top-director">${this.escapeHtml(director)}</span>
                    <span class="top-rating">
                        <span class="rating-stars">${this.createRatingStars(rating)}</span>
                        ${rating.toFixed(1)}
                    </span>
                </div>
            </div>
        </div>
        `;
    }

    /**
     * Создание элемента топ-жанра
     * Генерирует HTML для элемента в списке топ-жанров
     * 
     * @param {Object} genreItem - Объект с данными о жанре
     * @param {number} index - Позиция в рейтинге
     * @returns {string} - HTML строка элемента
     */
    createGenreTopItem(genreItem, index) {
        return `
        <div class="top-item ${this.state.limit === 3 ? 'compact' : ''}">
            <div class="top-rank">${index + 1}</div>
            <div class="top-info">
                <div class="top-film-title">${this.capitalizeFirstLetter(genreItem.genre)}</div>
                <div class="top-film-meta">
                    <span class="rating-badge">${genreItem.count} ${this.getRussianWordForm(genreItem.count, 'фильм', 'фильма', 'фильмов')}</span>
                </div>
            </div>
        </div>
        `;
    }

    /**
     * Создание элемента топ-режиссера
     * Генерирует HTML для элемента в списке топ-режиссеров
     * 
     * @param {Object} directorItem - Объект с данными о режиссере
     * @param {number} index - Позиция в рейтинге
     * @returns {string} - HTML строка элемента
     */
    createDirectorTopItem(directorItem, index) {
        return `
        <div class="top-item ${this.state.limit === 3 ? 'compact' : ''}">
            <div class="top-rank">${index + 1}</div>
            <div class="top-info">
                <div class="top-film-title">${this.capitalizeFirstLetter(directorItem.director)}</div>
                <div class="top-film-meta">
                    <span class="rating-badge">${directorItem.count} ${this.getRussianWordForm(directorItem.count, 'фильм', 'фильма', 'фильмов')}</span>
                </div>
            </div>
        </div>
        `;
    }

    /**
     * Парсинг рейтинга
     * Преобразует рейтинг из различных форматов в число от 0 до 10
     * 
     * @param {string|number} rating - Рейтинг в строковом или числовом формате
     * @returns {number} - Числовой рейтинг от 0 до 10
     */
    parseRating(rating) {
        if (!rating && rating !== 0) return 0;
        if (typeof rating === 'number') return rating;

        const num = parseFloat(rating.toString().replace(',', '.'));
        return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 10);
    }

    /**
     * Создание звезд рейтинга
     * Генерирует HTML для визуального отображения рейтинга в виде звезд
     * 
     * @param {number} rating - Числовой рейтинг от 0 до 10
     * @returns {string} - HTML строка со звездами рейтинга
     */
    createRatingStars(rating) {
        const num = parseFloat(rating) || 0;
        const clamped = Math.min(Math.max(num, 0), 10);
        const full = Math.floor(clamped);
        const half = clamped % 1 >= 0.5 ? 1 : 0;
        const empty = 10 - full - half;
        return `${'★'.repeat(full)}${half ? '⯨' : ''}${'☆'.repeat(empty)}`;
    }

    /**
     * Капитализация первой буквы
     * Преобразует строку к формату с заглавной первой буквой
     * 
     * @param {string} string - Исходная строка
     * @returns {string} - Строка с заглавной первой буквой
     */
    capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.split(/([\s\-']+)/)
            .map(word => {
                if (/^[\s\-']+$/.test(word)) return word;
                if (word.match(/^(mc|mac|o'|d')[a-z]/i)) {
                    return word.charAt(0).toUpperCase() +
                        word.charAt(1).toUpperCase() +
                        word.slice(2).toLowerCase();
                }
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join('');
    }

    /**
     * Получение правильной формы слова для русского языка
     * Выбирает правильную форму слова в зависимости от числа
     * 
     * @param {number} number - Число для определения формы
     * @param {string} one - Форма для 1
     * @param {string} two - Форма для 2-4
     * @param {string} five - Форма для 5-20
     * @returns {string} - Правильная форма слова
     */
    getRussianWordForm(number, one, two, five) {
        const n = Math.abs(number) % 100;
        if (n >= 5 && n <= 20) return five;
        switch (n % 10) {
            case 1: return one;
            case 2: case 3: case 4: return two;
            default: return five;
        }
    }

    /**
     * Генерация URL для КиноПоиска
     * Создает ссылку для поиска информации о фильме на КиноПоиске
     * 
     * @param {string} filmName - Название фильма
     * @param {string} filmYear - Год выпуска фильма
     * @returns {string|null} - URL для поиска на КиноПоиске или null при ошибке
     */
    generateKinopoiskUrl(filmName, filmYear) {
        if (!filmName) return null;
        const cleanName = filmName
            .replace(/[^\w\sа-яА-ЯёЁ]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const searchQuery = filmYear ? `${cleanName} ${filmYear}` : cleanName;
        const encodedQuery = encodeURIComponent(searchQuery);
        return `https://www.kinopoisk.ru/index.php?kp_query=${encodedQuery}`;
    }

    /**
     * Экранирование HTML
     * Заменяет специальные символы HTML на их безопасные эквиваленты
     * 
     * @param {string} unsafe - Исходная небезопасная строка
     * @returns {string} - Безопасная экранированная строка
     */
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

/**
 * Функция инициализации модуля топ-списков
 * Создает экземпляр TopsModule при наличии соответствующей секции
 */
function initTopsModule() {
    if (document.querySelector('#top-films')) {
        new TopsModule();
    }
}

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTopsModule);
} else {
    initTopsModule();
}
