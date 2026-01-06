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
        this.init();
    }

    /** Инициализация модуля */
    async init() {
        this.container = document.querySelector(this.config.containerId);
        if (!this.container) return;
        
        await this.loadData();
        this.renderWorks();
    }

    /** Загрузка данных с резервными источниками */
    async loadData() {
        try {
            this.showLoading();
            const data = await this.fetchWithFallback();
            this.state.works = Array.isArray(data) ? data : [];
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
                const response = await fetch(url);
                if (response.ok) return await response.json();
            } catch (e) {
                console.warn(`Не удалось загрузить ${url}`);
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
        if (!this.container || !this.state.works.length) {
            this.showError();
            return;
        }
        
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
        const hasVideo = videoUrl && videoUrl !== '#';
        const safeTitle = this.escapeHtml(title);
        const safeYear = this.escapeHtml(year);
        const safeType = this.escapeHtml(type);
        
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
                
                ${work['Описание'] ? `
                <p class="work-description">${this.escapeHtml(work['Описание'])}</p>
                ` : ''}
                
                <a href="${videoUrl}" 
                   ${hasVideo ? 'target="_blank" rel="noopener noreferrer"' : ''} 
                   class="film-kinopoisk-button"
                   ${!hasVideo ? 'style="pointer-events: none; cursor: default;"' : ''}>
                    🎬 Смотреть работу
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
