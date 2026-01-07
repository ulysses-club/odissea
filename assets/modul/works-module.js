/**
 * Модуль архива работ - независимая реализация
 * @class WorksModule
 */
class WorksModule {
    constructor() {
        this.config = {
            dataUrl: '../data/works.json',
            containerId: '#works-container',
            defaultPoster: '../images/default-poster.jpg',
            messages: {
                loading: 'Загрузка архива работ...',
                noWorks: 'Нет данных о работах'
            }
        };
        
        this.state = { works: [] };
        // Инициализируем сразу, не ждем DOMContentLoaded
        this.init();
    }

    /** Инициализация модуля */
    async init() {
        // Ждем полной загрузки DOM для надежности
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
    }

    /** Загрузка данных с резервными источниками */
    async loadData() {
        try {
            this.showLoading();
            const data = await this.fetchWithFallback();
            this.state.works = Array.isArray(data) ? data : [];
            
            // Если данные загрузились, но массив пуст - используем моковые данные
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

    /** Fetch с альтернативными путями */
    async fetchWithFallback() {
        const urls = [
            this.config.dataUrl,
            './data/works.json',
            '../modul/data/works.json'
        ];
        
        for (const url of urls) {
            try {
                console.log('Попытка загрузки работ из:', url);
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Данные успешно загружены из:', url, data);
                    return data;
                }
            } catch (e) {
                console.warn(`Не удалось загрузить ${url}:`, e);
            }
        }
        throw new Error('Все источники недоступны');
    }

    /** Демо-данные */
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

    /** Отображение состояния загрузки */
    showLoading() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="works-loading-message">
                <div class="works-spinner"></div>
                ${this.config.messages.loading}
            </div>
        `;
    }

    /** Отображение состояния ошибки */
    showError() {
        if (!this.container) return;
        this.container.innerHTML = `
            <p class="works-no-data">${this.config.messages.noWorks}</p>
        `;
    }

    /** Рендеринг всех работ */
    renderWorks() {
        if (!this.container) {
            console.error('Контейнер для работ не найден при рендеринге');
            return;
        }
        
        if (!this.state.works.length) {
            this.showError();
            return;
        }
        
        console.log('Рендеринг работ:', this.state.works.length);
        this.container.innerHTML = this.state.works
            .map(work => this.createWorkCard(work))
            .join('');
    }

    /** Создание HTML карточки работы */
    createWorkCard(work) {
        const title = work['Название'] || 'Неизвестная работа';
        const year = work['Год'] || '';
        const type = work['Тип'] || 'Работа';
        const videoUrl = work['Ссылка на видео'] || '#';
        const hasVideo = videoUrl && videoUrl !== '#' && !videoUrl.includes('undefined');
        const safeTitle = this.escapeHtml(title);
        const safeYear = this.escapeHtml(year);
        const safeType = this.escapeHtml(type);
        const description = work['Описание'] || '';
        
        return `
        <article class="film-card" role="article" aria-label="${safeType}: ${safeTitle}">
            <div class="film-card-image">
                <img src="${work['URL постера'] || this.config.defaultPoster}" 
                     alt="${safeType}: ${safeTitle} (${safeYear})" 
                     class="poster-image" 
                     loading="lazy"
                     onerror="this.src='${this.config.defaultPoster}'">
                <span class="work-type">${safeType}</span>
            </div>
            
            <div class="work-info">
                <div class="work-header">
                    ${year ? `<span class="work-year">${safeYear}</span>` : ''}
                    <span class="video-link">${hasVideo ? '🎬 Видео доступно' : '📺 Нет видео'}</span>
                </div>
                
                <h3>${safeTitle}</h3>
                
                ${description ? `
                <p class="work-description">${this.escapeHtml(description)}</p>
                ` : ''}
                
                <a href="${videoUrl}" 
                   ${hasVideo ? 'target="_blank" rel="noopener noreferrer"' : ''} 
                   class="film-kinopoisk-button"
                   ${!hasVideo ? 'style="pointer-events: none; cursor: default; opacity: 0.6;"' : ''}>
                    🎬 ${hasVideo ? 'Смотреть работу' : 'Нет видео'}
                </a>
            </div>
        </article>
        `;
    }

    /** Экранирование HTML для безопасности */
    escapeHtml(text) {
        if (text == null) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

/** Инициализация модуля при наличии контейнера */
function initWorksModule() {
    console.log('Инициализация WorksModule...');
    new WorksModule();
}

// Автоматическая инициализация - всегда вызываем
console.log('Запуск WorksModule инициализации...');
initWorksModule();

/** Инициализация модуля при наличии контейнера */
function initWorksModule() {
    if (document.querySelector('#works-container')) {
        new WorksModule();
    }
}

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorksModule);
} else {
    initWorksModule();
}
