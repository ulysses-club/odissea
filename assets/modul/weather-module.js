/**
 * Модуль виджета погоды для киноклуба Одиссея
 */
class WeatherModule {
    constructor() {
        this.config = {
            apiKey: '8ebf62377e7ff596ad44ef69a1958f3f',
            city: 'Sevastopol',
            country: 'UA',
            units: 'metric',
            lang: 'ru',
            updateInterval: 900000, // 15 минут
            cacheTimeout: 300000 // 5 минут
        };
        
        this.state = {
            isExpanded: false,
            isLoading: false,
            lastUpdate: null,
            weatherData: null,
            error: null
        };
        
        this.icons = {
            '01d': '☀️', '01n': '🌙',
            '02d': '⛅', '02n': '☁️',
            '03d': '☁️', '03n': '☁️',
            '04d': '☁️', '04n': '☁️',
            '09d': '🌧️', '09n': '🌧️',
            '10d': '🌦️', '10n': '🌦️',
            '11d': '⛈️', '11n': '⛈️',
            '13d': '❄️', '13n': '❄️',
            '50d': '🌫️', '50n': '🌫️'
        };
        
        this.init();
    }

    /**
     * Инициализация модуля погоды
     */
    init() {
        this.createWidget();
        this.loadWeatherData();
        this.setupAutoUpdate();
        this.setupEventListeners();
    }

    /**
     * Создание HTML структуры виджета
     */
    createWidget() {
        // Проверяем, не создан ли уже виджет
        if (document.querySelector('.weather-widget')) {
            this.widget = document.querySelector('.weather-widget');
            return;
        }

        const widget = document.createElement('div');
        widget.className = 'weather-widget';
        widget.innerHTML = this.getWidgetHTML();
        
        // Вставляем виджет после логотипа
        const logo = document.querySelector('.logo');
        if (logo && logo.parentNode) {
            logo.parentNode.insertBefore(widget, logo.nextSibling);
        } else {
            // Fallback: вставляем в header
            const header = document.querySelector('.header');
            if (header) {
                header.appendChild(widget);
            }
        }
        
        this.widget = widget;
    }

    /**
     * Генерация HTML для компактного виджета
     */
    getWidgetHTML() {
        return `
            <div class="weather-compact">
                ${this.getCompactContent()}
            </div>
            <div class="weather-details">
                ${this.getDetailsContent()}
            </div>
        `;
    }

    /**
     * Генерация компактного контента
     */
    getCompactContent() {
        if (this.state.isLoading) {
            return `
                <div class="weather-loading">
                    <div class="spinner"></div>
                </div>
            `;
        }

        if (this.state.error || !this.state.weatherData) {
            return `
                <div class="weather-icon">🌤️</div>
                <div class="weather-temp">--°</div>
            `;
        }

        const data = this.state.weatherData;
        const icon = this.icons[data.weather[0].icon] || '🌤️';

        return `
            <div class="weather-icon">${icon}</div>
            <div class="weather-temp">${Math.round(data.main.temp)}°</div>
        `;
    }

    /**
     * Генерация детального контента
     */
    getDetailsContent() {
        if (this.state.isLoading) {
            return `
                <div class="weather-loading">
                    <div class="spinner"></div>
                    <p>Загрузка погоды...</p>
                </div>
            `;
        }

        if (this.state.error) {
            return `
                <div class="weather-error">
                    <p>${this.state.error}</p>
                    <button class="retry-button">Обновить</button>
                </div>
            `;
        }

        if (!this.state.weatherData) {
            return `
                <div class="weather-loading">
                    <div class="spinner"></div>
                    <p>Обновление погоды...</p>
                </div>
            `;
        }

        const data = this.state.weatherData;
        const icon = this.icons[data.weather[0].icon] || '🌤️';
        const clothingRec = this.getClothingRecommendation();

        return `
            <div class="weather-header">
                <h3 class="weather-title">Погода в Севастополе</h3>
                <button class="weather-close" aria-label="Закрыть">×</button>
            </div>
            <div class="weather-content">
                <div class="weather-main-icon">${icon}</div>
                <div class="weather-main-temp">${Math.round(data.main.temp)}°</div>
                <div class="weather-description">${data.weather[0].description}</div>
            </div>
            <div class="weather-stats">
                <div class="weather-stat weather-feels-like">
                    <div class="stat-value">${Math.round(data.main.feels_like)}°</div>
                    <div class="stat-label">Ощущается</div>
                </div>
                <div class="weather-stat weather-wind">
                    <div class="stat-value">${Math.round(data.wind.speed)} м/с</div>
                    <div class="stat-label">Ветер</div>
                </div>
                <div class="weather-stat weather-humidity">
                    <div class="stat-value">${data.main.humidity}%</div>
                    <div class="stat-label">Влажность</div>
                </div>
                <div class="weather-stat weather-pressure">
                    <div class="stat-value">${Math.round(data.main.pressure * 0.75)}</div>
                    <div class="stat-label">мм рт.ст.</div>
                </div>
            </div>
            ${clothingRec ? `
                <div class="weather-recommendation">
                    <div class="recommendation-title">
                        <span>👕</span>
                        <span>Что надеть:</span>
                    </div>
                    <div class="recommendation-text">${clothingRec}</div>
                </div>
            ` : ''}
        `;
    }

    /**
     * Загрузка данных о погоде
     */
    async loadWeatherData() {
        // Проверка кэша
        if (this.shouldUseCache()) {
            this.updateDisplay();
            return;
        }

        this.state.isLoading = true;
        this.state.error = null;
        this.updateDisplay();

        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${this.config.city},${this.config.country}&units=${this.config.units}&lang=${this.config.lang}&appid=${this.config.apiKey}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            this.state.weatherData = data;
            this.state.lastUpdate = Date.now();
            this.state.isLoading = false;
            
            // Сохранение в localStorage
            localStorage.setItem('weatherCache', JSON.stringify({
                data: data,
                timestamp: this.state.lastUpdate
            }));
            
        } catch (error) {
            console.error('Ошибка загрузки погоды:', error);
            this.state.error = this.getErrorMessage(error);
            this.state.isLoading = false;
            
            // Попытка использовать кэш при ошибке
            const cache = this.getCachedData();
            if (cache) {
                this.state.weatherData = cache.data;
                this.state.lastUpdate = cache.timestamp;
                this.state.error = null;
            }
        }

        this.updateDisplay();
    }

    /**
     * Получение понятного сообщения об ошибке
     */
    getErrorMessage(error) {
        if (error.message.includes('404')) {
            return 'Город не найден';
        } else if (error.message.includes('401')) {
            return 'Ошибка API ключа';
        } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
            return 'Нет подключения';
        } else {
            return 'Ошибка загрузки';
        }
    }

    /**
     * Проверка возможности использования кэша
     */
    shouldUseCache() {
        const cache = this.getCachedData();
        if (cache && (Date.now() - cache.timestamp) < this.config.cacheTimeout) {
            this.state.weatherData = cache.data;
            this.state.lastUpdate = cache.timestamp;
            return true;
        }
        return false;
    }

    /**
     * Получение данных из кэша
     */
    getCachedData() {
        try {
            const cache = localStorage.getItem('weatherCache');
            return cache ? JSON.parse(cache) : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Обновление отображения виджета
     */
    updateDisplay() {
        if (!this.widget) return;

        const compactElement = this.widget.querySelector('.weather-compact');
        const detailsElement = this.widget.querySelector('.weather-details');

        if (compactElement) {
            compactElement.innerHTML = this.getCompactContent();
        }

        if (detailsElement) {
            detailsElement.innerHTML = this.getDetailsContent();
        }

        this.setupDynamicEventListeners();
    }

    /**
     * Настройка автоматического обновления
     */
    setupAutoUpdate() {
        setInterval(() => {
            this.loadWeatherData();
        }, this.config.updateInterval);
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Открытие/закрытие деталей погоды
        this.widget.addEventListener('click', (e) => {
            const compact = this.widget.querySelector('.weather-compact');
            if (compact && compact.contains(e.target)) {
                this.toggleDetails();
            }
        });

        // Закрытие по клику вне виджета
        document.addEventListener('click', (e) => {
            if (!this.widget.contains(e.target) && this.state.isExpanded) {
                this.closeDetails();
            }
        });

        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isExpanded) {
                this.closeDetails();
            }
        });

        this.setupDynamicEventListeners();
    }

    /**
     * Настройка динамических обработчиков событий
     */
    setupDynamicEventListeners() {
        const retryButton = this.widget.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.loadWeatherData();
            });
        }

        const closeButton = this.widget.querySelector('.weather-close');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeDetails();
            });
        }
    }

    /**
     * Переключение отображения деталей
     */
    toggleDetails() {
        this.state.isExpanded = !this.state.isExpanded;
        this.widget.classList.toggle('expanded', this.state.isExpanded);
    }

    /**
     * Закрытие деталей
     */
    closeDetails() {
        this.state.isExpanded = false;
        this.widget.classList.remove('expanded');
    }

    /**
     * Получение рекомендаций по одежде
     */
    getClothingRecommendation() {
        if (!this.state.weatherData) return '';

        const temp = this.state.weatherData.main.temp;
        const weather = this.state.weatherData.weather[0].main;
        const wind = this.state.weatherData.wind.speed;

        let recommendation = '';

        // Рекомендации по температуре
        if (temp >= 25) {
            recommendation = 'Легкая одежда, шорты, футболка, головной убор от солнца';
        } else if (temp >= 18) {
            recommendation = 'Футболка, легкая куртка или кофта';
        } else if (temp >= 10) {
            recommendation = 'Теплая кофта, ветровка, джинсы';
        } else if (temp >= 0) {
            recommendation = 'Пальто, шапка, шарф, перчатки';
        } else {
            recommendation = 'Теплая зимняя одежда, термобелье';
        }

        // Дополнительные рекомендации
        if (weather === 'Rain') {
            recommendation += ', зонт или дождевик, непромокаемая обувь';
        } else if (weather === 'Snow') {
            recommendation += ', зимняя обувь с противоскользящей подошвой';
        }

        if (wind > 8) {
            recommendation += ', ветровка или куртка от ветра';
        }

        return recommendation;
    }
}

/**
 * Инициализация модуля погоды
 */
function initWeatherModule() {
    try {
        new WeatherModule();
        console.log('Модуль погоды инициализирован');
    } catch (error) {
        console.error('Ошибка инициализации модуля погоды:', error);
    }
}

// Автоматическая инициализация при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeatherModule);
} else {
    initWeatherModule();
}
