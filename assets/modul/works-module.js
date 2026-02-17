/**
 * Модуль архива работ
 * @class WorksModule
 * @description Отвечает за загрузку и отображение архива видеоработ киноклуба.
 * Управляет состоянием, рендерингом карточек и обработкой кликов по ссылкам.
 */
class WorksModule {
    constructor() {
        /**
         * Конфигурация модуля
         * @property {string} dataUrl - Основной путь к JSON с данными
         * @property {string} containerId - ID контейнера для вставки карточек
         * @property {string} defaultPoster - Путь к изображению-заглушке
         * @property {Object} messages - Текстовые сообщения для интерфейса
         */
        this.config = {
            dataUrl: '../data/works.json',
            containerId: '#works-container',
            defaultPoster: '../images/default-poster.jpg',
            messages: {
                loading: 'Загрузка архива работ...',
                noWorks: 'Нет данных о работах'
            }
        };
        
        /** @property {Object} state - Состояние модуля (массив загруженных работ) */
        this.state = { works: [] };
        this.init();
    }

    /**
     * Инициализация модуля
     * @async
     * @description Ожидает загрузки DOM, находит контейнер, загружает данные и рендерит карточки
     */
    async init() {
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        this.container = document.querySelector(this.config.containerId);
        if (!this.container) {
            console.warn('Контейнер для работ не найден:', this.config.containerId);
            return;
        }
        
        await this.loadData();
        this.renderWorks();
        this.attachClickHandlers();
    }

    /**
     * Загрузка данных
     * @async
     * @description Пытается загрузить данные из JSON, при ошибке или пустом массиве использует мок-данные
     */
    async loadData() {
        try {
            this.showLoading();
            const data = await this.fetchWithFallback();
            this.state.works = Array.isArray(data) ? data : [];
            
            if (this.state.works.length === 0) {
                console.warn('Получен пустой массив работ, используем демо-данные');
                this.state.works = this.getMockData();
            }
        } catch (error) {
            console.error('Ошибка загрузки работ:', error);
            this.showError();
            this.state.works = this.getMockData();
        }
    }

    /**
     * Запрос к API с резервными путями
     * @async
     * @description Последовательно пробует загрузить данные из разных источников
     * @returns {Promise<Array>} Массив работ
     * @throws {Error} Если все источники недоступны
     */
    async fetchWithFallback() {
        const urls = [
            this.config.dataUrl,
            './data/works.json',
            '../modul/data/works.json'
        ];
        
        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    return await response.json();
                }
            } catch (e) {
                console.warn(`Не удалось загрузить ${url}:`, e);
            }
        }
        throw new Error('Все источники недоступны');
    }

    /**
     * Получение мок-данных для демонстрации
     * @returns {Array} Массив тестовых работ
     */
    getMockData() {
        return [{
            "Название": "Трейлер фильма \"Всезон\"",
            "Год": "2025",
            "URL постера": "https://sun9-74.vkuserphoto.ru/s/v1/if2/gJZwQrAe5nCarK94hNFoA25f9Zv_7mignNKNvwBtJTrQiPsQXORo0rPVVSkOzq3myFV9YxXhrjDRQDEZGHacGb5n.jpg",
            "Ссылка на видео": "https://vkvideo.ru/video-199046020_456239064?gid=199046020",
            "Тип": "Трейлер",
            "Описание": "Трейлер к короткометражному фильму участника киноклуба"
        }, {
            "Название": "Документальный фильм о киноклубе",
            "Год": "2024",
            "URL постера": "https://via.placeholder.com/300x450/6a11cb/ffffff?text=Документальный",
            "Ссылка на видео": "https://vk.com/video-199046020_456239065",
            "Тип": "Документальный",
            "Описание": "Фильм о создании и работе нашего киноклуба"
        }];
    }

    /**
     * Отображение состояния загрузки
     * @description Показывает спиннер и сообщение о загрузке в контейнере
     */
    showLoading() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="works-loading-message">
                <div class="works-spinner"></div>
                ${this.config.messages.loading}
            </div>
        `;
    }

    /**
     * Отображение ошибки
     * @description Показывает сообщение об отсутствии данных
     */
    showError() {
        if (!this.container) return;
        this.container.innerHTML = `
            <p class="works-no-data">${this.config.messages.noWorks}</p>
        `;
    }

    /**
     * Рендеринг всех работ
     * @description Преобразует массив работ в HTML-карточки и вставляет в контейнер
     */
    renderWorks() {
        if (!this.container) return;
        
        if (!this.state.works.length) {
            this.showError();
            return;
        }
        
        this.container.innerHTML = this.state.works
            .map(work => this.createWorkCard(work))
            .join('');
    }

    /**
     * Прикрепление обработчиков кликов к кнопкам
     * @description Добавляет слушатели событий на кнопки для открытия ссылок через window.open
     */
    attachClickHandlers() {
        const buttons = this.container.querySelectorAll('.film-kinopoisk-button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const href = button.getAttribute('href');
                
                if (button.style.pointerEvents === 'none') {
                    e.preventDefault();
                    return;
                }
                
                if (href && href !== '#' && !href.includes('undefined')) {
                    e.preventDefault();
                    window.open(href, '_blank');
                } else {
                    e.preventDefault();
                }
            });
        });
    }

    /**
     * Создание HTML-карточки работы
     * @param {Object} work - Данные работы
     * @returns {string} HTML-разметка карточки
     */
    createWorkCard(work) {
        const title = work['Название'] || 'Неизвестная работа';
        const year = work['Год'] || '';
        const type = work['Тип'] || 'Работа';
        const videoUrl = work['Ссылка на видео'] || '#';
        const hasVideo = videoUrl && videoUrl !== '#' && !videoUrl.includes('undefined');
        const description = work['Описание'] || '';
        
        const buttonStyle = !hasVideo 
            ? 'style="pointer-events: none; cursor: not-allowed; opacity: 0.6;"' 
            : '';
        
        return `
        <article class="film-card" role="article" aria-label="${type}: ${title}">
            <div class="film-card-image">
                <img src="${work['URL постера'] || this.config.defaultPoster}" 
                     alt="${type}: ${title} (${year})" 
                     class="poster-image" 
                     loading="lazy"
                     onerror="this.src='${this.config.defaultPoster}'">
                <span class="work-type">${type}</span>
            </div>
            
            <div class="work-info">
                <div class="work-header">
                    ${year ? `<span class="work-year">${year}</span>` : ''}
                    <span class="video-link">${hasVideo ? '🎬 Видео доступно' : '📺 Нет видео'}</span>
                </div>
                
                <h3>${title}</h3>
                
                ${description ? `
                <p class="work-description">${description}</p>
                ` : ''}
                
                <a href="${videoUrl}" 
                   class="film-kinopoisk-button"
                   ${buttonStyle}>
                    🎬 ${hasVideo ? 'Смотреть работу' : 'Нет видео'}
                </a>
            </div>
        </article>
        `;
    }
}

/** 
 * Инициализация модуля при наличии контейнера
 * @function initWorksModule
 * @description Проверяет наличие контейнера и создает экземпляр WorksModule
 */
function initWorksModule() {
    if (document.querySelector('#works-container')) {
        new WorksModule();
    }
}

// Автоматическая инициализация в зависимости от состояния загрузки страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorksModule);
} else {
    initWorksModule();
}
