/**
 * Модуль для управления секцией "Наши топы"
 */
class TopsModule {
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
                toggleButtons: '.toggle-tops-btn',
                topsGrid: '.tops-grid'
            },
            defaults: {
                topLimit: 10,
                compactTopLimit: 3,
                cacheKey: 'topsModuleCache',
                cacheTTL: 3600000 // 1 час
            },
            messages: {
                noTopData: 'Недостаточно данных для формирования топа',
                loading: 'Загрузка данных...',
                error: 'Ошибка загрузки данных',
                networkError: 'Проверьте подключение к интернету',
                retry: 'Повторить попытку'
            }
        };

        this.state = {
            limit: 3,
            expanded: false,
            films: [],
            isLoading: false,
            hasError: false,
            data: {
                bestFilms: [],
                worstFilms: [],
                genres: [],
                directors: []
            }
        };

        this.cache = new Map();
        this.rafIds = new Map();
        this.init();
    }

    /**
     * Инициализация модуля
     */
    async init() {
        if (!this.checkRequirements()) return;

        this.cacheDOM();
        this.initEventListeners();
        this.initIntersectionObserver();
        await this.loadData();
    }

    /**
     * Проверка требований
     */
    checkRequirements() {
        // Проверяем наличие контейнера
        const container = document.querySelector('#top-films');
        if (!container) {
            console.log('Секция топов не найдена');
            return false;
        }
        return true;
    }

    /**
     * Кэширование DOM элементов
     */
    cacheDOM() {
        this.elements = {};
        for (const [key, selector] of Object.entries(this.config.selectors)) {
            this.elements[key] = document.querySelector(selector);
        }
    }

    /**
     * Инициализация Intersection Observer для ленивой загрузки
     */
    initIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        this.observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.1
        });
    }

    /**
     * Инициализация обработчиков событий
     */
    initEventListeners() {
        // Обработчик переключения кнопок
        if (this.elements.topsControls) {
            this.elements.topsControls.addEventListener('click', this.handleToggleClick.bind(this));
        }

        // Обработчик для ретрая
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('retry-tops-button')) {
                this.loadData();
            }
        });

        // Обработчик ресайза с дебаунсом
        this.debouncedResize = this.debounce(() => {
            this.updateLayout();
        }, 250);
        window.addEventListener('resize', this.debouncedResize);
    }

    /**
     * Дебаунс функция
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
     * Загрузка данных из JSON
     */
    async loadData() {
        // Проверка кэша
        if (this.shouldUseCache()) {
            this.updateDisplay();
            return;
        }

        this.state.isLoading = true;
        this.state.hasError = false;
        this.showLoadingState();

        try {
            const response = await fetch(this.config.dataSources.films, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'max-age=3600'
                },
                signal: AbortSignal.timeout(10000) // Таймаут 10 секунд
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.state.films = Array.isArray(data) ? data : [];

            // Сохраняем в кэш
            this.saveToCache({
                films: this.state.films,
                timestamp: Date.now()
            });

            this.analyzeData();
            this.renderTops();

        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.state.hasError = true;
            this.handleLoadError(error);
        } finally {
            this.state.isLoading = false;
        }
    }

    /**
     * Проверка возможности использования кэша
     */
    shouldUseCache() {
        try {
            const cached = localStorage.getItem(this.config.defaults.cacheKey);
            if (!cached) return false;

            const { data, timestamp } = JSON.parse(cached);
            const cacheAge = Date.now() - timestamp;

            // Используем кэш если он свежий или мы офлайн
            if (cacheAge < this.config.defaults.cacheTTL || !navigator.onLine) {
                this.state.films = data.films || [];
                this.analyzeData();
                this.renderTops();
                return true;
            }
        } catch (error) {
            console.warn('Ошибка чтения кэша:', error);
        }
        return false;
    }

    /**
     * Сохранение в кэш
     */
    saveToCache(data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(this.config.defaults.cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Не удалось сохранить в кэш:', error);
        }
    }

    /**
     * Обработка ошибок загрузки
     */
    handleLoadError(error) {
        let errorMessage = this.config.messages.error;

        if (error.name === 'AbortError') {
            errorMessage = 'Таймаут запроса';
        } else if (error.message.includes('Failed to fetch') || !navigator.onLine) {
            errorMessage = this.config.messages.networkError;
        }

        this.showErrorState(errorMessage);

        // Пробуем использовать кэш при ошибке
        const cached = this.shouldUseCache();
        if (!cached) {
            setTimeout(() => this.renderEmptyState(), 100);
        }
    }

    /**
     * Показать состояние загрузки
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
     */
    showErrorState(message) {
        const containers = [
            this.elements.topBestFilms,
            this.elements.topWorstFilms,
            this.elements.topGenres,
            this.elements.topDirectors
        ];

        containers.forEach(container => {
            if (container) {
                container.innerHTML = `
                    <div class="error-state">
                        <p>${message}</p>
                        <button class="retry-tops-button btn btn--primary">
                            ${this.config.messages.retry}
                        </button>
                    </div>
                `;
            }
        });
    }

    /**
     * Показать пустое состояние
     */
    renderEmptyState() {
        const containers = [
            this.elements.topBestFilms,
            this.elements.topWorstFilms,
            this.elements.topGenres,
            this.elements.topDirectors
        ];

        containers.forEach(container => {
            if (container) {
                container.innerHTML = `<p class="no-data">${this.config.messages.noTopData}</p>`;
            }
        });
    }

    /**
     * Обработка клика по кнопке переключения
     */
    handleToggleClick(e) {
        const button = e.target.closest('.toggle-tops-btn');
        if (!button) return;

        const limit = parseInt(button.dataset.limit);
        this.toggleTopsLimit(limit);
    }

    /**
     * Переключение лимита отображения
     */
    toggleTopsLimit(limit) {
        if (this.state.limit === limit) return;

        this.state.limit = limit;
        this.state.expanded = limit === this.config.defaults.topLimit;

        // Анимация переключения
        requestAnimationFrame(() => {
            // Обновляем активную кнопку
            document.querySelectorAll('.toggle-tops-btn').forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.limit) === limit);
                btn.setAttribute('aria-pressed', parseInt(btn.dataset.limit) === limit);
            });

            // Перерисовываем топы с анимацией
            this.renderTopsWithAnimation();
        });
    }

    /**
     * Обновление лейаута
     */
    updateLayout() {
        if (window.innerWidth <= 768) {
            this.elements.topsGrid?.style.setProperty('--items-per-row', '1');
        } else {
            this.elements.topsGrid?.style.setProperty('--items-per-row', '2');
        }
    }

    /**
     * Анализ данных для формирования топов
     */
    analyzeData() {
        if (!this.state.films || this.state.films.length === 0) {
            console.warn('Нет данных о фильмах для анализа');
            return;
        }

        // Используем Web Workers для тяжелых вычислений если возможно
        if (window.Worker && this.state.films.length > 50) {
            this.analyzeDataWithWorker();
        } else {
            this.analyzeDataInMainThread();
        }
    }

    /**
     * Анализ данных в основном потоке
     */
    analyzeDataInMainThread() {
        // Отложенный анализ для предотвращения блокировки UI
        setTimeout(() => {
            this.state.data.bestFilms = this.getTopFilms('best');
            this.state.data.worstFilms = this.getTopFilms('worst');
            this.state.data.genres = this.getTopGenres();
            this.state.data.directors = this.getTopDirectors();

            this.renderTops();
        }, 0);
    }

    /**
     * Анализ данных с помощью Web Worker
     */
    analyzeDataWithWorker() {
        // Реализация с Web Worker для больших наборов данных
        const workerCode = `
            self.onmessage = function(e) {
                const films = e.data;
                
                function getTopFilms(type) {
                    const ratedFilms = films.filter(film => {
                        const rating = parseFloat(film['Оценка']) || 0;
                        return rating > 0;
                    });
                    
                    return ratedFilms.sort((a, b) => {
                        const ratingA = parseFloat(a['Оценка']) || 0;
                        const ratingB = parseFloat(b['Оценка']) || 0;
                        return type === 'best' ? ratingB - ratingA : ratingA - ratingB;
                    }).slice(0, 10);
                }
                
                function getTopGenres() {
                    const genreCount = {};
                    films.forEach(film => {
                        const genre = film['Жанр'];
                        if (genre) {
                            genre.split(',').forEach(g => {
                                const trimmed = g.trim().toLowerCase();
                                if (trimmed) {
                                    genreCount[trimmed] = (genreCount[trimmed] || 0) + 1;
                                }
                            });
                        }
                    });
                    
                    return Object.entries(genreCount)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10)
                        .map(([genre, count]) => ({ genre, count }));
                }
                
                function getTopDirectors() {
                    const directorCount = {};
                    films.forEach(film => {
                        const director = film['Режиссер'];
                        if (director) {
                            const trimmed = director.trim();
                            if (trimmed) {
                                directorCount[trimmed] = (directorCount[trimmed] || 0) + 1;
                            }
                        }
                    });
                    
                    return Object.entries(directorCount)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10)
                        .map(([director, count]) => ({ director, count }));
                }
                
                postMessage({
                    bestFilms: getTopFilms('best'),
                    worstFilms: getTopFilms('worst'),
                    genres: getTopGenres(),
                    directors: getTopDirectors()
                });
            };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));

        worker.onmessage = (e) => {
            this.state.data = e.data;
            this.renderTops();
            worker.terminate();
        };

        worker.postMessage(this.state.films);
    }

    /**
     * Получение топ-N фильмов по рейтингу
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
     */
    getTopGenres() {
        const genreCount = new Map();

        this.state.films.forEach(film => {
            const genre = film['Жанр'];
            if (genre && typeof genre === 'string') {
                genre.split(',').map(g => g.trim().toLowerCase())
                    .filter(g => g)
                    .forEach(normalizedGenre => {
                        genreCount.set(normalizedGenre, (genreCount.get(normalizedGenre) || 0) + 1);
                    });
            }
        });

        return Array.from(genreCount.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, this.config.defaults.topLimit)
            .map(([genre, count]) => ({ genre, count }));
    }

    /**
     * Получение топ-N режиссеров
     */
    getTopDirectors() {
        const directorCount = new Map();

        this.state.films.forEach(film => {
            const director = film['Режиссер'];
            if (director && typeof director === 'string') {
                const normalizedDirector = this.capitalizeFirstLetter(director.trim());
                if (normalizedDirector) {
                    directorCount.set(normalizedDirector, (directorCount.get(normalizedDirector) || 0) + 1);
                }
            }
        });

        return Array.from(directorCount.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, this.config.defaults.topLimit)
            .map(([director, count]) => ({ director, count }));
    }

    /**
     * Рендеринг всех топ-списков
     */
    renderTops() {
        this.renderTopFilms('best');
        this.renderTopFilms('worst');
        this.renderTopGenres();
        this.renderTopDirectors();

        // Инициализируем ленивую загрузку изображений
        this.initLazyLoading();
    }

    /**
     * Рендеринг с анимацией
     */
    renderTopsWithAnimation() {
        // Добавляем класс анимации
        if (this.elements.topsGrid) {
            this.elements.topsGrid.classList.add('updating');

            // Рендерим с задержкой для плавности
            requestAnimationFrame(() => {
                this.renderTops();

                // Убираем класс анимации после завершения
                setTimeout(() => {
                    this.elements.topsGrid?.classList.remove('updating');
                }, 300);
            });
        } else {
            this.renderTops();
        }
    }

    /**
     * Инициализация ленивой загрузки
     */
    initLazyLoading() {
        if (!this.observer) return;

        document.querySelectorAll('.top-poster img[data-src]').forEach(img => {
            this.observer.observe(img);
        });
    }

    /**
     * Рендеринг топ-фильмов
     */
    renderTopFilms(type) {
        const container = type === 'best' ? this.elements.topBestFilms : this.elements.topWorstFilms;
        if (!container) return;

        const films = type === 'best' ? this.state.data.bestFilms : this.state.data.worstFilms;

        if (films.length === 0) {
            container.innerHTML = `<p class="no-data">${this.config.messages.noTopData}</p>`;
            return;
        }

        const items = films.slice(0, this.state.limit)
            .map((film, index) => this.createFilmTopItem(film, index, type))
            .join('');

        container.innerHTML = items;
    }

    /**
     * Рендеринг топ-жанров
     */
    renderTopGenres() {
        if (!this.elements.topGenres) return;
        const genres = this.state.data.genres.slice(0, this.state.limit);

        if (genres.length === 0) {
            this.elements.topGenres.innerHTML = `<p class="no-data">${this.config.messages.noTopData}</p>`;
            return;
        }

        this.elements.topGenres.innerHTML = genres
            .map((genre, index) => this.createGenreTopItem(genre, index))
            .join('');
    }

    /**
     * Рендеринг топ-режиссеров
     */
    renderTopDirectors() {
        if (!this.elements.topDirectors) return;
        const directors = this.state.data.directors.slice(0, this.state.limit);

        if (directors.length === 0) {
            this.elements.topDirectors.innerHTML = `<p class="no-data">${this.config.messages.noTopData}</p>`;
            return;
        }

        this.elements.topDirectors.innerHTML = directors
            .map((director, index) => this.createDirectorTopItem(director, index))
            .join('');
    }

    /**
     * Создание элемента топ-фильма
     */
    createFilmTopItem(film, index, type) {
        const posterUrl = this.getPosterUrl(film); // Используем новый метод
        const rating = this.parseRating(film['Оценка']);
        const filmName = film['Фильм'] || film['Название'] || 'Неизвестный фильм';
        const filmYear = film['Год'] || '';
        const director = film['Режиссер'] || 'Неизвестен';
        const kinopoiskUrl = this.generateKinopoiskUrl(filmName, filmYear);
        const isCompact = this.state.limit === 3;
        const ratingColor = this.getRatingColor(rating);

        return `
    <div class="top-item ${isCompact ? 'compact' : ''}" 
         data-rating="${rating}" 
         data-type="${type}"
         role="listitem">
        <div class="top-rank" aria-label="Место ${index + 1}">${index + 1}</div>
        <div class="top-poster">
            <img src="${posterUrl}" 
                 data-src="${posterUrl}"
                 alt="${filmName}"
                 loading="lazy"
                 onerror="if (this.src !== '../images/default-poster.jpg') { 
                     this.src='../images/default-poster.jpg'; 
                     this.onerror=null; 
                 }">
            ${kinopoiskUrl ? `
            ` : ''}
        </div>
        <div class="top-info">
            <div class="top-film-title" title="${filmName}">
                ${this.escapeHtml(filmName)} 
                ${filmYear ? `<span class="film-year">(${filmYear})</span>` : ''}
            </div>
            <div class="top-film-meta">
                <span class="top-director" title="${director}">${this.escapeHtml(director)}</span>
                <span class="top-rating" style="color: ${ratingColor}">
                    <span class="rating-stars">${this.createRatingStars(rating)}</span>
                    ${rating.toFixed(1)}
                    <span class="rating-percentage">/10</span>
                </span>
            </div>
        </div>
    </div>
    `;
    }

    /**
     * Создание элемента топ-жанра
     */
    createGenreTopItem(genreItem, index) {
        const isCompact = this.state.limit === 3;
        const wordForm = this.getRussianWordForm(genreItem.count, 'фильм', 'фильма', 'фильмов');

        return `
        <div class="top-item ${isCompact ? 'compact' : ''}" role="listitem">
            <div class="top-rank" aria-label="Место ${index + 1}">${index + 1}</div>
            <div class="top-info">
                <div class="top-film-title">${this.capitalizeFirstLetter(genreItem.genre)}</div>
                <div class="top-film-meta">
                    <span class="rating-badge">
                        ${genreItem.count} ${wordForm}
                    </span>
                </div>
            </div>
        </div>
        `;
    }

    /**
     * Создание элемента топ-режиссера
     */
    createDirectorTopItem(directorItem, index) {
        const isCompact = this.state.limit === 3;
        const wordForm = this.getRussianWordForm(directorItem.count, 'фильм', 'фильма', 'фильмов');

        return `
        <div class="top-item ${isCompact ? 'compact' : ''}" role="listitem">
            <div class="top-rank" aria-label="Место ${index + 1}">${index + 1}</div>
            <div class="top-info">
                <div class="top-film-title">${this.capitalizeFirstLetter(directorItem.director)}</div>
                <div class="top-film-meta">
                    <span class="rating-badge">
                        ${directorItem.count} ${wordForm}
                    </span>
                </div>
            </div>
        </div>
        `;
    }

    /**
     * Парсинг рейтинга с кэшированием
     */
    parseRating(rating) {
        const cacheKey = `rating_${rating}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let result = 0;
        if (rating || rating === 0) {
            if (typeof rating === 'number') {
                result = rating;
            } else {
                const num = parseFloat(rating.toString().replace(',', '.'));
                result = isNaN(num) ? 0 : Math.min(Math.max(num, 0), 10);
            }
        }

        this.cache.set(cacheKey, result);
        return result;
    }

    /**
     * Получение цвета для рейтинга
     */
    getRatingColor(rating) {
        if (rating >= 8) return '#4CAF50'; // зеленый
        if (rating >= 6) return '#FF9800'; // оранжевый
        if (rating >= 4) return '#FF5722'; // красный-оранжевый
        return '#F44336'; // красный
    }

    /**
     * Создание звезд рейтинга
     */
    createRatingStars(rating) {
        const num = parseFloat(rating) || 0;
        const clamped = Math.min(Math.max(num, 0), 10);
        const full = Math.floor(clamped);
        const half = clamped % 1 >= 0.5 ? 1 : 0;
        const empty = 10 - full - half;

        // Используем SVG для лучшей производительности
        return `${'★'.repeat(full)}${half ? '⯨' : ''}${'☆'.repeat(empty)}`;
    }

    /**
     * Капитализация первой букши с кэшированием
     */
    capitalizeFirstLetter(string) {
        if (!string) return '';

        const cacheKey = `capitalize_${string}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const result = string.split(/([\s\-']+)/)
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

        this.cache.set(cacheKey, result);
        return result;
    }

    /**
     * Получение правильной формы слова для русского языка
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
     */
    generateKinopoiskUrl(filmName, filmYear) {
        if (!filmName) return null;

        const cacheKey = `kinopoisk_${filmName}_${filmYear}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Улучшенная очистка названия
        const cleanName = filmName
            .replace(/[^\w\sа-яА-ЯёЁ\-:]/gi, ' ') // Разрешаем дефисы и двоеточия
            .replace(/\s+/g, '+') // Используем + для поиска
            .trim();

        const searchQuery = filmYear ? `${cleanName}+${filmYear}` : cleanName;
        const url = `https://www.kinopoisk.ru/index.php?kp_query=${searchQuery}`;

        this.cache.set(cacheKey, url);
        return url;
    }

    /**
 * Получение корректного URL постера
 */
    getPosterUrl(film) {
        const fallbackUrl = '../images/default-poster.jpg';

        // Проверяем все возможные поля с постерами
        const possibleFields = ['Постер URL', 'Постер', 'Poster', 'poster_url', 'poster'];

        for (const field of possibleFields) {
            const url = film[field];
            if (url && typeof url === 'string' && url.trim()) {
                const trimmedUrl = url.trim();
                // Проверяем, что это валидный URL или путь к файлу
                if (trimmedUrl.startsWith('http') ||
                    trimmedUrl.startsWith('/') ||
                    trimmedUrl.startsWith('../') ||
                    trimmedUrl.startsWith('./') ||
                    trimmedUrl.includes('images/')) {
                    return trimmedUrl;
                }
            }
        }

        return fallbackUrl;
    }

    /**
     * Экранирование HTML с кэшированием
     */
    escapeHtml(unsafe) {
        if (!unsafe) return '';

        const cacheKey = `escape_${unsafe}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const result = unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        this.cache.set(cacheKey, result);
        return result;
    }

    /**
     * Очистка ресурсов
     */
    destroy() {
        window.removeEventListener('resize', this.debouncedResize);

        if (this.observer) {
            this.observer.disconnect();
        }

        // Отменяем все pending RAF
        this.rafIds.forEach(id => cancelAnimationFrame(id));
        this.rafIds.clear();

        this.cache.clear();
    }
}

/**
 * Функция инициализации модуля топ-списков
 */
function initTopsModule() {
    try {
        window.topsModule = new TopsModule();
        console.log('Модуль топов инициализирован');
    } catch (error) {
        console.error('Ошибка инициализации модуля топов:', error);
    }
}

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTopsModule);
} else {
    initTopsModule();
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TopsModule, initTopsModule };
}
