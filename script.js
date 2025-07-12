document.addEventListener('DOMContentLoaded', () => {
    // Конфигурация приложения
    const CONFIG = {
        sheets: {
            films: {
                id: '1a6EWO5ECaI1OveO4Gy7y9zH5LjFtlm8Alg9iSRP2heE',
                name: 'Films'
            },
            works: {
                id: '1KYU9mYAS5Wv6a9z-RImNxyP0n0Tpgf7BDRl2sNeSXmM',
                name: 'Video'
            }
        },
        defaults: {
            poster: 'images/default-poster.jpg',
            ratingPrecision: 1,
            maxRating: 10
        },
        selectors: {
            modal: '#modal',
            openModal: '#openModal',
            closeModal: '.close',
            filmForm: '#film-suggestion-form',
            formThanks: '#form-thanks',
            filmsContainer: '#films-container',
            worksContainer: '#works-container'
        },
        messages: {
            loading: 'Загрузка данных...',
            noData: 'Нет данных',
            noFilms: 'Нет данных о фильмах',
            noWorks: 'Нет данных о работах',
            connectionError: 'Проблема с подключением к интернету',
            genericError: 'Не удалось загрузить данные',
            retry: 'Попробовать снова'
        }
    };

    // DOM элементы
    const DOM = {
        modal: document.querySelector(CONFIG.selectors.modal),
        openModalBtn: document.querySelector(CONFIG.selectors.openModal),
        closeModalBtn: document.querySelector(CONFIG.selectors.closeModal),
        filmForm: document.querySelector(CONFIG.selectors.filmForm),
        formThanks: document.querySelector(CONFIG.selectors.formThanks),
        filmsContainer: document.querySelector(CONFIG.selectors.filmsContainer),
        worksContainer: document.querySelector(CONFIG.selectors.worksContainer)
    };

    // Инициализация модального окна
    const initModal = () => {
        if (!DOM.modal || !DOM.openModalBtn || !DOM.closeModalBtn) return;

        const showModal = () => DOM.modal.style.display = 'block';
        const hideModal = () => DOM.modal.style.display = 'none';
        const handleOutsideClick = (e) => e.target === DOM.modal && hideModal();

        DOM.openModalBtn.addEventListener('click', showModal);
        DOM.closeModalBtn.addEventListener('click', hideModal);
        window.addEventListener('click', handleOutsideClick);
    };

    // Обработка формы предложения фильма
    const initFilmForm = () => {
        if (!DOM.filmForm || !DOM.formThanks) return;

        const handleSubmit = (e) => {
            e.preventDefault();

            DOM.filmForm.style.display = 'none';
            DOM.formThanks.style.display = 'block';
            DOM.filmForm.reset();

            setTimeout(() => {
                DOM.filmForm.style.display = 'block';
                DOM.formThanks.style.display = 'none';
            }, 3000);
        };

        DOM.filmForm.addEventListener('submit', handleSubmit);
    };

    // Вспомогательные функции
    const Utils = {
        showLoading: (container) => {
            container.innerHTML = `<div class="loading-message">${CONFIG.messages.loading}</div>`;
            container.classList.add('loading');
        },

        showError: (container, error, retryFunction) => {
            console.error('Ошибка загрузки:', error);

            const message = error.message.includes('Failed to fetch')
                ? CONFIG.messages.connectionError
                : error.message || CONFIG.messages.genericError;

            container.innerHTML = `
                <div class="error-message">
                    <p>${CONFIG.messages.genericError}</p>
                    <p>${message}</p>
                    <button class="retry-button" onclick="${retryFunction}()">
                        ${CONFIG.messages.retry}
                    </button>
                </div>
            `;
            container.classList.remove('loading');
        },

        fetchSheetData: async (sheetId, sheetName) => {
            const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (!data?.length) {
                throw new Error(CONFIG.messages.noData);
            }

            return data;
        },

        createRatingStars: (rating) => {
            const num = parseFloat(rating) || 0;
            const clamped = Math.min(Math.max(num, 0), CONFIG.maxRating);
            const full = Math.floor(clamped);
            const half = clamped % 1 >= 0.5 ? 1 : 0;

            return '★'.repeat(full) +
                   (half ? '½' : '') +
                   '☆'.repeat(CONFIG.maxRating - full - half);
        }
    };

    // Функции рендеринга
    const Render = {
        films: (films, container) => {
            if (!films.length) {
                container.innerHTML = `<p>${CONFIG.messages.noFilms}</p>`;
                return;
            }

            container.innerHTML = films.map(film => `
                <div class="film-card" role="article">
                    <img src="${film['Постер URL'] || CONFIG.defaults.poster}"
                         alt="${film['Название']} (${film['Год']})"
                         class="film-thumbnail"
                         onerror="this.src='${CONFIG.defaults.poster}'"
                         loading="lazy">
                    <h3>${film['Название']} (${film['Год']})</h3>
                    <p>Обсуждение ${film['Номер обсуждения'] || 'N/A'} (${film['Дата'] || 'дата неизвестна'})</p>
                    <div class="film-rating"
                         title="Рейтинг: ${(parseFloat(film['Рейтинг']) || 0).toFixed(CONFIG.defaults.ratingPrecision)}">
                        ${Utils.createRatingStars(film['Рейтинг'])}
                    </div>
                </div>
            `).join('');
        },

        works: (works, container) => {
            if (!works.length) {
                container.innerHTML = `<p>${CONFIG.messages.noWorks}</p>`;
                return;
            }

            container.innerHTML = works.map(work => `
                <div class="film-poster" role="article">
                    <a href="${work['Ссылка на видео']}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="video-link">
                        <img src="${work['URL постера'] || CONFIG.defaults.poster}"
                             alt="${work['Название']} (${work['Год']})"
                             class="poster-image"
                             onerror="this.src='${CONFIG.defaults.poster}'"
                             loading="lazy">
                        <div class="play-overlay">
                            <div class="play-button" aria-hidden="true">▶</div>
                            <p class="watch-text">${work['Тип'] || 'Работа'}: "${work['Название']}" (${work['Год']})</p>
                        </div>
                    </a>
                    ${work['Описание'] ? `<p class="work-description">${work['Описание']}</p>` : ''}
                </div>
            `).join('');
        }
    };

    // Функции загрузки данных
    const DataLoader = {
        films: async () => {
            if (!DOM.filmsContainer) return;

            try {
                Utils.showLoading(DOM.filmsContainer);
                const data = await Utils.fetchSheetData(
                    CONFIG.sheets.films.id,
                    CONFIG.sheets.films.name
                );
                Render.films(data, DOM.filmsContainer);
            } catch (error) {
                Utils.showError(DOM.filmsContainer, error, 'DataLoader.films');
            } finally {
                DOM.filmsContainer.classList.remove('loading');
            }
        },

        works: async () => {
            if (!DOM.worksContainer) return;

            try {
                Utils.showLoading(DOM.worksContainer);
                const data = await Utils.fetchSheetData(
                    CONFIG.sheets.works.id,
                    CONFIG.sheets.works.name
                );
                Render.works(data, DOM.worksContainer);
            } catch (error) {
                Utils.showError(DOM.worksContainer, error, 'DataLoader.works');
            } finally {
                DOM.worksContainer.classList.remove('loading');
            }
        }
    };

    // Публичный API
    window.App = {
        reloadFilms: DataLoader.films,
        reloadWorks: DataLoader.works
    };

    // Инициализация приложения
    const initApp = () => {
        initModal();
        initFilmForm();
        DataLoader.films();
        DataLoader.works();
    };

    initApp();
});