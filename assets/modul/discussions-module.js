/**
 * Модуль для управления секцией "История обсуждений"
 */
class DiscussionsModule {
    constructor() {
        this.config = {
            dataSources: {
                films: '../data/films.json'
            },
            selectors: {
                filmsContainer: '#films-container',
                loadMoreBtn: '#load-more-films'
            },
            defaults: {
                filmsPerPage: 20,
                poster: '../images/default-poster.jpg',
                ratingPrecision: 1
            },
            messages: {
                loading: 'Загрузка списка фильмов...',
                noFilms: 'Нет данных о фильмах',
                loadMore: 'Показать еще',
                allFilmsLoaded: 'Все фильмы загружены'
            }
        };

        this.state = {
            films: [],
            sortedFilms: [],
            pagination: {
                currentPage: 0,
                totalFilms: 0,
                hasMore: true
            }
        };

        this.init();
    }

    /**
     * Инициализация модуля
     */
    async init() {
        console.log('Инициализация DiscussionsModule...');
        this.cacheDOM();
        this.initEventListeners();
        await this.loadData();
        this.renderFilms();
    }

    /**
     * Кэширование DOM элементов
     */
    cacheDOM() {
        this.elements = {};
        Object.keys(this.config.selectors).forEach(key => {
            this.elements[key] = document.querySelector(this.config.selectors[key]);
        });

        console.log('Найденные элементы:', this.elements);

        // Создаем кнопку "Загрузить еще" если её нет
        if (!this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn = document.createElement('button');
            this.elements.loadMoreBtn.id = 'load-more-films';
            this.elements.loadMoreBtn.className = 'load-more-btn';
            this.elements.loadMoreBtn.textContent = this.config.messages.loadMore;
            this.elements.loadMoreBtn.setAttribute('aria-label', 'Загрузить больше фильмов');
            this.elements.loadMoreBtn.style.display = 'none';

            if (this.elements.filmsContainer) {
                this.elements.filmsContainer.parentNode.appendChild(this.elements.loadMoreBtn);
            }
        }
    }

    /**
     * Инициализация обработчиков событий
     */
    initEventListeners() {
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.addEventListener('click', () => this.loadMoreFilms());
        }
    }

    /**
     * Загрузка данных из JSON
     */
    async loadData() {
        try {
            this.showLoadingState();
            console.log('Начинаем загрузку данных...');
            
            const data = await this.fetchLocalData();
            console.log('Получены данные:', data);
            
            this.state.films = Array.isArray(data) ? data : [];
            console.log(`Загружено фильмов: ${this.state.films.length}`);
            
            this.sortFilmsByDate();
            this.resetPagination();
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showErrorState();
            this.state.films = [];
            
            // Пробуем загрузить демо-данные
            try {
                console.log('Пробуем загрузить демо-данные...');
                const mockData = this.loadMockFilmsData();
                this.state.films = mockData;
                this.sortFilmsByDate();
                this.resetPagination();
                console.log('Демо-данные загружены успешно');
            } catch (mockError) {
                console.error('Ошибка загрузки демо-данных:', mockError);
            }
        }
    }

    /**
     * Загрузка данных локально
     */
    async fetchLocalData() {
        try {
            console.log('Пробуем загрузить локальные данные...');
            const response = await fetch(this.config.dataSources.films);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Локальные данные загружены:', data);
            return data;
            
        } catch (error) {
            console.error('Ошибка загрузки локальных данных:', error);
            
            // Пробуем альтернативный путь
            try {
                console.log('Пробуем альтернативный путь...');
                const altResponse = await fetch('./data/films.json');
                
                if (!altResponse.ok) {
                    throw new Error(`Alternative HTTP error! status: ${altResponse.status}`);
                }
                
                const altData = await altResponse.json();
                console.log('Альтернативные данные загружены:', altData);
                return altData;
                
            } catch (altError) {
                console.error('Ошибка загрузки альтернативных данных:', altError);
                throw new Error('Все источники данных недоступны');
            }
        }
    }

    /**
     * Загрузка демонстрационных данных
     */
    loadMockFilmsData() {
        console.log('Загрузка демо-данных фильмов');
        return [
            {
                "Фильм": "Mio min Mio/Мио, мой Мио",
                "Режиссер": "Владимир Грамматиков",
                "Жанр": "Фэнтези, Приключения, Семейный",
                "Страна": "Швеция, СССР, Норвегия",
                "Год": 1987,
                "Оценка": "6.0",
                "Номер обсуждения": "259",
                "Дата": "28.09.2025",
                "Постер URL": "https://sun9-77.vkuserphoto.ru/s/v1/ig2/mSLD6KdcfmVlmZSmRe9M_p4gK7Tv9TRczYo5jRuI9uTTjpZJw3jyhC7F5asrM22XhsG3x4gpVNaAO4Vyl2GIS6Ta.jpg?quality=95&as=32x46,48x68,72x102,108x154,160x228,240x341,360x512,480x683,492x700&from=bu&cs=492x0",
                "Описание": "Мальчик отправляется в волшебную страну, чтобы найти своего отца и сразиться со злом.",
                "Участников": 8
            }
        ];
    }

    /**
     * Сортировка фильмов по дате
     */
    sortFilmsByDate() {
        this.state.sortedFilms = [...this.state.films].sort((a, b) => {
            const dateA = this.parseDate(a['Дата']);
            const dateB = this.parseDate(b['Дата']);
            return dateB - dateA; // Сначала новые
        });
        console.log('Фильмы отсортированы по дате');
    }

    /**
     * Сброс пагинации
     */
    resetPagination() {
        this.state.pagination = {
            currentPage: 0,
            totalFilms: this.state.sortedFilms.length,
            hasMore: this.state.sortedFilms.length > 0
        };
        console.log('Пагинация сброшена:', this.state.pagination);
    }

    /**
     * Показать состояние загрузки
     */
    showLoadingState() {
        if (this.elements.filmsContainer) {
            this.elements.filmsContainer.innerHTML = `
                <div class="loading-message">
                    <div class="spinner" aria-hidden="true"></div>
                    ${this.config.messages.loading}
                </div>
            `;
        }
    }

    /**
     * Показать состояние ошибки
     */
    showErrorState() {
        if (this.elements.filmsContainer) {
            this.elements.filmsContainer.innerHTML = `
                <p class="no-data">${this.config.messages.noFilms}</p>
            `;
        }
    }

    /**
     * Загрузка дополнительных фильмов
     */
    loadMoreFilms() {
        if (!this.state.pagination.hasMore) return;
        
        this.state.pagination.currentPage += 1;
        console.log('Загружаем еще фильмов, страница:', this.state.pagination.currentPage);
        this.renderFilms();
    }

    /**
     * Рендеринг фильмов
     */
    renderFilms() {
        if (!this.elements.filmsContainer) {
            console.error('Контейнер фильмов не найден!');
            return;
        }

        if (!this.state.sortedFilms || !this.state.sortedFilms.length) {
            console.log('Нет фильмов для отображения');
            this.elements.filmsContainer.innerHTML = `<p class="no-data">${this.config.messages.noFilms}</p>`;
            this.updateLoadMoreButton();
            return;
        }

        const filmsToShow = Math.min(
            this.config.defaults.filmsPerPage * (this.state.pagination.currentPage + 1),
            this.state.sortedFilms.length
        );

        const paginatedFilms = this.state.sortedFilms.slice(0, filmsToShow);
        this.state.pagination.hasMore = this.state.sortedFilms.length > filmsToShow;

        this.updateLoadMoreButton();

        const filmsHTML = paginatedFilms.map(film => 
            this.createFilmCard(film)
        ).join('');

        this.elements.filmsContainer.innerHTML = filmsHTML;
        console.log(`Отображено ${paginatedFilms.length} фильмов из ${this.state.sortedFilms.length}`);
    }

    /**
     * Создание карточки фильма
     */
    createFilmCard(film) {
        const rating = this.parseRating(film['Оценка']);
        const formattedRating = rating.toFixed(this.config.defaults.ratingPrecision);
        const filmName = film['Фильм'] || 'Неизвестный фильм';
        const filmYear = film['Год'] || '';
        const discussionNumber = film['Номер обсуждения'] || 'N/A';
        const kinopoiskUrl = this.generateKinopoiskUrl(filmName, filmYear);

        return `
        <article class="film-card" role="article" aria-labelledby="film-${discussionNumber}-title">
            <div class="film-card-image">
                <img src="${film['Постер URL'] || this.config.defaults.poster}" 
                     alt="Постер: ${filmName} (${filmYear})" 
                     class="film-thumbnail"
                     loading="lazy"
                     onerror="this.src='${this.config.defaults.poster}'">
                <div class="film-rating" aria-label="Рейтинг: ${formattedRating}">
                    ${this.createRatingStars(rating)}
                    <span class="rating-number">${formattedRating}</span>
                </div>
                
                ${kinopoiskUrl ? `
                <div class="poster-overlay">
                    <a href="${kinopoiskUrl}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="kinopoisk-poster-button"
                       aria-label="Информация о фильме ${filmName} на КиноПоиске">
                       🎬 Информация о фильме
                    </a>
                </div>
                ` : ''}
            </div>
            <div class="film-info">
                <div class="discussion-header">
                    <span class="discussion-number">Обсуждение #${discussionNumber}</span>
                    <span class="discussion-date">${this.formatDate(film['Дата'])}</span>
                </div>
                
                <h3 id="film-${discussionNumber}-title">
                    ${this.escapeHtml(filmName)} ${filmYear ? `(${this.escapeHtml(filmYear)})` : ''}
                </h3>
                
                ${this.createFilmMeta('Режиссер:', film['Режиссер'])}
                ${this.createFilmMeta('Жанр:', film['Жанр'])}
                ${this.createFilmMeta('Страна:', film['Страна'])}
                ${this.createFilmMeta('Участников:', film['Участников'])}
                ${film['Описание'] ? `<p class="film-description">${this.escapeHtml(film['Описание'])}</p>` : ''}
            </div>
        </article>
        `;
    }

    /**
     * Создание мета-информации фильма
     */
    createFilmMeta(label, value) {
        if (value === null || value === undefined || value === '') return '';
        return `<p class="film-meta"><span class="meta-label">${label}</span> ${this.escapeHtml(value)}</p>`;
    }

    /**
     * Обновление кнопки "Загрузить еще"
     */
    updateLoadMoreButton() {
        if (!this.elements.loadMoreBtn) return;

        if (this.state.pagination.hasMore) {
            this.elements.loadMoreBtn.style.display = 'block';
            this.elements.loadMoreBtn.textContent = this.config.messages.loadMore;
            this.elements.loadMoreBtn.removeAttribute('disabled');
        } else if (this.state.sortedFilms.length > this.config.defaults.filmsPerPage) {
            this.elements.loadMoreBtn.textContent = this.config.messages.allFilmsLoaded;
            this.elements.loadMoreBtn.setAttribute('disabled', 'true');
            setTimeout(() => {
                this.elements.loadMoreBtn.style.display = 'none';
            }, 3000);
        } else {
            this.elements.loadMoreBtn.style.display = 'none';
        }
    }

    /**
     * Вспомогательные методы
     */
    parseDate(dateString) {
        if (!dateString) return new Date(0);
        const ddMMyyyyMatch = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (ddMMyyyyMatch) {
            const day = parseInt(ddMMyyyyMatch[1], 10);
            const month = parseInt(ddMMyyyyMatch[2], 10) - 1;
            const year = parseInt(ddMMyyyyMatch[3], 10);
            const result = new Date(year, month, day);
            return isNaN(result.getTime()) ? new Date(0) : result;
        }
        const result = new Date(dateString);
        return isNaN(result.getTime()) ? new Date(0) : result;
    }

    formatDate(dateString) {
        if (!dateString) return 'дата не указана';
        const date = this.parseDate(dateString);
        return isNaN(date.getTime()) ? dateString : 
            `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    }

    parseRating(rating) {
        if (!rating && rating !== 0) return 0;
        if (typeof rating === 'number') return rating;
        const num = parseFloat(rating.toString().replace(',', '.'));
        return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 10);
    }

    createRatingStars(rating) {
        const num = this.parseRating(rating);
        const clamped = Math.min(Math.max(num, 0), 10);
        const full = Math.floor(clamped);
        const half = clamped % 1 >= 0.5 ? 1 : 0;
        const empty = 10 - full - half;
        return `<span class="rating-stars" aria-hidden="true">${'★'.repeat(full)}${half ? '⯨' : ''}${'☆'.repeat(empty)}</span>`;
    }

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

    escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        if (typeof unsafe !== 'string') {
            unsafe = String(unsafe);
        }
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Инициализация модуля
function initDiscussionsModule() {
    console.log('Проверяем наличие секции film-archive...');
    if (document.querySelector('#film-archive')) {
        console.log('Секция film-archive найдена, инициализируем модуль...');
        new DiscussionsModule();
    } else {
        console.log('Секция film-archive НЕ найдена!');
    }
}

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
    console.log('DOM еще загружается, ждем DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initDiscussionsModule);
} else {
    console.log('DOM уже загружен, инициализируем сразу...');
    initDiscussionsModule();
}