/**
 * Модуль для управления секцией "Архив наших работ"
 */
class WorksModule {
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
     */
    async init() {
        console.log('Инициализация WorksModule...');
        this.cacheDOM();
        await this.loadData();
        this.renderWorks();
    }

    /**
     * Кэширование DOM элементов
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
     */
    createWorkCard(work) {
        const workName = work['Название'] || 'Неизвестная работа';
        const workYear = work['Год'] || '';
        const workType = work['Тип'] || 'Работа';
        const videoUrl = work['Ссылка на видео'] || '#';
        const hasVideo = videoUrl && videoUrl !== '#';

        return `
        <article class="film-poster" role="article" aria-labelledby="work-${this.escapeHtml(workName)}-title">
            <a href="${videoUrl}" 
               ${hasVideo ? 'target="_blank" rel="noopener noreferrer"' : ''} 
               class="video-link" 
               aria-label="${workType}: ${this.escapeHtml(workName)} (${workYear})"
               ${!hasVideo ? 'style="pointer-events: none; cursor: default;"' : ''}>
               
                <img src="${work['URL постера'] || this.config.defaults.poster}" 
                     alt="${workType}: ${this.escapeHtml(workName)} (${workYear})" 
                     class="poster-image" 
                     loading="lazy"
                     onerror="this.src='${this.config.defaults.poster}'">
                     
                <div class="play-overlay">
                    <div class="play-button" aria-hidden="true">▶</div>
                    <p class="watch-text">${this.config.messages.watchVideo}</p>
                </div>
            </a>
            <div class="work-info">
                <h3 id="work-${this.escapeHtml(workName)}-title">
                    ${this.escapeHtml(workName)} ${workYear ? `(${this.escapeHtml(workYear)})` : ''}
                </h3>
                ${work['Описание'] ? `<p class="work-description">${this.escapeHtml(work['Описание'])}</p>` : ''}
                ${workType ? `<p class="work-description"><strong>Тип:</strong> ${this.escapeHtml(workType)}</p>` : ''}
            </div>
        </article>
        `;
    }

    /**
     * Вспомогательные методы
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

// Инициализация модуля
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
