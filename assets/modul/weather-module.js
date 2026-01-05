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
            error: null,
            isOnline: navigator.onLine
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

        // Кэш для предсказаний
        this.recommendations = {
            hot: [
                "Легкая одежда, шорты, футболка",
                "Головной убор от солнца",
                "Солнцезащитные очки",
                "Вода для питья"
            ],
            warm: [
                "Футболка или легкая рубашка",
                "Джинсы или шорты",
                "Легкая куртка на вечер"
            ],
            mild: [
                "Джинсы или брюки",
                "Кофта или свитер",
                "Ветровка или легкая куртка"
            ],
            cool: [
                "Теплая кофта",
                "Джинсы или утепленные брюки",
                "Куртка, шапка"
            ],
            cold: [
                "Термобелье",
                "Теплая куртка или пальто",
                "Шарф, перчатки, шапка"
            ],
            freezing: [
                "Термобелье обязательно",
                "Пуховик или зимняя куртка",
                "Теплая обувь, шапка, шарф, перчатки"
            ]
        };
        
        this.init();
    }

    /**
     * Инициализация модуля погоды
     */
    init() {
        if (!this.checkRequirements()) return;
        
        this.createWidget();
        this.setupEventListeners();
        this.loadWeatherData();
        this.setupAutoUpdate();
    }

    /**
     * Проверка требований
     */
    checkRequirements() {
        // Проверка на мобильных устройствах с медленным интернетом
        if (navigator.connection) {
            const connection = navigator.connection;
            if (connection.saveData || connection.effectiveType === 'slow-2g') {
                console.log('Модуль погоды отключен для экономии трафика');
                return false;
            }
        }
        return true;
    }

    /**
     * Создание HTML структуры виджета
     */
    createWidget() {
        if (document.querySelector('.weather-widget')) {
            this.widget = document.querySelector('.weather-widget');
            return;
        }

        const widget = document.createElement('div');
        widget.className = 'weather-widget';
        widget.setAttribute('aria-label', 'Виджет погоды');
        widget.innerHTML = this.getWidgetHTML();
        
        // Оптимизированное размещение в header
        const header = document.querySelector('.header');
        if (header) {
            const navContainer = header.querySelector('.nav-container');
            if (navContainer) {
                header.insertBefore(widget, navContainer);
            } else {
                header.appendChild(widget);
            }
        }
        
        this.widget = widget;
    }

    /**
     * Генерация HTML для виджета
     */
    getWidgetHTML() {
        return `
            <div class="weather-compact" role="button" tabindex="0" 
                 aria-label="Показать детали погоды" aria-expanded="false">
                ${this.getCompactContent()}
            </div>
            <div class="weather-details" role="dialog" aria-modal="true" aria-label="Детали погоды">
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
                <div class="weather-loading" aria-live="polite">
                    <div class="spinner" aria-hidden="true"></div>
                </div>
            `;
        }

        if (this.state.error || !this.state.weatherData) {
            return `
                <div class="weather-icon" aria-hidden="true">🌤️</div>
                <div class="weather-temp">--°</div>
            `;
        }

        const data = this.state.weatherData;
        const icon = this.icons[data.weather[0].icon] || '🌤️';
        const temp = Math.round(data.main.temp);

        return `
            <div class="weather-icon" aria-hidden="true">${icon}</div>
            <div class="weather-temp" aria-label="Температура ${temp} градусов">${temp}°</div>
        `;
    }

    /**
     * Генерация детального контента
     */
    getDetailsContent() {
        if (this.state.isLoading) {
            return `
                <div class="weather-loading" aria-live="polite">
                    <div class="spinner" aria-hidden="true"></div>
                    <p>Загрузка погоды...</p>
                </div>
            `;
        }

        if (this.state.error) {
            const isOffline = !this.state.isOnline || this.state.error.includes('сети');
            return `
                <div class="weather-error">
                    <p>${isOffline ? 'Нет подключения к интернету' : this.state.error}</p>
                    ${isOffline ? '' : '<button class="retry-button" aria-label="Повторить попытку">Обновить</button>'}
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
        const temp = Math.round(data.main.temp);
        const feelsLike = Math.round(data.main.feels_like);
        const wind = Math.round(data.wind.speed);
        const humidity = data.main.humidity;
        const pressure = Math.round(data.main.pressure * 0.75);
        const clothingRec = this.getClothingRecommendation();

        return `
            <div class="weather-header">
                <h3 class="weather-title">Погода в Севастополе</h3>
                <button class="weather-close" aria-label="Закрыть детали погоды">×</button>
            </div>
            <div class="weather-content">
                <div class="weather-main-icon" aria-hidden="true">${icon}</div>
                <div class="weather-main-temp">${temp}°</div>
                <div class="weather-description">${data.weather[0].description}</div>
            </div>
            <div class="weather-stats">
                <div class="weather-stat weather-feels-like">
                    <div class="stat-value">${feelsLike}°</div>
                    <div class="stat-label">Ощущается</div>
                </div>
                <div class="weather-stat weather-wind">
                    <div class="stat-value">${wind} м/с</div>
                    <div class="stat-label">Ветер</div>
                </div>
                <div class="weather-stat weather-humidity">
                    <div class="stat-value">${humidity}%</div>
                    <div class="stat-label">Влажность</div>
                </div>
                <div class="weather-stat weather-pressure">
                    <div class="stat-value">${pressure}</div>
                    <div class="stat-label">мм рт.ст.</div>
                </div>
            </div>
            ${clothingRec ? `
                <div class="weather-recommendation">
                    <div class="recommendation-title">
                        <span aria-hidden="true">👕</span>
                        <span>Рекомендации:</span>
                    </div>
                    <div class="recommendation-text">${clothingRec}</div>
                </div>
            ` : ''}
            ${this.state.lastUpdate ? `
                <div class="weather-footer">
                    <small>Обновлено: ${this.formatUpdateTime()}</small>
                </div>
            ` : ''}
        `;
    }

    /**
     * Форматирование времени обновления
     */
    formatUpdateTime() {
        if (!this.state.lastUpdate) return '';
        
        const date = new Date(this.state.lastUpdate);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} ${this.getPlural(diffMins, 'минуту', 'минуты', 'минут')} назад`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} ${this.getPlural(diffHours, 'час', 'часа', 'часов')} назад`;
        
        return date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    /**
     * Получение правильной формы слова
     */
    getPlural(number, one, two, five) {
        const n = Math.abs(number) % 100;
        if (n >= 5 && n <= 20) return five;
        switch (n % 10) {
            case 1: return one;
            case 2: case 3: case 4: return two;
            default: return five;
        }
    }

    /**
     * Загрузка данных о погоде с оптимизациями
     */
    async loadWeatherData() {
        // Проверка кэша и сети
        if (this.shouldUseCache()) {
            this.updateDisplay();
            return;
        }

        // Проверка подключения
        if (!navigator.onLine) {
            this.state.isOnline = false;
            this.state.error = 'Нет подключения к сети';
            this.updateDisplay();
            return;
        }

        this.state.isLoading = true;
        this.state.error = null;
        this.state.isOnline = true;
        this.updateDisplay();

        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${this.config.city},${this.config.country}&units=${this.config.units}&lang=${this.config.lang}&appid=${this.config.apiKey}`;
            
            // Таймаут запроса
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(url, { 
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Валидация данных
            if (!data.main || !data.weather || !data.weather[0]) {
                throw new Error('Неверный формат данных погоды');
            }
            
            this.state.weatherData = data;
            this.state.lastUpdate = Date.now();
            this.state.isLoading = false;
            
            // Сохранение в кэш
            this.saveToCache(data);
            
        } catch (error) {
            console.warn('Ошибка загрузки погоды:', error);
            this.handleLoadError(error);
        } finally {
            this.state.isLoading = false;
            this.updateDisplay();
        }
    }

    /**
     * Обработка ошибок загрузки
     */
    handleLoadError(error) {
        // Определение типа ошибки
        if (error.name === 'AbortError') {
            this.state.error = 'Таймаут запроса';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
            this.state.error = 'Нет подключения к сети';
            this.state.isOnline = false;
        } else if (error.message.includes('404')) {
            this.state.error = 'Город не найден';
        } else if (error.message.includes('401')) {
            this.state.error = 'Ошибка API ключа';
        } else {
            this.state.error = 'Ошибка загрузки';
        }

        // Попытка использовать кэш
        const cache = this.getCachedData();
        if (cache) {
            this.state.weatherData = cache.data;
            this.state.lastUpdate = cache.timestamp;
            this.state.error = null;
        }
    }

    /**
     * Сохранение в кэш
     */
    saveToCache(data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem('weatherCache', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Не удалось сохранить в кэш:', error);
        }
    }

    /**
     * Проверка возможности использования кэша
     */
    shouldUseCache() {
        const cache = this.getCachedData();
        if (!cache) return false;
        
        const cacheAge = Date.now() - cache.timestamp;
        const shouldUpdate = cacheAge > this.config.cacheTimeout;
        
        // Если есть свежий кэш, используем его сразу
        if (!shouldUpdate) {
            this.state.weatherData = cache.data;
            this.state.lastUpdate = cache.timestamp;
            return true;
        }
        
        // Если кэш устарел, но мы офлайн - все равно используем его
        if (!navigator.onLine) {
            this.state.weatherData = cache.data;
            this.state.lastUpdate = cache.timestamp;
            this.state.error = 'Данные из кэша (офлайн)';
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
            if (!cache) return null;
            
            const parsed = JSON.parse(cache);
            if (!parsed.data || !parsed.timestamp) return null;
            
            return parsed;
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
        // Обновление при возвращении онлайн
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            this.loadWeatherData();
        });

        window.addEventListener('offline', () => {
            this.state.isOnline = false;
            this.state.error = 'Нет подключения к сети';
            this.updateDisplay();
        });

        // Периодическое обновление
        setInterval(() => {
            if (navigator.onLine) {
                this.loadWeatherData();
            }
        }, this.config.updateInterval);
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        if (!this.widget) return;

        // Открытие/закрытие деталей погоды
        this.widget.addEventListener('click', (e) => {
            const compact = this.widget.querySelector('.weather-compact');
            if (compact && compact.contains(e.target)) {
                this.toggleDetails();
                e.stopPropagation();
            }
        });

        // Клавиши для accessibility
        this.widget.addEventListener('keydown', (e) => {
            const compact = this.widget.querySelector('.weather-compact');
            if (compact && compact === e.target) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleDetails();
                }
                if (e.key === 'Escape' && this.state.isExpanded) {
                    this.closeDetails();
                }
            }
        });

        // Закрытие по клику вне виджета
        document.addEventListener('click', (e) => {
            if (!this.widget.contains(e.target) && this.state.isExpanded) {
                this.closeDetails();
            }
        });

        this.setupDynamicEventListeners();
    }

    /**
     * Настройка динамических обработчиков событий
     */
    setupDynamicEventListeners() {
        // Кнопка повтора
        const retryButton = this.widget.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.loadWeatherData();
            });
        }

        // Кнопка закрытия
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
        
        const compact = this.widget.querySelector('.weather-compact');
        if (compact) {
            compact.setAttribute('aria-expanded', this.state.isExpanded);
        }
    }

    /**
     * Закрытие деталей
     */
    closeDetails() {
        this.state.isExpanded = false;
        this.widget.classList.remove('expanded');
        
        const compact = this.widget.querySelector('.weather-compact');
        if (compact) {
            compact.setAttribute('aria-expanded', 'false');
            compact.focus(); // Возвращаем фокус для accessibility
        }
    }

    /**
     * Получение рекомендаций по одежде
     */
    getClothingRecommendation() {
        if (!this.state.weatherData) return '';
        
        const data = this.state.weatherData;
        const temp = data.main.temp;
        const feelsLike = data.main.feels_like;
        const weather = data.weather[0].main.toLowerCase();
        const wind = data.wind.speed;
        const humidity = data.main.humidity;
        
        // Определяем температурную категорию
        let tempCategory;
        const effectiveTemp = Math.min(temp, feelsLike); // Учитываем "ощущается как"
        
        if (effectiveTemp >= 25) tempCategory = 'hot';
        else if (effectiveTemp >= 18) tempCategory = 'warm';
        else if (effectiveTemp >= 10) tempCategory = 'mild';
        else if (effectiveTemp >= 0) tempCategory = 'cool';
        else if (effectiveTemp >= -10) tempCategory = 'cold';
        else tempCategory = 'freezing';
        
        // Базовые рекомендации
        let recommendations = this.recommendations[tempCategory] || [];
        
        // Дополнительные рекомендации по погоде
        const weatherTips = [];
        
        if (weather.includes('rain') || weather.includes('drizzle')) {
            weatherTips.push('зонт или дождевик');
            weatherTips.push('непромокаемая обувь');
        }
        
        if (weather.includes('snow')) {
            weatherTips.push('зимняя обувь');
            weatherTips.push('термоноски');
        }
        
        if (wind > 7) {
            weatherTips.push('ветровка или куртка от ветра');
            if (temp < 10) weatherTips.push('шапка, чтобы не продуло');
        }
        
        if (humidity > 80 && temp > 20) {
            weatherTips.push('легкая дышащая одежда');
        }
        
        if (weather.includes('clear') && temp > 20) {
            weatherTips.push('солнцезащитные очки');
            weatherTips.push('крем от загара');
        }
        
        // Объединяем рекомендации
        const allTips = [...recommendations, ...weatherTips];
        return this.formatRecommendations(allTips);
    }

    /**
     * Форматирование рекомендаций
     */
    formatRecommendations(tips) {
        if (tips.length === 0) return '';
        
        // Убираем дубликаты
        const uniqueTips = [...new Set(tips)];
        
        // Форматируем в читаемый вид
        if (uniqueTips.length === 1) {
            return uniqueTips[0];
        }
        
        const last = uniqueTips.pop();
        return uniqueTips.join(', ') + ' и ' + last;
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
