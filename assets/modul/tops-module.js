/**
 * Модуль для управления секцией "Наши топы"
 * Оптимизированная версия: устранены критические ошибки, удалена избыточность, сохранена логика
 */
class TopsModule {
    constructor() {
        this.config = {
            dataSources: { films: '../data/films.json' },
            defaults: {
                topLimit: 10,
                cacheKey: 'topsCache',
                cacheTTL: 3600000,
                ratingPrecision: 1,
                poster: '../images/default-poster.jpg'
            }
        };

        this.state = {
            limit: 3,
            films: [],
            data: {
                bestFilms: [],
                worstFilms: [],
                genres: [],
                directors: []
            }
        };

        this.currentFilm = null;
        this.elements = {};
        this.init();
    }

    /**
     * Инициализация модуля
     */
    async init() {
        if (!this.checkRequirements()) return;

        this.cacheDOM();
        this.bindEvents();
        await this.loadData();
    }

    /**
     * Проверка наличия необходимых DOM элементов
     */
    checkRequirements() {
        return !!document.querySelector('#top-films');
    }

    /**
     * Кэширование DOM элементов
     */
    cacheDOM() {
        this.elements = {
            topsControls: document.querySelector('.tops-controls'),
            topBestFilms: document.querySelector('#top-best-films'),
            topWorstFilms: document.querySelector('#top-worst-films'),
            topGenres: document.querySelector('#top-genres'),
            topDirectors: document.querySelector('#top-directors'),
            toggleButtons: document.querySelectorAll('.toggle-tops-btn'),
            modal: document.getElementById('film-modal'),
            modalOverlay: document.querySelector('.film-modal__overlay'),
            modalClose: document.querySelector('.film-modal__close'),
            modalContent: document.querySelector('.film-modal__content')
        };
    }

    /**
     * Привязка событий
     */
    bindEvents() {
        // Переключение лимита
        this.elements.toggleButtons?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const limit = parseInt(e.target.dataset.limit);
                this.toggleTopsLimit(limit);
            });
        });

        // Клики по фильмам - делегирование
        const topsGrid = document.querySelector('.tops-grid');
        if (topsGrid) {
            topsGrid.addEventListener('click', (e) => this.handleFilmClick(e));
        }

        // Модальное окно
        this.elements.modalOverlay?.addEventListener('click', () => this.closeModal());
        this.elements.modalClose?.addEventListener('click', () => this.closeModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.modal?.classList.contains('active')) {
                this.closeModal();
            }
        });

        // Ретрай
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('retry-tops-button')) {
                this.loadData();
            }
        });
    }

    /**
     * Обработка клика по фильму
     */
    handleFilmClick(e) {
        const topItem = e.target.closest('.top-item[data-film-id]');
        if (!topItem) return;

        e.preventDefault();
        e.stopPropagation();

        const filmId = topItem.dataset.filmId;
        const type = topItem.dataset.type;
        
        // Находим фильм по ID
        const film = this.findFilmById(filmId, type);
        if (film) {
            this.currentFilm = film;
            this.showFilmModal(film);
        }
    }

    /**
     * Поиск фильма по ID и типу
     */
    findFilmById(filmId, type) {
        const [typePrefix, indexStr] = filmId.split('-');
        const index = parseInt(indexStr);
        
        if (typePrefix === 'best' && this.state.data.bestFilms[index]) {
            return this.state.data.bestFilms[index];
        } else if (typePrefix === 'worst' && this.state.data.worstFilms[index]) {
            return this.state.data.worstFilms[index];
        }
        
        return null;
    }

    /**
     * Загрузка данных о фильмах
     */
    async loadData() {
        const cached = this.getCachedData();
        if (cached) {
            this.state.films = cached.films;
            this.analyzeData();
            this.renderTops();
            return;
        }

        this.showLoadingState();

        try {
            const response = await fetch(this.config.dataSources.films);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            this.state.films = await response.json();
            this.saveToCache();
            this.analyzeData();
            this.renderTops();
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showErrorState('Ошибка загрузки данных');
        }
    }

    /**
     * Получение кэшированных данных
     */
    getCachedData() {
        try {
            const cached = localStorage.getItem(this.config.defaults.cacheKey);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < this.config.defaults.cacheTTL) {
                return data;
            }
        } catch (error) {
            console.warn('Ошибка чтения кэша:', error);
        }
        return null;
    }

    /**
     * Сохранение данных в кэш
     */
    saveToCache() {
        try {
            const cacheData = {
                data: { films: this.state.films },
                timestamp: Date.now()
            };
            localStorage.setItem(this.config.defaults.cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Не удалось сохранить в кэш:', error);
        }
    }

    /**
     * Анализ данных для формирования топов
     */
    analyzeData() {
        this.state.data.bestFilms = this.getTopFilms('best');
        this.state.data.worstFilms = this.getTopFilms('worst');
        this.state.data.genres = this.getTopGenres();
        this.state.data.directors = this.getTopDirectors();
    }

    /**
     * Получение топ фильмов
     */
    getTopFilms(type) {
        const ratedFilms = this.state.films.filter(film => {
            const rating = this.parseRating(film['Оценка']);
            return !isNaN(rating) && rating > 0;
        });

        return [...ratedFilms]
            .sort((a, b) => {
                const ratingA = this.parseRating(a['Оценка']);
                const ratingB = this.parseRating(b['Оценка']);
                return type === 'best' ? ratingB - ratingA : ratingA - ratingB;
            })
            .slice(0, this.config.defaults.topLimit);
    }

    /**
     * Получение топ жанров
     */
    getTopGenres() {
        const genreCount = new Map();

        this.state.films.forEach(film => {
            const genre = film['Жанр'];
            if (genre && typeof genre === 'string') {
                genre.split(',').forEach(g => {
                    const trimmed = g.trim().toLowerCase();
                    if (trimmed) {
                        genreCount.set(trimmed, (genreCount.get(trimmed) || 0) + 1);
                    }
                });
            }
        });

        return Array.from(genreCount.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, this.config.defaults.topLimit)
            .map(([genre, count]) => ({ genre, count }));
    }

    /**
     * Получение топ режиссеров
     */
    getTopDirectors() {
        const directorCount = new Map();

        this.state.films.forEach(film => {
            const director = film['Режиссер'];
            if (director && typeof director === 'string') {
                const trimmed = director.trim();
                if (trimmed) {
                    directorCount.set(trimmed, (directorCount.get(trimmed) || 0) + 1);
                }
            }
        });

        return Array.from(directorCount.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, this.config.defaults.topLimit)
            .map(([director, count]) => ({ director, count }));
    }

    /**
     * Рендеринг всех топов
     */
    renderTops() {
        this.renderTopFilms('best');
        this.renderTopFilms('worst');
        this.renderTopGenres();
        this.renderTopDirectors();
    }

    /**
     * Рендеринг топ фильмов
     */
    renderTopFilms(type) {
        const container = type === 'best' ? this.elements.topBestFilms : this.elements.topWorstFilms;
        if (!container) return;

        const films = this.state.data[`${type}Films`];
        if (!films || films.length === 0) {
            container.innerHTML = '<p class="no-data">Недостаточно данных</p>';
            return;
        }

        const items = films
            .slice(0, this.state.limit)
            .map((film, index) => this.createFilmTopItem(film, index, type))
            .join('');

        container.innerHTML = items;
    }

    /**
     * Рендеринг топ жанров
     */
    renderTopGenres() {
        if (!this.elements.topGenres) return;

        const genres = this.state.data.genres.slice(0, this.state.limit);
        if (genres.length === 0) {
            this.elements.topGenres.innerHTML = '<p class="no-data">Недостаточно данных</p>';
            return;
        }

        this.elements.topGenres.innerHTML = genres
            .map((genre, index) => this.createGenreTopItem(genre, index))
            .join('');
    }

    /**
     * Рендеринг топ режиссеров
     */
    renderTopDirectors() {
        if (!this.elements.topDirectors) return;

        const directors = this.state.data.directors.slice(0, this.state.limit);
        if (directors.length === 0) {
            this.elements.topDirectors.innerHTML = '<p class="no-data">Недостаточно данных</p>';
            return;
        }

        this.elements.topDirectors.innerHTML = directors
            .map((director, index) => this.createDirectorTopItem(director, index))
            .join('');
    }

    /**
     * Создание элемента топ фильма
     */
    createFilmTopItem(film, index, type) {
        const posterUrl = this.getPosterUrl(film);
        const rating = this.parseRating(film['Оценка']);
        const filmName = film['Фильм'] || film['Название'] || 'Неизвестный фильм';
        const filmYear = film['Год'] || '';
        const director = film['Режиссер'] || 'Неизвестен';
        const genre = film['Жанр'] || '';
        const country = film['Страна'] || '';
        const isCompact = this.state.limit === 3;
        const ratingColor = this.getRatingColor(rating);
        const filmId = `${type}-${index}`;

        return `
            <div class="top-item ${isCompact ? 'compact' : ''}" 
                 data-film-id="${filmId}"
                 data-type="${type}"
                 role="button"
                 tabindex="0"
                 aria-label="Подробнее о фильме ${this.escapeHtml(filmName)}">
                
                <div class="top-rank">${index + 1}</div>
                
                <div class="top-poster">
                    <img src="${posterUrl}" 
                         alt="${this.escapeHtml(filmName)}"
                         loading="lazy"
                         onerror="this.src='${this.config.defaults.poster}'">
                </div>
                
                <div class="top-info">
                    <div class="top-film-title">
                        ${this.escapeHtml(filmName)}
                        ${filmYear ? `<span class="film-year">(${filmYear})</span>` : ''}
                    </div>
                    
                    <div class="top-film-meta">
                        <span class="top-director" title="${this.escapeHtml(director)}">
                            ${this.escapeHtml(director)}
                        </span>
                        
                        <span class="top-rating" style="color: ${ratingColor}">
                            <span class="rating-value">${rating.toFixed(1)}</span>
                            <span class="rating-percentage">/10</span>
                        </span>
                    </div>
                    
                    <div class="top-film-details">
                        ${genre ? `<span class="top-genre">${this.escapeHtml(genre)}</span>` : ''}
                        ${country ? `<span class="top-country">${this.escapeHtml(country)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Создание элемента топ жанра
     */
    createGenreTopItem(genreItem, index) {
        const isCompact = this.state.limit === 3;
        const wordForm = this.getRussianWordForm(genreItem.count, 'фильм', 'фильма', 'фильмов');

        return `
            <div class="top-item ${isCompact ? 'compact' : ''}">
                <div class="top-rank">${index + 1}</div>
                <div class="top-info">
                    <div class="top-film-title">${this.capitalizeFirstLetter(genreItem.genre)}</div>
                    <div class="top-film-meta">
                        <span class="rating-badge">${genreItem.count} ${wordForm}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Создание элемента топ режиссера
     */
    createDirectorTopItem(directorItem, index) {
        const isCompact = this.state.limit === 3;
        const wordForm = this.getRussianWordForm(directorItem.count, 'фильм', 'фильма', 'фильмов');

        return `
            <div class="top-item ${isCompact ? 'compact' : ''}">
                <div class="top-rank">${index + 1}</div>
                <div class="top-info">
                    <div class="top-film-title">${this.capitalizeFirstLetter(directorItem.director)}</div>
                    <div class="top-film-meta">
                        <span class="rating-badge">${directorItem.count} ${wordForm}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Переключение лимита отображения
     */
    toggleTopsLimit(limit) {
        if (this.state.limit === limit) return;

        this.state.limit = limit;

        this.elements.toggleButtons.forEach(btn => {
            const btnLimit = parseInt(btn.dataset.limit);
            const isActive = btnLimit === limit;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive);
        });

        this.renderTops();
    }

    /**
     * Отображение модального окна
     */
    showFilmModal(film) {
        if (!this.elements.modal) return;

        this.fillModalData(film);
        this.elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            this.elements.modalClose?.focus();
        }, 100);
    }

    /**
     * Закрытие модального окна
     */
    closeModal() {
        if (!this.elements.modal) return;

        this.elements.modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * Заполнение модального окна данными
     */
    fillModalData(film) {
        // Проверяем и создаем структуру модального окна если её нет
        if (!this.elements.modalContent || !this.elements.modalContent.querySelector('.film-modal__details')) {
            this.createModalStructure();
        }

        const filmName = film['Фильм'] || film['Название'] || 'Неизвестный фильм';
        const filmYear = film['Год'] || '';
        const director = film['Режиссер'] || 'Неизвестен';
        const genre = film['Жанр'] || 'Не указан';
        const country = film['Страна'] || '';
        const rating = this.parseRating(film['Оценка']);
        const date = film['Дата'] || '';
        const discussionNumber = film['Номер обсуждения'] || '';
        const participants = film['Участников'] || '';
        const actors = film['В главных ролях'] || '';

        // Постер
        const posterImg = this.elements.modal.querySelector('#modal-film-poster');
        if (posterImg) {
            posterImg.src = this.getPosterUrl(film);
            posterImg.alt = filmName;
        }

        // Заполняем заголовок
        const titleElement = this.elements.modal.querySelector('#modal-film-title');
        if (titleElement) {
            titleElement.textContent = filmName;
        }
        
        // Заполняем год
        const yearElement = this.elements.modal.querySelector('#modal-film-year');
        if (yearElement) {
            yearElement.textContent = filmYear ? `(${filmYear})` : '';
        }
        
        // Заполняем режиссера
        const directorElement = this.elements.modal.querySelector('#modal-film-director');
        if (directorElement) {
            directorElement.textContent = director ? `Режиссер: ${director}` : '';
        }
        
        // Заполняем жанр
        const genreElement = this.elements.modal.querySelector('#modal-film-genre');
        if (genreElement) {
            genreElement.textContent = genre ? `Жанр: ${genre}` : '';
        }

        // Рейтинг
        const ratingElement = this.elements.modal.querySelector('#modal-film-rating');
        if (ratingElement) {
            if (rating > 0) {
                ratingElement.textContent = rating.toFixed(this.config.defaults.ratingPrecision);
                ratingElement.style.color = this.getRatingColor(rating);
            } else {
                ratingElement.textContent = 'Нет оценки';
                ratingElement.style.color = 'var(--gray)';
            }
        }

        // Детали фильма
        const detailsContainer = this.elements.modal.querySelector('.film-modal__details');
        if (detailsContainer) {
            const details = [
                { label: 'Дата обсуждения', value: date },
                { label: 'Номер обсуждения', value: discussionNumber ? `#${discussionNumber}` : null },
                { label: 'Участников', value: participants ? `${participants} чел.` : null },
                { label: 'Страна', value: country },
                { label: 'В главных ролях', value: actors }
            ].filter(({ value }) => value && value.toString().trim() !== '');

            if (details.length > 0) {
                const detailsHTML = details
                    .map(({ label, value }) => `
                        <div class="film-modal__detail">
                            <span class="detail-label">${label}:</span>
                            <span class="detail-value">${this.escapeHtml(value)}</span>
                        </div>
                    `).join('');
                
                detailsContainer.innerHTML = detailsHTML;
            } else {
                detailsContainer.innerHTML = '<p class="no-data">Дополнительная информация отсутствует</p>';
            }
        }

        // Обновляем кнопки
        this.updateActionButtons(film);
    }

    /**
     * Обновление кнопок действий в модальном окне
     */
    updateActionButtons(film) {
        const filmName = film['Фильм'] || '';
        const filmYear = film['Год'] || '';
        const kinopoiskUrl = this.generateKinopoiskUrl(filmName, filmYear);

        const actionsContainer = this.elements.modal.querySelector('.film-modal__actions');
        if (!actionsContainer) return;

        // Очищаем контейнер
        actionsContainer.innerHTML = '';

        // Кнопка "КиноПоиск"
        if (kinopoiskUrl) {
            const kinopoiskButton = document.createElement('a');
            kinopoiskButton.href = kinopoiskUrl;
            kinopoiskButton.target = '_blank';
            kinopoiskButton.rel = 'noopener noreferrer';
            kinopoiskButton.className = 'btn btn--outline film-modal__kinopoisk-btn';
            kinopoiskButton.innerHTML = '🎬 КиноПоиск';
            actionsContainer.appendChild(kinopoiskButton);
        }

        // Кнопка "Поделиться"
        const shareButton = document.createElement('button');
        shareButton.className = 'btn btn--outline';
        shareButton.id = 'modal-film-share';
        shareButton.innerHTML = '📢 Поделиться';
        shareButton.addEventListener('click', () => this.shareFilm());
        actionsContainer.appendChild(shareButton);
    }

    /**
     * Создание структуры модального окна
     */
    createModalStructure() {
        if (!this.elements.modal) return;

        // Создаем базовую структуру модального окна
        this.elements.modal.innerHTML = `
            <div class="film-modal__overlay"></div>
            <div class="film-modal__content">
                <button class="film-modal__close" aria-label="Закрыть">×</button>
                <div class="film-modal__header">
                    <div class="film-modal__poster">
                        <img id="modal-film-poster" src="${this.config.defaults.poster}" alt="Постер фильма">
                    </div>
                    <div class="film-modal__info">
                        <h2 id="modal-film-title" class="film-modal__title">Название фильма</h2>
                        <div id="modal-film-year" class="film-modal__year"></div>
                        <div id="modal-film-director" class="film-modal__director"></div>
                        <div id="modal-film-genre" class="film-modal__genre"></div>
                        <div class="film-modal__rating">
                            <span id="modal-film-rating" class="film-modal__rating-value">0.0</span>
                        </div>
                    </div>
                </div>
                <div class="film-modal__body">
                    <div class="film-modal__details">
                        <!-- Детали будут заполнены динамически -->
                    </div>
                    <div class="film-modal__actions">
                        <!-- Кнопки будут добавлены динамически -->
                    </div>
                </div>
            </div>
        `;

        // Обновляем кэшированные элементы
        this.elements.modalOverlay = this.elements.modal.querySelector('.film-modal__overlay');
        this.elements.modalClose = this.elements.modal.querySelector('.film-modal__close');
        this.elements.modalContent = this.elements.modal.querySelector('.film-modal__content');
        
        // Привязываем события к новым элементам
        this.elements.modalOverlay.addEventListener('click', () => this.closeModal());
        this.elements.modalClose.addEventListener('click', () => this.closeModal());
    }

    /**
     * Поделиться информацией о фильме
     */
    shareFilm() {
        if (!this.currentFilm) return;

        const film = this.currentFilm;
        const title = film['Фильм'] || 'Фильм';
        const rating = this.parseRating(film['Оценка']);
        const year = film['Год'] || '';
        const director = film['Режиссер'] || '';
        const genre = film['Жанр'] || '';

        // Формирование текста для sharing
        let shareText = `🎬 ${title}${year ? ` (${year})` : ''}`;
        if (director) shareText += `\n👨‍🎤 Режиссер: ${director}`;
        if (genre) shareText += `\n🎭 Жанр: ${genre}`;
        if (rating > 0) shareText += `\n⭐ Клубная оценка: ${rating.toFixed(1)}/10`;
        shareText += `\n\n🎬 Посмотрели в киноклубе "Одиссея"!\n👉 Подробнее: ${window.location.href}`;

        // Пытаемся использовать Web Share API
        if (navigator.share) {
            navigator.share({
                title: `${title} - Киноклуб Одиссея`,
                text: shareText,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback: копирование в буфер обмена
            navigator.clipboard.writeText(shareText)
                .then(() => {
                    alert('Информация о фильме скопирована в буфер обмена!');
                })
                .catch(err => {
                    console.error('Ошибка копирования:', err);
                    alert('Скопируйте текст вручную:\n\n' + shareText);
                });
        }
    }

    /**
     * Генерация URL для КиноПоиска
     */
    generateKinopoiskUrl(filmName, filmYear) {
        if (!filmName) return null;
        const cleanName = filmName.replace(/[^\w\sа-яА-ЯёЁ]/gi, ' ').replace(/\s+/g, ' ').trim();
        const searchQuery = filmYear ? `${cleanName} ${filmYear}` : cleanName;
        return `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(searchQuery)}`;
    }

    /* ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===== */

    /**
     * Парсинг рейтинга
     */
    parseRating(rating) {
        if (rating === undefined || rating === null) return 0;
        const num = typeof rating === 'number' ? rating : parseFloat(rating.toString().replace(',', '.'));
        return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 10);
    }

    /**
     * Получение цвета для рейтинга
     */
    getRatingColor(rating) {
        if (rating >= 8) return '#4CAF50';
        if (rating >= 6) return '#FF9800';
        if (rating >= 4) return '#FF5722';
        return '#F44336';
    }

    /**
     * Получение URL постера
     */
    getPosterUrl(film) {
        const possibleFields = ['Постер URL', 'Постер', 'Poster', 'poster_url', 'poster'];
        for (const field of possibleFields) {
            const url = film[field];
            if (url && typeof url === 'string' && url.trim()) {
                const trimmed = url.trim();
                if (trimmed.startsWith('http') || trimmed.startsWith('/') || trimmed.includes('images/')) {
                    return trimmed;
                }
            }
        }
        return this.config.defaults.poster;
    }

    /**
     * Капитализация первой буквы
     */
    capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    /**
     * Правильная форма слова для русского языка
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
     * Экранирование HTML
     */
    escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        if (typeof unsafe !== 'string') unsafe = String(unsafe);
        const div = document.createElement('div');
        div.textContent = unsafe;
        return div.innerHTML;
    }

    /**
     * Отображение состояния загрузки
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
                        Загрузка данных...
                    </div>
                `;
            }
        });
    }

    /**
     * Отображение состояния ошибки
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
                            Попробовать снова
                        </button>
                    </div>
                `;
            }
        });
    }
}

/**
 * Инициализация модуля
 */
function initTopsModule() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.topsModule = new TopsModule();
        });
    } else {
        window.topsModule = new TopsModule();
    }
}

initTopsModule();