/**
 * Модуль для управления секцией "История обсуждений"
 * НЕЗАВИСИМЫЙ МОДУЛЬ с модальным окном
 */
class DiscussionsModule {
    /**
     * Конструктор класса DiscussionsModule
     */
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
                allFilmsLoaded: 'Все фильмы загружены',
                copySuccess: 'Ссылка скопирована!'
            },
            zonaPlus: {
                baseUrl: 'https://w140.zona.plus/search/',
                logoUrl: 'https://w140.zona.plus/build/6b6b2c89e58f3b1d4f402666f6d622c4.svg'
            }
        };

        this.state = {
            films: [],
            sortedFilms: [],
            pagination: {
                currentPage: 0,
                totalFilms: 0,
                hasMore: true
            },
            zonaLogoLoaded: false,
            currentFilm: null
        };

        this.elements = {};
        this.init();
    }

    /**
     * Инициализация модуля
     */
    async init() {
        console.log('Инициализация DiscussionsModule...');
        this.cacheDOM();
        this.createModalStructure();
        this.initEventListeners();
        await this.preloadZonaLogo();
        await this.loadData();
        this.renderFilms();
        this.checkContainerVisibility();
    }

    /**
     * Принудительная проверка видимости контейнера
     */
    checkContainerVisibility() {
        if (this.elements.filmsContainer && this.elements.filmsContainer.nodeType === 1) {
            try {
                const styles = window.getComputedStyle(this.elements.filmsContainer);
                console.log('Container styles:', {
                    display: styles.display,
                    visibility: styles.visibility,
                    opacity: styles.opacity,
                    height: styles.height,
                    width: styles.width
                });

                // Принудительно устанавливаем правильные стили
                this.elements.filmsContainer.style.display = 'grid';
                this.elements.filmsContainer.style.visibility = 'visible';
                this.elements.filmsContainer.style.opacity = '1';
            } catch (error) {
                console.warn('Ошибка при проверке видимости контейнера:', error);
            }
        } else {
            console.warn('Контейнер фильмов не является элементом DOM или не существует');
        }
    }

    /**
     * Предзагрузка логотипа Zona.plus
     */
    async preloadZonaLogo() {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.state.zonaLogoLoaded = true;
                console.log('Логотип Zona.plus загружен');
                resolve();
            };
            img.onerror = () => {
                console.warn('Не удалось загрузить логотип Zona.plus');
                resolve();
            };
            img.src = this.config.zonaPlus.logoUrl;
        });
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
     * Создание структуры модального окна
     */
    createModalStructure() {
        // Создаем модальное окно если его нет
        let modal = document.getElementById('discussion-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'discussion-modal';
            modal.className = 'discussion-modal';
            modal.innerHTML = `
                <div class="discussion-modal__overlay"></div>
                <div class="discussion-modal__content">
                    <button class="discussion-modal__close" aria-label="Закрыть">×</button>
                    <div class="discussion-modal__header">
                        <div class="discussion-modal__poster">
                            <img id="discussion-modal-poster" src="${this.config.defaults.poster}" alt="Постер фильма">
                        </div>
                        <div class="discussion-modal__info">
                            <h2 id="discussion-modal-title" class="discussion-modal__title">Название фильма</h2>
                            <div id="discussion-modal-year" class="discussion-modal__year"></div>
                            <div id="discussion-modal-director" class="discussion-modal__director"></div>
                            <div id="discussion-modal-genre" class="discussion-modal__genre"></div>
                            <div id="discussion-modal-country" class="discussion-modal__country"></div>
                            <div class="discussion-modal__rating">
                                <span id="discussion-modal-rating" class="discussion-modal__rating-value">0.0</span>
                            </div>
                        </div>
                    </div>
                    <div class="discussion-modal__body">
                        <div class="discussion-modal__section">
                            <h3>Детали обсуждения</h3>
                            <div class="discussion-modal__details">
                                <!-- Детали будут заполнены динамически -->
                            </div>
                        </div>
                        <div class="discussion-modal__section">
                            <h3>Описание</h3>
                            <p id="discussion-modal-description" class="discussion-modal__description">
                                Описание загружается...
                            </p>
                        </div>
                        <div class="discussion-modal__actions">
                            <!-- Кнопки будут добавлены динамически -->
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Сохраняем ссылки на элементы модального окна
        this.elements.modal = modal;
        this.elements.modalOverlay = modal.querySelector('.discussion-modal__overlay');
        this.elements.modalClose = modal.querySelector('.discussion-modal__close');
        this.elements.modalContent = modal.querySelector('.discussion-modal__content');
    }

    /**
     * Инициализация обработчиков событий
     */
    initEventListeners() {
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.addEventListener('click', () => this.loadMoreFilms());
        }

        // Модальное окно
        this.elements.modalOverlay?.addEventListener('click', () => this.closeModal());
        this.elements.modalClose?.addEventListener('click', () => this.closeModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.modal?.classList.contains('active')) {
                this.closeModal();
            }
        });

        // Делегирование кликов по карточкам
        document.addEventListener('click', (e) => {
            // Клик по карточке фильма
            const filmCard = e.target.closest('.film-card');
            if (filmCard && !e.target.closest('.film-action-btn')) {
                e.preventDefault();
                const filmId = filmCard.dataset.filmId;
                const film = this.findFilmById(filmId);
                if (film) {
                    this.showFilmModal(film);
                }
            }

            // Клик по постеру
            const filmThumbnail = e.target.closest('.film-thumbnail');
            if (filmThumbnail) {
                e.preventDefault();
                const filmCard = filmThumbnail.closest('.film-card');
                if (filmCard) {
                    const filmId = filmCard.dataset.filmId;
                    const film = this.findFilmById(filmId);
                    if (film) {
                        this.showFilmModal(film);
                    }
                }
            }
        });
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
     * Поиск фильма по ID
     */
    findFilmById(filmId) {
        const index = parseInt(filmId);
        if (!isNaN(index) && this.state.sortedFilms[index]) {
            return this.state.sortedFilms[index];
        }
        return null;
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

        const filmsHTML = paginatedFilms.map((film, index) =>
            this.createFilmCard(film, index)
        ).join('');

        // Принудительно устанавливаем стили для мобильных
        this.elements.filmsContainer.innerHTML = filmsHTML;
        this.elements.filmsContainer.style.display = 'grid';
        this.elements.filmsContainer.style.visibility = 'visible';
        this.elements.filmsContainer.style.opacity = '1';

        console.log(`Отображено ${paginatedFilms.length} фильмов из ${this.state.sortedFilms.length}`);

        // Инициализируем кнопки поделиться после рендера
        this.initShareButtons();
    }

    /**
     * Создание карточки фильма
     */
    createFilmCard(film, index) {
        const rating = this.parseRating(film['Оценка']);
        const formattedRating = rating.toFixed(this.config.defaults.ratingPrecision);
        const filmName = film['Фильм'] || 'Неизвестный фильм';
        const filmYear = film['Год'] || '';
        const discussionNumber = film['Номер обсуждения'] || 'N/A';
        const kinopoiskUrl = this.generateKinopoiskUrl(filmName, filmYear);
        const shareData = this.prepareShareData(filmName, filmYear, discussionNumber);

        return `
    <article class="film-card" data-film-id="${index}" role="article" aria-labelledby="film-${discussionNumber}-title">
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
            
            <div class="film-actions">
                ${kinopoiskUrl ? `
                <a href="${kinopoiskUrl}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   class="film-action-btn film-kinopoisk-btn"
                   aria-label="Информация о фильме ${filmName} на КиноПоиске">
                   🎬 КиноПоиск
                </a>
                ` : ''}
                <button class="film-action-btn film-share-btn"
                        data-share='${JSON.stringify(shareData)}'
                        aria-label="Поделиться информацией о фильме ${filmName}">
                    📢 Поделиться
                </button>
            </div>
        </div>
    </article>
    `;
    }

    /**
     * Инициализация кнопок поделиться
     */
    initShareButtons() {
        document.querySelectorAll('.film-share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const shareData = JSON.parse(e.currentTarget.dataset.share);
                this.shareFilm(shareData);
            });
        });
    }

    /**
     * Поделиться фильмом
     */
    async shareFilm(shareData) {
        try {
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    return;
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        throw err;
                    }
                    return;
                }
            }

            this.showShareModal(shareData);
        } catch (error) {
            console.error('Ошибка шаринга:', error);
            this.copyToClipboard(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        }
    }

    /**
     * Показать модальное окно шаринга
     */
    showShareModal(shareData) {
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="share-modal-content">
                <h3>Поделиться фильмом</h3>
                <div class="share-options">
                    <a href="https://vk.com/share.php?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.title)}&comment=${encodeURIComponent(shareData.text)}"
                       target="_blank" class="share-option vk">
                        ВКонтакте
                    </a>
                    <a href="https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}"
                       target="_blank" class="share-option telegram">
                        Telegram
                    </a>
                    <button class="share-option copy" data-text="${encodeURIComponent(shareData.text + '\n\n' + shareData.url)}">
                        Скопировать ссылку
                    </button>
                </div>
                <button class="close-modal">Закрыть</button>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = '';
        };

        modal.querySelector('.close-modal').addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        modal.querySelector('.copy').addEventListener('click', (e) => {
            const text = decodeURIComponent(e.target.dataset.text);
            this.copyToClipboard(text);
            this.showNotification(this.config.messages.copySuccess);
            setTimeout(closeModal, 1000);
        });

        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    }

    /**
     * Показать модальное окно фильма
     */
    showFilmModal(film) {
        if (!this.elements.modal) return;

        this.state.currentFilm = film;
        this.fillModalData(film);
        this.elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            this.elements.modalClose?.focus();
        }, 100);
    }

    /**
     * Заполнение модального окна данными
     */
    fillModalData(film) {
        const filmName = film['Фильм'] || 'Неизвестный фильм';
        const filmYear = film['Год'] || '';
        const director = film['Режиссер'] || 'Неизвестен';
        const genre = film['Жанр'] || 'Не указан';
        const country = film['Страна'] || '';
        const rating = this.parseRating(film['Оценка']);
        const date = film['Дата'] || '';
        const discussionNumber = film['Номер обсуждения'] || '';
        const participants = film['Участников'] || '';
        const description = film['Описание'] || 'Описание отсутствует';
        const posterUrl = film['Постер URL'] || this.config.defaults.poster;

        // Постер
        const posterImg = this.elements.modal.querySelector('#discussion-modal-poster');
        if (posterImg) {
            posterImg.src = posterUrl;
            posterImg.alt = filmName;
            posterImg.onerror = () => {
                posterImg.src = this.config.defaults.poster;
            };
        }

        // Заголовок
        const titleElement = this.elements.modal.querySelector('#discussion-modal-title');
        if (titleElement) {
            titleElement.textContent = filmName;
        }

        // Год
        const yearElement = this.elements.modal.querySelector('#discussion-modal-year');
        if (yearElement) {
            yearElement.textContent = filmYear ? `(${filmYear})` : '';
        }

        // Режиссер
        const directorElement = this.elements.modal.querySelector('#discussion-modal-director');
        if (directorElement) {
            directorElement.textContent = director ? `Режиссер: ${director}` : '';
        }

        // Жанр
        const genreElement = this.elements.modal.querySelector('#discussion-modal-genre');
        if (genreElement) {
            genreElement.textContent = genre ? `Жанр: ${genre}` : '';
        }

        // Страна
        const countryElement = this.elements.modal.querySelector('#discussion-modal-country');
        if (countryElement) {
            countryElement.textContent = country ? `Страна: ${country}` : '';
        }

        // Рейтинг
        const ratingElement = this.elements.modal.querySelector('#discussion-modal-rating');
        if (ratingElement) {
            if (rating > 0) {
                ratingElement.textContent = rating.toFixed(this.config.defaults.ratingPrecision);
                ratingElement.style.color = this.getRatingColor(rating);
            } else {
                ratingElement.textContent = 'Нет оценки';
                ratingElement.style.color = 'var(--gray)';
            }
        }

        // Описание
        const descriptionElement = this.elements.modal.querySelector('#discussion-modal-description');
        if (descriptionElement) {
            descriptionElement.textContent = description;
        }

        // Детали фильма
        const detailsContainer = this.elements.modal.querySelector('.discussion-modal__details');
        if (detailsContainer) {
            const details = [
                { label: 'Дата обсуждения', value: date },
                { label: 'Номер обсуждения', value: discussionNumber ? `#${discussionNumber}` : null },
                { label: 'Участников', value: participants ? `${participants} чел.` : null }
            ].filter(({ value }) => value && value.toString().trim() !== '');

            if (details.length > 0) {
                const detailsHTML = details
                    .map(({ label, value }) => `
                        <div class="discussion-modal__detail">
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
        this.updateModalActionButtons(film);
    }

    /**
     * Обновление кнопок действий в модальном окне
     */
    updateModalActionButtons(film) {
        const filmName = film['Фильм'] || '';
        const filmYear = film['Год'] || '';
        const kinopoiskUrl = this.generateKinopoiskUrl(filmName, filmYear);

        const actionsContainer = this.elements.modal.querySelector('.discussion-modal__actions');
        if (!actionsContainer) return;

        // Очищаем контейнер
        actionsContainer.innerHTML = '';

        // Кнопка "КиноПоиск"
        if (kinopoiskUrl) {
            const kinopoiskButton = document.createElement('a');
            kinopoiskButton.href = kinopoiskUrl;
            kinopoiskButton.target = '_blank';
            kinopoiskButton.rel = 'noopener noreferrer';
            kinopoiskButton.className = 'btn btn--outline';
            kinopoiskButton.innerHTML = '🎬 КиноПоиск';
            actionsContainer.appendChild(kinopoiskButton);
        }

        // Кнопка "Поделиться"
        const shareButton = document.createElement('button');
        shareButton.className = 'btn btn--primary';
        shareButton.innerHTML = '📢 Поделиться';
        shareButton.addEventListener('click', () => this.shareCurrentFilm());
        actionsContainer.appendChild(shareButton);
    }

    /**
     * Поделиться текущим фильмом
     */
    async shareCurrentFilm() {
        if (!this.state.currentFilm) return;

        const film = this.state.currentFilm;
        const title = film['Фильм'] || 'Фильм';
        const rating = this.parseRating(film['Оценка']);
        const year = film['Год'] || '';
        const director = film['Режиссер'] || '';
        const genre = film['Жанр'] || '';

        let shareText = `🎬 ${title}${year ? ` (${year})` : ''}`;
        if (director) shareText += `\n👨‍🎤 Режиссер: ${director}`;
        if (genre) shareText += `\n🎭 Жанр: ${genre}`;
        if (rating > 0) shareText += `\n⭐ Клубная оценка: ${rating.toFixed(1)}/10`;
        shareText += `\n\n🎬 Посмотрели в киноклубе "Одиссея"!\n👉 Подробнее: ${window.location.href}`;

        if (navigator.share) {
            navigator.share({
                title: `${title} - Киноклуб Одиссея`,
                text: shareText,
                url: window.location.href
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareText)
                .then(() => {
                    this.showNotification('Информация о фильме скопирована в буфер обмена!');
                })
                .catch(err => {
                    console.error('Ошибка копирования:', err);
                    alert('Скопируйте текст вручную:\n\n' + shareText);
                });
        }
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
     * Копирование текста в буфер обмена
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification(this.config.messages.copySuccess);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification(this.config.messages.copySuccess);
        }
    }

    /**
     * Показать уведомление
     */
    showNotification(message) {
        const oldNotification = document.querySelector('.share-notification');
        if (oldNotification) oldNotification.remove();

        const notification = document.createElement('div');
        notification.className = 'share-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Подготовка данных для шаринга
     */
    prepareShareData(filmName, filmYear, discussionNumber) {
        const title = `🎬 ${filmName} (${filmYear})`;
        const text = `Обсуждение #${discussionNumber} в киноклубе Одиссея`;
        const url = window.location.href;

        return { title, text, url };
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
     * Парсинг даты из строки
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

    /**
     * Форматирование даты
     */
    formatDate(dateString) {
        if (!dateString) return 'дата не указана';
        const date = this.parseDate(dateString);
        return isNaN(date.getTime()) ? dateString :
            `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    }

    /**
     * Парсинг рейтинга
     */
    parseRating(rating) {
        if (!rating && rating !== 0) return 0;
        if (typeof rating === 'number') return rating;
        const num = parseFloat(rating.toString().replace(',', '.'));
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
        const num = this.parseRating(rating);
        const clamped = Math.min(Math.max(num, 0), 10);
        const full = Math.floor(clamped);
        const half = clamped % 1 >= 0.5 ? 1 : 0;
        const empty = 10 - full - half;
        return `<span class="rating-stars" aria-hidden="true">${'★'.repeat(full)}${half ? '⯨' : ''}${'☆'.repeat(empty)}</span>`;
    }

    /**
     * Извлечение русского названия фильма из строки
     */
    extractRussianTitle(filmString) {
        if (!filmString || typeof filmString !== 'string') {
            return filmString || '';
        }

        const parts = filmString.split('/');

        if (parts.length < 2) {
            return filmString.trim();
        }

        for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i].trim();
            if (/[а-яА-ЯёЁ]/.test(part)) {
                return part;
            }
        }

        return parts[parts.length - 1].trim();
    }

    /**
     * Генерация URL для КиноПоиска
     */
    generateKinopoiskUrl(filmName, filmYear) {
        if (!filmName) return null;
        const russianTitle = this.extractRussianTitle(filmName);
        const cleanName = russianTitle
            .replace(/[^\w\sа-яА-ЯёЁ]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const searchQuery = filmYear ? `${cleanName} ${filmYear}` : cleanName;
        const encodedQuery = encodeURIComponent(searchQuery);
        return `https://www.kinopoisk.ru/index.php?kp_query=${encodedQuery}`;
    }

    /**
     * Экранирование HTML
     */
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

/**
 * Инициализация модуля обсуждений
 */
function initDiscussionsModule() {
    console.log('Проверяем наличие секции film-archive...');
    if (document.querySelector('#film-archive')) {
        console.log('Секция film-archive найдена, инициализируем модуль...');
        window.discussionsModule = new DiscussionsModule();
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
