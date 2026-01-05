/**
 * Модуль для управления секцией "Наши топы"
 * Основные функции: загрузка данных, формирование топов, отображение модальных окон
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
            },
            messages: {
                noTopData: 'Недостаточно данных для формирования топа',
                loading: 'Загрузка данных...',
                error: 'Ошибка загрузки данных',
                retry: 'Повторить попытку'
            }
        };

        this.state = {
            limit: 3,
            films: [],
            isLoading: false,
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
        this.bindModalEvents();
        this.initEventListeners();
        await this.loadData();
    }

    /**
     * Проверка наличия необходимых DOM элементов
     */
    checkRequirements() {
        return !!document.querySelector('#top-films');
    }

    /**
     * Кэширование DOM элементов для быстрого доступа
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
            modalClose: document.querySelector('.film-modal__close')
        };
    }

    /**
     * Привязка событий для модального окна
     */
    bindModalEvents() {
        if (!this.elements.modal) return;

        this.elements.modalOverlay?.addEventListener('click', () => this.closeModal());
        this.elements.modalClose?.addEventListener('click', () => this.closeModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.modal.classList.contains('active')) {
                this.closeModal();
            }
        });

        const shareBtn = document.getElementById('modal-film-share');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareFilm());
        }
    }

    /**
     * Инициализация обработчиков событий
     */
    initEventListeners() {
        // Переключение лимита отображения
        if (this.elements.toggleButtons) {
            this.elements.toggleButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const limit = parseInt(e.target.dataset.limit);
                    this.toggleTopsLimit(limit);
                });
            });
        }

        // Делегирование кликов на фильмы
        const topsGrid = document.querySelector('.tops-grid');
        if (topsGrid) {
            topsGrid.addEventListener('click', (e) => this.handleFilmClick(e));
            topsGrid.addEventListener('keydown', (e) => this.handleFilmKeydown(e));
        }

        // Кнопка ретрая
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
        const film = this.findFilmById(filmId, type);

        if (film) this.showFilmModal(film);
    }

    /**
     * Обработка нажатия клавиш на фильме (для доступности)
     */
    handleFilmKeydown(e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;

        const topItem = e.target.closest('.top-item[data-film-id]');
        if (!topItem) return;

        e.preventDefault();
        const filmId = topItem.dataset.filmId;
        const type = topItem.dataset.type;
        const film = this.findFilmById(filmId, type);

        if (film) this.showFilmModal(film);
    }

    /**
     * Поиск фильма по ID и типу
     */
    findFilmById(filmId, type) {
        const films = type === 'best' ? this.state.data.bestFilms : this.state.data.worstFilms;
        return films.find((film, index) => `${type}-${index}` === filmId);
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

        this.state.isLoading = true;
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
            this.showErrorState(error.message);
        } finally {
            this.state.isLoading = false;
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
     * Получение топ фильмов (лучших или худших)
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
            container.innerHTML = `<p class="no-data">${this.config.messages.noTopData}</p>`;
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
            this.elements.topGenres.innerHTML = `<p class="no-data">${this.config.messages.noTopData}</p>`;
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
            this.elements.topDirectors.innerHTML = `<p class="no-data">${this.config.messages.noTopData}</p>`;
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
        const kinopoiskUrl = this.generateKinopoiskUrl(filmName, filmYear);
        const isCompact = this.state.limit === 3;
        const ratingColor = this.getRatingColor(rating);
        const filmId = `${type}-${index}`;

        return `
            <div class="top-item ${isCompact ? 'compact' : ''}" 
                 data-film-id="${filmId}"
                 data-type="${type}"
                 role="button"
                 tabindex="0"
                 aria-label="Подробнее о фильме ${filmName}">
                
                <div class="top-rank">${index + 1}</div>
                
                <div class="top-poster">
                    <img src="${posterUrl}" 
                         alt="${filmName}"
                         loading="lazy"
                         onerror="this.src='${this.config.defaults.poster}'">
                    
                    ${kinopoiskUrl ? `
                    <a href="${kinopoiskUrl}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="kinopoisk-poster-button"
                       onclick="event.stopPropagation()">
                       🎬 КиноПоиск
                    </a>
                    ` : ''}
                </div>
                
                <div class="top-info">
                    <div class="top-film-title">
                        ${this.escapeHtml(filmName)}
                        ${filmYear ? `<span class="film-year">(${filmYear})</span>` : ''}
                    </div>
                    
                    <div class="top-film-meta">
                        <span class="top-director" title="${director}">
                            ${this.escapeHtml(director)}
                        </span>
                        
                        <span class="top-rating" style="color: ${ratingColor}">
                            <span class="rating-stars">${this.createRatingStars(rating)}</span>
                            <span class="rating-value">${rating.toFixed(1)}</span>
                            <span class="rating-percentage">/10</span>
                        </span>
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
     * Переключение лимита отображения топов
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
     * Отображение модального окна с информацией о фильме
     */
    showFilmModal(film) {
        if (!this.elements.modal) return;

        this.fillModalData(film);
        this.elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            if (this.elements.modalClose) {
                this.elements.modalClose.focus();
            }
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
     * Заполнение модального окна данными о фильме
     */
    fillModalData(film) {
        // Постер
        const posterImg = document.getElementById('modal-film-poster');
        if (posterImg) {
            posterImg.src = this.getPosterUrl(film);
            posterImg.alt = film['Фильм'] || 'Постер фильма';
        }

        // Основная информация
        const mainFields = [
            { id: 'modal-film-title', value: film['Фильм'] || 'Неизвестный фильм' },
            { id: 'modal-film-year', value: film['Год'] ? `(${film['Год']})` : '' },
            { id: 'modal-film-director', value: film['Режиссер'] ? `Режиссер: ${film['Режиссер']}` : '' },
            { id: 'modal-film-genre', value: film['Жанр'] ? `Жанр: ${film['Жанр']}` : '' }
        ];

        mainFields.forEach(({ id, value }) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // Рейтинг
        const rating = this.parseRating(film['Оценка']);
        const ratingElement = document.getElementById('modal-film-rating');
        const starsElement = document.getElementById('modal-film-stars');

        if (ratingElement) {
            if (rating > 0) {
                ratingElement.textContent = rating.toFixed(this.config.defaults.ratingPrecision);
                ratingElement.style.color = this.getRatingColor(rating);
            } else {
                ratingElement.textContent = 'Нет оценки';
                ratingElement.style.color = 'var(--gray)';
            }
        }

        if (starsElement) {
            starsElement.textContent = rating > 0 ? this.createRatingStars(rating) : '';
        }

        // Детальная информация
        const realFields = [
            { label: 'Дата обсуждения', value: film['Дата'] },
            { label: 'Номер обсуждения', value: film['Номер обсуждения'] ? `#${film['Номер обсуждения']}` : null },
            { label: 'Участников', value: this.formatParticipants(film['Участников']) },
            { label: 'Страна', value: film['Страна'] },
            { label: 'В главных ролях', value: film['В главных ролях'] },
        ];

        const detailsContainer = document.querySelector('.film-modal__details');
        if (detailsContainer) {
            const availableDetails = realFields.filter(({ value }) => this.hasValue(value));

            if (availableDetails.length > 0) {
                const detailsHTML = availableDetails
                    .map(({ label, value }) => {
                        if (label === 'В главных ролях' && value.length > 100) {
                            const shortValue = value.substring(0, 100) + '...';
                            return `
                            <div class="film-modal__detail actors-detail">
                                <span class="detail-label">${label}:</span>
                                <span class="detail-value actors-value" data-full="${this.escapeHtml(value)}">
                                    ${this.escapeHtml(shortValue)}
                                    <button class="show-all-actors-btn">Показать всех</button>
                                </span>
                            </div>
                        `;
                        }
                        return `
                            <div class="film-modal__detail">
                                <span class="detail-label">${label}:</span>
                                <span class="detail-value">${this.escapeHtml(value)}</span>
                            </div>
                        `;
                    })
                    .join('');

                detailsContainer.innerHTML = detailsHTML;

                // Обработчик для кнопки "показать всех актеров"
                const showAllBtn = detailsContainer.querySelector('.show-all-actors-btn');
                if (showAllBtn) {
                    showAllBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const actorsValue = showAllBtn.closest('.actors-value');
                        actorsValue.innerHTML = this.escapeHtml(actorsValue.dataset.full);
                        showAllBtn.remove();
                    });
                }
            } else {
                detailsContainer.innerHTML = '<p class="no-data">Дополнительная информация отсутствует</p>';
            }
        }

        // Кнопки действий
        this.updateActionButtons(film);

        // Сохраняем фильм для sharing
        this.currentFilm = film;
    }

    /**
     * Форматирование участников
     */
    formatParticipants(participants) {
        if (typeof participants === 'number' || (typeof participants === 'string' && participants.trim() !== '')) {
            return `${participants} чел.`;
        }
        return null;
    }

    /**
     * Проверка наличия значения
     */
    hasValue(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim() !== '';
        if (typeof value === 'number') return true;
        return !!value;
    }

    /**
     * Обновление кнопок действий в модальном окне
     */
    updateActionButtons(film) {
        const filmName = film['Фильм'] || '';
        const filmYear = film['Год'] || '';
        const kinopoiskUrl = this.generateKinopoiskUrl(filmName, filmYear);
        const zonaUrl = this.generateZonaPlusUrl(filmName);

        const actionsContainer = document.querySelector('.film-modal__actions');
        if (!actionsContainer) return;

        actionsContainer.innerHTML = '';

        // Кнопка "Смотреть онлайн"
        if (zonaUrl) {
            const zonaButton = document.createElement('a');
            zonaButton.href = zonaUrl;
            zonaButton.target = '_blank';
            zonaButton.rel = 'noopener noreferrer';
            zonaButton.className = 'btn btn--primary film-modal__zona-btn pulse';
            zonaButton.innerHTML = `
                <span class="zona-icon">🎬</span>
                Смотреть онлайн
                <span class="new-content-badge">NEW</span>
            `;
            actionsContainer.appendChild(zonaButton);
        }

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
     * Генерация URL для Zona.plus
     */
    generateZonaPlusUrl(filmName) {
        if (!filmName) return null;

        const russianTitle = this.extractRussianTitle(filmName);
        const cleanName = russianTitle
            .replace(/[^\w\sа-яА-ЯёЁ\-:]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();

        return `https://w140.zona.plus/search/${encodeURIComponent(cleanName)}`;
    }

    /**
     * Извлечение русского названия из строки
     */
    extractRussianTitle(filmString) {
        if (!filmString || typeof filmString !== 'string') return filmString || '';

        const parts = filmString.split('/');
        if (parts.length < 2) return filmString.trim();

        for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i].trim();
            if (/[а-яА-ЯёЁ]/.test(part)) return part;
        }

        return parts[parts.length - 1].trim();
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
        const country = film['Страна'] || '';
        const participants = film['Участников'] || '';
        const actors = film['В главных ролях'] || '';

        // Формирование текста для sharing
        let shareText = `🎬 ${title}${year ? ` (${year})` : ''}`;
        if (director) shareText += `\n👨‍🎤 Режиссер: ${director}`;
        if (genre) shareText += `\n🎭 Жанр: ${genre}`;
        if (country) shareText += `\n🌍 Страна: ${country}`;
        if (rating > 0) shareText += `\n⭐ Клубная оценка: ${rating.toFixed(1)}/10`;
        if (participants) shareText += `\n👥 Участников: ${participants}`;
        if (actors) shareText += `\n🎭 В главных ролях: ${actors.substring(0, 100)}${actors.length > 100 ? '...' : ''}`;
        shareText += `\n\n🎬 Посмотрели в киноклубе "Одиссея"!\n👉 Подробнее: ${window.location.href}`;

        this.showShareMenu(shareText, title);
    }

    /**
     * Отображение меню sharing
     */
    showShareMenu(shareText, title) {
        if (navigator.share) {
            navigator.share({
                title: `${title} - Киноклуб Одиссея`,
                text: shareText,
                url: window.location.href
            }).catch(console.error);
        } else {
            const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;
            const vkUrl = `https://vk.com/share.php?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(title)}&comment=${encodeURIComponent(shareText)}`;

            const shareMenu = document.createElement('div');
            shareMenu.className = 'share-menu';
            shareMenu.innerHTML = `
                <div class="share-menu-content">
                    <h3>Поделиться</h3>
                    <a href="${telegramUrl}" target="_blank" class="share-option telegram">📱 Telegram</a>
                    <a href="${vkUrl}" target="_blank" class="share-option vk">👥 ВКонтакте</a>
                    <button class="copy-text-btn">📋 Скопировать текст</button>
                    <button class="close-share-menu">Закрыть</button>
                </div>
            `;

            document.body.appendChild(shareMenu);
            this.setupShareMenuEvents(shareMenu, shareText);
        }
    }

    /**
     * Настройка обработчиков событий для меню sharing
     */
    setupShareMenuEvents(shareMenu, shareText) {
        const copyBtn = shareMenu.querySelector('.copy-text-btn');
        const closeBtn = shareMenu.querySelector('.close-share-menu');

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(shareText)
                .then(() => alert('Информация о фильме скопирована!'))
                .finally(() => shareMenu.remove());
        });

        closeBtn.addEventListener('click', () => shareMenu.remove());
        shareMenu.addEventListener('click', (e) => {
            if (e.target === shareMenu) shareMenu.remove();
        });
    }

    /* ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ========== */

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
     * Создание звезд рейтинга
     */
    createRatingStars(rating) {
        const num = Math.min(Math.max(rating || 0, 0), 10);
        const full = Math.floor(num);
        const half = num % 1 >= 0.5 ? 1 : 0;
        const empty = 10 - full - half;
        return `${'★'.repeat(full)}${half ? '⯨' : ''}${'☆'.repeat(empty)}`;
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
     * Генерация URL для КиноПоиска
     */
    generateKinopoiskUrl(filmName, filmYear) {
        if (!filmName) return null;
        const cleanName = filmName.replace(/[^\w\sа-яА-ЯёЁ]/gi, ' ').replace(/\s+/g, ' ').trim();
        const searchQuery = filmYear ? `${cleanName} ${filmYear}` : cleanName;
        return `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(searchQuery)}`;
    }

    /**
     * Капитализация первой буквы
     */
    capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
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
     * Экранирование HTML
     */
    escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        if (typeof unsafe !== 'string') unsafe = String(unsafe);
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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
                        ${this.config.messages.loading}
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
                            ${this.config.messages.retry}
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
