/** 
 * Модуль для управления секцией "Архив наших работ" 
 */
class WorksModule {
    /**
     * Конструктор класса WorksModule
     * Инициализирует конфигурацию, состояние и запускает модуль архива работ
     */
    constructor() {
        this.config = {
            dataSources: {
                works: '../data/works.json'
            },
            selectors: {
                worksContainer: '#works-container'
            },
            defaults: {
                poster: '../images/default-poster.jpg'
            },
            messages: {
                loading: 'Загрузка архива работ...',
                noWorks: 'Нет данных о работах',
                watchVideo: 'Смотреть видео'
            }
        };

        this.state = {
            works: []
        };

        this.init();
    }

    /**
     * Инициализация модуля
     * Кэширует DOM элементы, загружает данные и рендерит работы
     */
    async init() {
        console.log('Инициализация WorksModule...');
        this.cacheDOM();
        await this.loadData();
        this.renderWorks();
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

        console.log('Найденные элементы WorksModule:', this.elements);
    }

    /**
     * Загрузка данных из JSON
     * Загружает данные работ из JSON файла, обрабатывает ошибки и загружает демо-данные при необходимости
     */
    async loadData() {
        try {
            this.showLoadingState();
            console.log('Начинаем загрузку данных работ...');

            const data = await this.fetchLocalData();
            console.log('Получены данные работ:', data);

            this.state.works = Array.isArray(data) ? data : [];
            console.log(`Загружено работ: ${this.state.works.length}`);

        } catch (error) {
            console.error('Ошибка загрузки данных работ:', error);
            this.showErrorState();
            this.state.works = [];

            // Пробуем загрузить демо-данные
            try {
                console.log('Пробуем загрузить демо-данные работ...');
                const mockData = this.loadMockWorksData();
                this.state.works = mockData;
                console.log('Демо-данные работ загружены успешно');
            } catch (mockError) {
                console.error('Ошибка загрузки демо-данных работ:', mockError);
            }
        }
    }

    /**
     * Загрузка данных локально
     * Выполняет fetch-запрос к локальному JSON файлу с резервными путями
     * 
     * @returns {Promise<Array>} - Промис с массивом данных о работах
     */
    async fetchLocalData() {
        try {
            console.log('Пробуем загрузить локальные данные работ...');
            const response = await fetch(this.config.dataSources.works);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Локальные данные работ загружены:', data);
            return data;

        } catch (error) {
            console.error('Ошибка загрузки локальных данных работ:', error);

            // Пробуем альтернативный путь
            try {
                console.log('Пробуем альтернативный путь для работ...');
                const altResponse = await fetch('./data/works.json');

                if (!altResponse.ok) {
                    throw new Error(`Alternative HTTP error! status: ${altResponse.status}`);
                }

                const altData = await altResponse.json();
                console.log('Альтернативные данные работ загружены:', altData);
                return altData;

            } catch (altError) {
                console.error('Ошибка загрузки альтернативных данных работ:', altError);
                throw new Error('Все источники данных работ недоступны');
            }
        }
    }

    /**
     * Загрузка демонстрационных данных
     * Создает макет данных для демонстрации при недоступности основных источников
     * 
     * @returns {Array} - Массив демо-данных работ
     */
    loadMockWorksData() {
        console.log('Загрузка демо-данных работ');
        return [
            {
                "Название": "Трейлер фильма \"Всезон\"",
                "Год": "2025",
                "URL постера": "https://sun9-74.vkuserphoto.ru/s/v1/if2/gJZwQrAe5nCarK94hNFoA25f9Zv_7mignNKNvwBtJTrQiPsQXORo0rPVVSkOzq3myFV9YxXhrjDRQDEZGHacGb5n.jpg?quality=95&as=32x13,48x20,72x30,108x45,160x67,240x100,360x150,480x200,540x225,640x267,720x300,1080x450,1280x533,1440x600,2560x1067&from=bu&cs=2560x0",
                "Ссылка на видео": "https://vkvideo.ru/video-199046020_456239064?gid=199046020",
                "Тип": "Трейлер",
                "Описание": "Трейлер к короткометражному фильму участника киноклуба"
            }
        ];
    }

    /**
     * Показать состояние загрузки
     * Отображает индикатор загрузки в контейнере работ
     */
    showLoadingState() {
        if (this.elements.worksContainer) {
            this.elements.worksContainer.innerHTML = `
                <div class="works-loading-message">
                    <div class="works-spinner" aria-hidden="true"></div>
                    ${this.config.messages.loading}
                </div>
            `;
        }
    }

    /**
     * Показать состояние ошибки
     * Отображает сообщение об ошибке в контейнере работ
     */
    showErrorState() {
        if (this.elements.worksContainer) {
            this.elements.worksContainer.innerHTML = `
                <p class="works-no-data">${this.config.messages.noWorks}</p>
            `;
        }
    }

    /**
     * Рендеринг работ
     * Отображает все работы в контейнере или сообщение об отсутствии данных
     */
    renderWorks() {
        if (!this.elements.worksContainer) {
            console.error('Контейнер работ не найден!');
            return;
        }

        if (!this.state.works || !this.state.works.length) {
            console.log('Нет работ для отображения');
            this.elements.worksContainer.innerHTML = `<p class="works-no-data">${this.config.messages.noWorks}</p>`;
            return;
        }

        const worksHTML = this.state.works.map(work =>
            this.createWorkCard(work)
        ).join('');

        this.elements.worksContainer.innerHTML = worksHTML;
        console.log(`Отображено ${this.state.works.length} работ`);
    }

    /**
     * Создание карточки работы
     * Генерирует HTML разметку для карточки отдельной работы
     * 
     * @param {Object} work - Объект с данными о работе
     * @returns {string} - HTML строка карточки работы
     */
    createWorkCard(work) {
        const workName = work['Название'] || 'Неизвестная работа';
        const workYear = work['Год'] || '';
        const workType = work['Тип'] || 'Работа';
        const videoUrl = work['Ссылка на видео'] || '#';
        const hasVideo = videoUrl && videoUrl !== '#';

        return `
    <article class="film-card" role="article" aria-labelledby="work-${this.escapeHtml(workName)}-title">
        <div class="film-card-image">
            <img src="${work['URL постера'] || this.config.defaults.poster}" 
                 alt="${workType}: ${this.escapeHtml(workName)} (${workYear})" 
                 class="poster-image" 
                 loading="lazy"
                 onerror="this.src='${this.config.defaults.poster}'">
            
            <span class="work-type">${this.escapeHtml(workType)}</span>
            
        </div>
        
        <div class="work-info">
            <div class="work-header">
                ${workYear ? `<span class="work-year">${this.escapeHtml(workYear)}</span>` : ''}
                <span class="video-link">${hasVideo ? '🎬 Видео доступно' : '📺 Видео отсутствует'}</span>
            </div>
            
            <h3 id="work-${this.escapeHtml(workName)}-title">
                ${this.escapeHtml(workName)}
            </h3>
            
            ${work['Описание'] ? `<p class="work-description">${this.escapeHtml(work['Описание'])}</p>` : ''}
            
            <a href="${videoUrl}" 
               ${hasVideo ? 'target="_blank" rel="noopener noreferrer"' : ''} 
               class="film-kinopoisk-button"
               aria-label="${workType}: ${this.escapeHtml(workName)} (${workYear})"
               ${!hasVideo ? 'style="pointer-events: none; cursor: default; opacity: 0.5;"' : ''}>
                🎬 Смотреть работу
            </a>
        </div>
    </article>
    `;
    }

    /**
     * Экранирование HTML
     * Заменяет специальные символы HTML на их безопасные эквиваленты
     * 
     * @param {string} unsafe - Исходная небезопасная строка
     * @returns {string} - Безопасная экранированная строка
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
 * Функция инициализации модуля архива работ
 * Создает экземпляр WorksModule при наличии соответствующей секции
 */
function initWorksModule() {
    console.log('Проверяем наличие секции works-container...');
    if (document.querySelector('#works-container')) {
        console.log('Секция works-container найдена, инициализируем модуль...');
        new WorksModule();
    } else {
        console.log('Секция works-container НЕ найдена!');
    }
}

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
    console.log('DOM еще загружается, ждем DOMContentLoaded для WorksModule...');
    document.addEventListener('DOMContentLoaded', initWorksModule);
} else {
    console.log('DOM уже загружен, инициализируем WorksModule сразу...');
    initWorksModule();
}
