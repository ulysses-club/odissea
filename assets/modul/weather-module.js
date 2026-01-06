class WeatherModule {
    constructor() {
        this.config = {
            apiKey: '8ebf62377e7ff596ad44ef69a1958f3f',
            city: 'Sevastopol',
            units: 'metric',
            lang: 'ru',
            updateInterval: 15 * 60 * 1000, // 15 минут
            cacheTime: 5 * 60 * 1000 // 5 минут кэша
        };

        this.state = {
            data: null,
            error: null,
            loading: false,
            expanded: false,
            lastUpdate: null
        };

        // Объект вместо switch/case
        this.icons = {
            '01': '☀️', '02': '⛅', '03': '☁️', '04': '☁️',
            '09': '🌧️', '10': '🌦️', '11': '⛈️', '13': '❄️', '50': '🌫️'
        };

        // Рекомендации по одежде
        this.recommendations = {
            hot: 'Легкая одежда, головной убор, вода',
            warm: 'Футболка, джинсы, легкая куртка',
            mild: 'Кофта, джинсы, ветровка',
            cool: 'Теплая кофта, куртка, шапка',
            cold: 'Термобелье, теплая куртка, шарф',
            freezing: 'Термобелье, пуховик, зимняя обувь'
        };

        console.log('WeatherModule: инициализация началась');
        this.init();
    }

    /**
     * Инициализация
     */
    init() {
        try {
            // Проверка требований в одном условии
            const shouldSkip = navigator.connection?.saveData ||
                navigator.connection?.effectiveType === 'slow-2g';
            if (shouldSkip) {
                console.log('Weather module skipped for data saving');
                return;
            }

            console.log('WeatherModule: создание виджета');
            this.createWidget();
            this.attachEvents();
            this.loadData();
            this.setupAutoUpdate();
            
            console.log('WeatherModule: инициализация завершена');
        } catch (error) {
            console.error('WeatherModule: ошибка инициализации', error);
        }
    }

    /**
     * Создание виджета
     */
    createWidget() {
        // Проверяем, не создан ли уже виджет
        const existingWidget = document.querySelector('.weather-widget');
        if (existingWidget && existingWidget.dataset.initialized === 'true') {
            this.widget = existingWidget;
            console.log('WeatherModule: виджет уже существует');
            return;
        }

        // Ищем существующий контейнер из HTML
        const weatherContainer = document.querySelector('.weather-widget');
        
        if (weatherContainer) {
            console.log('WeatherModule: найден существующий контейнер');
            this.widget = weatherContainer;
            
            // Очищаем и добавляем содержимое
            this.widget.innerHTML = '';
            const compactDiv = document.createElement('div');
            compactDiv.className = 'weather-compact';
            compactDiv.setAttribute('role', 'button');
            compactDiv.setAttribute('tabindex', '0');
            compactDiv.setAttribute('aria-label', 'Показать погоду');
            
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'weather-details';
            detailsDiv.setAttribute('aria-hidden', 'true');
            
            this.widget.appendChild(compactDiv);
            this.widget.appendChild(detailsDiv);
        } else {
            console.log('WeatherModule: создание нового виджета');
            // Создаем новый виджет
            const widget = document.createElement('div');
            widget.className = 'weather-widget';
            widget.innerHTML = `
                <div class="weather-compact" role="button" tabindex="0" aria-label="Показать погоду">
                    <span class="weather-icon">⏳</span>
                    <span class="weather-temp">--°</span>
                </div>
                <div class="weather-details" aria-hidden="true">
                    <!-- Динамически заполняется -->
                </div>
            `;

            // Вставляем в правильное место
            const headerInner = document.querySelector('.header__inner');
            const navContainer = document.querySelector('.nav-container');
            
            if (headerInner) {
                if (navContainer) {
                    // Вставляем перед навигацией
                    headerInner.insertBefore(widget, navContainer);
                } else {
                    // Добавляем перед кнопкой меню
                    const mobileBtn = document.querySelector('.mobile-menu-btn');
                    if (mobileBtn) {
                        headerInner.insertBefore(widget, mobileBtn);
                    } else {
                        headerInner.appendChild(widget);
                    }
                }
            }
            
            this.widget = widget;
        }
        
        // Помечаем как инициализированный
        this.widget.dataset.initialized = 'true';
        console.log('WeatherModule: виджет создан/обновлен');
    }

    /**
     * Загрузка данных
     */
    async loadData() {
        console.log('WeatherModule: загрузка данных начата');
        
        // Быстрая проверка кэша
        const cached = this.getCache();
        if (cached && Date.now() - cached.timestamp < this.config.cacheTime) {
            console.log('WeatherModule: используем кэш');
            this.updateState({ data: cached.data, error: null });
            this.render();
            return;
        }

        // Офлайн режим
        if (!navigator.onLine) {
            console.log('WeatherModule: офлайн режим');
            if (cached) {
                this.updateState({ data: cached.data, error: 'Офлайн (кэш)' });
            } else {
                this.updateState({ error: 'Нет подключения' });
            }
            this.render();
            return;
        }

        this.updateState({ loading: true });
        console.log('WeatherModule: запрос к API');

        try {
            const data = await this.fetchWeather();
            console.log('WeatherModule: данные получены', data);
            this.updateState({
                data,
                loading: false,
                error: null,
                lastUpdate: Date.now()
            });
            this.setCache(data);
        } catch (error) {
            console.error('WeatherModule: ошибка загрузки', error);
            this.handleError(error);
        } finally {
            this.updateState({ loading: false });
            this.render();
        }
    }

    /**
     * Запрос к API
     */
    async fetchWeather() {
        const { apiKey, city, units, lang } = this.config;
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${units}&lang=${lang}&appid=${apiKey}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });

            clearTimeout(timeout);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            // Быстрая валидация
            if (!data?.main?.temp || !data?.weather?.[0]) {
                throw new Error('Invalid data format');
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Таймаут запроса');
            }
            throw error;
        }
    }

    /**
     * Управление состоянием
     */
    updateState(updates) {
        Object.assign(this.state, updates);
        // Отложенный рендер для минимизации перерисовок
        if (!this.renderTimeout) {
            this.renderTimeout = setTimeout(() => {
                this.render();
                this.renderTimeout = null;
            }, 16);
        }
    }

    /**
     * Рендеринг
     */
    render() {
        if (!this.widget) {
            console.warn('WeatherModule: виджет не найден для рендеринга');
            return;
        }

        console.log('WeatherModule: рендеринг');
        this.renderCompact();
        if (this.state.expanded) {
            this.renderDetails();
        }
    }

    /**
     * Рендер компактного вида
     */
    renderCompact() {
        const compact = this.widget.querySelector('.weather-compact');
        if (!compact) return;

        let content = '';

        if (this.state.loading) {
            content = '<span class="weather-icon">⏳</span><span class="weather-temp">...</span>';
        } else if (this.state.error) {
            content = '<span class="weather-icon">⚠️</span><span class="weather-temp">--°</span>';
        } else if (this.state.data) {
            const icon = this.getIcon(this.state.data.weather[0].icon);
            const temp = Math.round(this.state.data.main.temp);
            content = `<span class="weather-icon">${icon}</span><span class="weather-temp">${temp}°</span>`;
        } else {
            content = '<span class="weather-icon">🌤️</span><span class="weather-temp">--°</span>';
        }

        compact.innerHTML = content;
    }

    /**
     * Рендер детального вида
     */
    renderDetails() {
        const details = this.widget.querySelector('.weather-details');
        if (!details) return;

        if (this.state.loading) {
            details.innerHTML = '<div class="weather-loading">Загрузка погоды...</div>';
            details.hidden = false;
            return;
        }

        if (this.state.error) {
            const isOffline = this.state.error.includes('подключения') || this.state.error.includes('Офлайн');
            details.innerHTML = `
                <div class="weather-error">
                    <p>${this.state.error}</p>
                    ${!isOffline ? '<button class="retry-btn" aria-label="Повторить">Обновить</button>' : ''}
                </div>
            `;
            details.hidden = false;
            return;
        }

        if (!this.state.data) {
            details.innerHTML = '<div class="weather-loading">Нет данных о погоде</div>';
            details.hidden = false;
            return;
        }

        const data = this.state.data;
        const temp = Math.round(data.main.temp);
        const feels = Math.round(data.main.feels_like);
        const icon = this.getIcon(data.weather[0].icon);
        const desc = data.weather[0].description;
        const rec = this.getRecommendation(temp);

        details.innerHTML = `
            <div class="weather-header">
                <h3>Погода в Севастополе</h3>
                <button class="close-btn" aria-label="Закрыть">×</button>
            </div>
            <div class="weather-main">
                <div class="weather-icon-large">${icon}</div>
                <div class="weather-temp-large">${temp}°</div>
                <div class="weather-desc">${desc}</div>
            </div>
            <div class="weather-stats">
                <div class="weather-stat">
                    <span class="stat-label">Ощущается</span>
                    <span class="stat-value">${feels}°</span>
                </div>
                <div class="weather-stat">
                    <span class="stat-label">Влажность</span>
                    <span class="stat-value">${data.main.humidity}%</span>
                </div>
                <div class="weather-stat">
                    <span class="stat-label">Ветер</span>
                    <span class="stat-value">${Math.round(data.wind.speed)} м/с</span>
                </div>
            </div>
            ${rec ? `<div class="weather-recommendation"><p>${rec}</p></div>` : ''}
            ${this.state.lastUpdate ?
                `<div class="weather-update">Обновлено: ${this.formatTime(this.state.lastUpdate)}</div>` : ''}
        `;
        details.hidden = false;
        
        // Обновляем обработчики событий для новых элементов
        this.setupDynamicEventListeners();
    }

    /**
     * Получение иконки
     */
    getIcon(iconCode) {
        return this.icons[iconCode.substring(0, 2)] || '🌤️';
    }

    /**
     * Рекомендации
     */
    getRecommendation(temp) {
        if (temp >= 25) return this.recommendations.hot;
        if (temp >= 18) return this.recommendations.warm;
        if (temp >= 10) return this.recommendations.mild;
        if (temp >= 0) return this.recommendations.cool;
        if (temp >= -10) return this.recommendations.cold;
        return this.recommendations.freezing;
    }

    /**
     * Форматирование времени
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Обработка ошибок
     */
    handleError(error) {
        const errorMap = {
            'AbortError': 'Таймаут запроса',
            'Failed to fetch': 'Нет подключения',
            'NetworkError': 'Проблемы с сетью',
            'TypeError': 'Ошибка сети'
        };

        this.updateState({
            error: errorMap[error.name] || errorMap[error.message] || 'Ошибка загрузки',
            data: this.getCache()?.data || null
        });
    }

    /**
     * Управление кэшем
     */
    setCache(data) {
        try {
            localStorage.setItem('weather_cache', JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('WeatherModule: не удалось сохранить кэш');
        }
    }

    getCache() {
        try {
            const cached = localStorage.getItem('weather_cache');
            return cached ? JSON.parse(cached) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Обработчики событий
     */
    attachEvents() {
        if (!this.widget) return;

        // Делегирование событий
        this.widget.addEventListener('click', (e) => {
            if (e.target.closest('.weather-compact')) {
                this.toggleDetails();
                e.stopPropagation();
            }
        });

        // Клавиатурные события
        this.widget.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.expanded) {
                this.closeDetails();
            }
            if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.weather-compact')) {
                e.preventDefault();
                this.toggleDetails();
            }
        });

        // Закрытие по клику снаружи
        document.addEventListener('click', (e) => {
            if (this.state.expanded && !this.widget.contains(e.target)) {
                this.closeDetails();
            }
        });

        // События сети
        window.addEventListener('online', () => {
            console.log('WeatherModule: онлайн, обновляем данные');
            this.loadData();
        });
        
        window.addEventListener('offline', () => {
            console.log('WeatherModule: офлайн');
            this.updateState({ error: 'Нет подключения' });
            this.render();
        });

        this.setupDynamicEventListeners();
    }

    /**
     * Динамические обработчики событий
     */
    setupDynamicEventListeners() {
        // Кнопка повтора
        const retryButton = this.widget.querySelector('.retry-btn');
        if (retryButton) {
            retryButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.loadData();
            });
        }

        // Кнопка закрытия
        const closeButton = this.widget.querySelector('.close-btn');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeDetails();
            });
        }
    }

    /**
     * Управление детальным видом
     */
    toggleDetails() {
        this.state.expanded = !this.state.expanded;
        this.widget.classList.toggle('expanded', this.state.expanded);
        
        const compact = this.widget.querySelector('.weather-compact');
        const details = this.widget.querySelector('.weather-details');
        
        if (compact) {
            compact.setAttribute('aria-expanded', this.state.expanded);
        }
        
        if (details) {
            details.setAttribute('aria-hidden', !this.state.expanded);
            if (this.state.expanded) {
                this.renderDetails();
            } else {
                details.hidden = true;
            }
        }
    }

    closeDetails() {
        this.state.expanded = false;
        this.widget.classList.remove('expanded');
        
        const compact = this.widget.querySelector('.weather-compact');
        const details = this.widget.querySelector('.weather-details');
        
        if (compact) {
            compact.setAttribute('aria-expanded', 'false');
        }
        
        if (details) {
            details.setAttribute('aria-hidden', 'true');
            details.hidden = true;
        }
    }

    /**
     * Настройка автообновления
     */
    setupAutoUpdate() {
        // Обновление по интервалу
        this.updateInterval = setInterval(() => {
            if (navigator.onLine) {
                console.log('WeatherModule: автоматическое обновление');
                this.loadData();
            }
        }, this.config.updateInterval);

        // Обновление при фокусе страницы
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && navigator.onLine) {
                console.log('WeatherModule: страница активна, обновляем');
                this.loadData();
            }
        });
    }

    /**
     * Очистка ресурсов
     */
    destroy() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.renderTimeout) clearTimeout(this.renderTimeout);
        
        // Удаляем обработчики событий
        const closeButton = this.widget?.querySelector('.close-btn');
        const retryButton = this.widget?.querySelector('.retry-btn');
        
        if (closeButton) {
            closeButton.replaceWith(closeButton.cloneNode(true));
        }
        
        if (retryButton) {
            retryButton.replaceWith(retryButton.cloneNode(true));
        }
        
        console.log('WeatherModule: уничтожен');
    }
}

/**
 * Инициализация модуля
 */
function initWeatherModule() {
    console.log('initWeatherModule: запуск');
    
    // Ждем полной загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded: инициализация WeatherModule');
            new WeatherModule();
        });
    } else {
        // Если DOM уже загружен
        console.log('DOM уже загружен: инициализация WeatherModule');
        new WeatherModule();
    }
}

// Экспорт для использования в других модулях
if (typeof window !== 'undefined') {
    window.WeatherModule = WeatherModule;
}

// Автоматическая инициализация
console.log('weather-module.js загружен');
initWeatherModule();
