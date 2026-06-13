/**
 * Модуль погоды для киноклуба Одиссея
 * Версия 3.0 - без API ключа, использует бесплатные API
 */

class WeatherModule {
    constructor() {
        this.config = {
            city: 'Sevastopol',
            cityCoords: { lat: 44.5888, lon: 33.5224 }, // Севастополь
            updateInterval: 30 * 60 * 1000, // 30 минут
            cacheTime: 15 * 60 * 1000 // 15 минут кэша
        };

        this.state = {
            data: null,
            error: null,
            loading: false,
            expanded: false,
            lastUpdate: null
        };

        // Иконки для погоды
        this.icons = {
            clear: '☀️',
            partly: '⛅',
            cloudy: '☁️',
            rain: '🌧️',
            drizzle: '🌦️',
            thunder: '⛈️',
            snow: '❄️',
            mist: '🌫️'
        };

        // Рекомендации по одежде
        this.recommendations = {
            hot: '☀️ Легкая одежда, головной убор, не забудьте воду!',
            warm: '👕 Футболка, джинсы, легкая куртка на вечер',
            mild: '🧥 Кофта, джинсы, ветровка',
            cool: '🧥 Теплая кофта, куртка, шапка',
            cold: '🧣 Термобелье, теплая куртка, шарф, перчатки',
            freezing: '❄️ Термобелье, пуховик, зимняя обувь, шапка-ушанка'
        };

        this.init();
    }

    init() {
        try {
            // Проверка экономии трафика
            if (navigator.connection?.saveData) {
                console.log('WeatherModule: пропуск из-за экономии трафика');
                return;
            }

            this.createWidget();
            this.attachEvents();
            this.loadData();
            this.setupAutoUpdate();
        } catch (error) {
            console.error('WeatherModule: ошибка инициализации', error);
        }
    }

    createWidget() {
        // Проверяем существующий виджет
        const existingWidget = document.querySelector('.weather-widget');
        if (existingWidget && existingWidget.dataset.initialized === 'true') {
            this.widget = existingWidget;
            return;
        }

        // Ищем контейнер или создаем новый
        let weatherContainer = document.querySelector('.weather-widget');

        if (weatherContainer) {
            this.widget = weatherContainer;
            this.widget.innerHTML = '';
        } else {
            this.widget = document.createElement('div');
            this.widget.className = 'weather-widget';

            // Вставляем в хедер
            const headerInner = document.querySelector('.header__inner');
            const navContainer = document.querySelector('.nav-container');

            if (headerInner) {
                if (navContainer) {
                    headerInner.insertBefore(this.widget, navContainer);
                } else {
                    const mobileBtn = document.querySelector('.mobile-menu-btn');
                    if (mobileBtn) {
                        headerInner.insertBefore(this.widget, mobileBtn);
                    } else {
                        headerInner.appendChild(this.widget);
                    }
                }
            }
        }

        // Создаем структуру виджета
        this.widget.innerHTML = `
            <div class="weather-compact" role="button" tabindex="0" aria-label="Показать погоду">
                <span class="weather-icon">🌤️</span>
                <span class="weather-temp">--°</span>
            </div>
            <div class="weather-details" aria-hidden="true" hidden>
                <div class="weather-loading">
                    <div class="spinner"></div>
                    <p>Загрузка погоды...</p>
                </div>
            </div>
        `;

        this.widget.dataset.initialized = 'true';
    }

    async loadData() {
        // Проверка кэша
        const cached = this.getCache();
        if (cached && (Date.now() - cached.timestamp) < this.config.cacheTime) {
            this.state.data = cached.data;
            this.state.lastUpdate = cached.timestamp;
            this.renderCompact();
            return;
        }

        // Офлайн режим
        if (!navigator.onLine) {
            if (cached) {
                this.state.data = cached.data;
                this.state.error = 'Офлайн режим (кэш)';
                this.renderCompact();
            } else {
                this.state.error = 'Нет подключения';
                this.renderCompact();
            }
            return;
        }

        this.state.loading = true;
        this.renderCompact();

        try {
            // Используем Open-Meteo API (бесплатный, без ключа)
            const data = await this.fetchWeatherOpenMeteo();

            if (data) {
                this.state.data = data;
                this.state.error = null;
                this.state.lastUpdate = Date.now();
                this.setCache(data);
                this.renderCompact();

                // Если детали открыты - обновляем их
                if (this.state.expanded) {
                    this.renderDetails();
                }
            } else {
                throw new Error('Нет данных');
            }
        } catch (error) {
            console.warn('WeatherModule: ошибка загрузки', error);
            this.state.error = error.message;

            // Пробуем fallback API
            await this.loadFallbackWeather();
        } finally {
            this.state.loading = false;
            this.renderCompact();
        }
    }

    async fetchWeatherOpenMeteo() {
        const { lat, lon } = this.config.cityCoords;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Europe/Moscow`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            if (!data.current_weather) throw new Error('Некорректный ответ');

            const current = data.current_weather;
            const temperature = Math.round(current.temperature);
            const weatherCode = current.weathercode;
            const windspeed = current.windspeed;

            // Получаем описание погоды по коду
            const weatherInfo = this.getWeatherDescription(weatherCode);

            return {
                temp: temperature,
                feelsLike: temperature, // Open-Meteo не дает feels_like, используем температуру
                humidity: 65, // Приблизительное значение
                windSpeed: Math.round(windspeed),
                description: weatherInfo.description,
                icon: weatherInfo.icon,
                city: 'Севастополь'
            };
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Таймаут запроса');
            }
            throw error;
        }
    }

    async loadFallbackWeather() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // Используем wttr.in для простого получения погоды
            const response = await fetch('https://wttr.in/Sevastopol?format=%C+%t&m', {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const text = await response.text();
                // Парсим ответ типа "Partly cloudy +5°C"
                const match = text.match(/([^+]+)\+?(\d+)/);

                if (match) {
                    const condition = match[1].trim().toLowerCase();
                    const temp = parseInt(match[2]);

                    let icon = '🌡️';
                    let description = condition;

                    if (condition.includes('sunny') || condition.includes('clear')) {
                        icon = '☀️';
                        description = 'ясно';
                    } else if (condition.includes('partly') || condition.includes('cloud')) {
                        icon = '⛅';
                        description = 'облачно';
                    } else if (condition.includes('rain') || condition.includes('drizzle')) {
                        icon = '🌧️';
                        description = 'дождь';
                    } else if (condition.includes('snow')) {
                        icon = '❄️';
                        description = 'снег';
                    } else if (condition.includes('thunder')) {
                        icon = '⛈️';
                        description = 'гроза';
                    } else if (condition.includes('fog') || condition.includes('mist')) {
                        icon = '🌫️';
                        description = 'туман';
                    }

                    this.state.data = {
                        temp: temp,
                        feelsLike: temp,
                        humidity: 70,
                        windSpeed: 0,
                        description: description,
                        icon: icon,
                        city: 'Севастополь'
                    };
                    this.state.error = null;
                    this.state.lastUpdate = Date.now();
                    this.setCache(this.state.data);
                    this.renderCompact();

                    if (this.state.expanded) {
                        this.renderDetails();
                    }
                    return;
                }
            }

            // Если все API не работают, используем демо-данные
            this.useDemoWeather();

        } catch (error) {
            console.warn('Fallback weather failed:', error);
            this.useDemoWeather();
        }
    }

    useDemoWeather() {
        // Демо-данные на основе текущего месяца
        const month = new Date().getMonth();
        let temp = 15;
        let icon = '🌤️';
        let description = 'переменная облачность';

        if (month >= 11 || month <= 2) { // декабрь-февраль
            temp = 5;
            icon = '❄️';
            description = 'зимняя погода';
        } else if (month >= 3 && month <= 5) { // март-май
            temp = 15;
            icon = '🌤️';
            description = 'весенняя погода';
        } else if (month >= 6 && month <= 8) { // июнь-август
            temp = 28;
            icon = '☀️';
            description = 'жарко, солнечно';
        } else { // сентябрь-ноябрь
            temp = 18;
            icon = '⛅';
            description = 'прохладно, ветрено';
        }

        this.state.data = {
            temp: temp,
            feelsLike: temp,
            humidity: 65,
            windSpeed: 3,
            description: description,
            icon: icon,
            city: 'Севастополь'
        };
        this.state.error = 'Демо-режим';
        this.state.lastUpdate = Date.now();
        this.setCache(this.state.data);
    }

    getWeatherDescription(code) {
        // Коды погоды Open-Meteo
        const weatherMap = {
            0: { description: 'ясно', icon: '☀️' },
            1: { description: 'в основном ясно', icon: '🌤️' },
            2: { description: 'переменная облачность', icon: '⛅' },
            3: { description: 'пасмурно', icon: '☁️' },
            45: { description: 'туман', icon: '🌫️' },
            48: { description: 'туман', icon: '🌫️' },
            51: { description: 'морось', icon: '🌦️' },
            53: { description: 'морось', icon: '🌦️' },
            55: { description: 'сильная морось', icon: '🌧️' },
            61: { description: 'дождь', icon: '🌧️' },
            63: { description: 'дождь', icon: '🌧️' },
            65: { description: 'сильный дождь', icon: '🌧️' },
            71: { description: 'снег', icon: '❄️' },
            73: { description: 'снег', icon: '❄️' },
            75: { description: 'сильный снег', icon: '❄️' },
            80: { description: 'ливень', icon: '🌧️' },
            81: { description: 'ливень', icon: '🌧️' },
            82: { description: 'сильный ливень', icon: '⛈️' },
            95: { description: 'гроза', icon: '⛈️' },
            96: { description: 'гроза с градом', icon: '⛈️' },
            99: { description: 'гроза с градом', icon: '⛈️' }
        };

        return weatherMap[code] || { description: 'неизвестно', icon: '🌡️' };
    }

    renderCompact() {
        const compact = this.widget?.querySelector('.weather-compact');
        if (!compact) return;

        let icon = '🌤️';
        let temp = '--';

        if (this.state.loading) {
            compact.innerHTML = '<span class="weather-icon">⏳</span><span class="weather-temp">...</span>';
            return;
        }

        if (this.state.error && !this.state.data) {
            compact.innerHTML = '<span class="weather-icon">⚠️</span><span class="weather-temp">--°</span>';
            return;
        }

        if (this.state.data) {
            icon = this.state.data.icon || '🌡️';
            temp = this.state.data.temp;
            compact.innerHTML = `<span class="weather-icon">${icon}</span><span class="weather-temp">${temp}°</span>`;
        }
    }

    renderDetails() {
        const details = this.widget?.querySelector('.weather-details');
        if (!details) return;

        if (this.state.loading) {
            details.innerHTML = `
                <div class="weather-loading">
                    <div class="spinner"></div>
                    <p>Загрузка погоды...</p>
                </div>
            `;
            details.hidden = false;
            return;
        }

        if (this.state.error && !this.state.data) {
            details.innerHTML = `
                <div class="weather-error">
                    <p>⚠️ ${this.state.error}</p>
                    <button class="retry-btn" aria-label="Повторить">🔄 Обновить</button>
                </div>
            `;
            details.hidden = false;
            this.setupRetryButton();
            return;
        }

        if (!this.state.data) {
            details.innerHTML = '<div class="weather-loading">Нет данных о погоде</div>';
            details.hidden = false;
            return;
        }

        const data = this.state.data;
        const temp = data.temp;
        const feelsLike = data.feelsLike;
        const windSpeed = data.windSpeed;
        const humidity = data.humidity;
        const description = data.description;
        const icon = data.icon;
        const recommendation = this.getRecommendation(temp);

        details.innerHTML = `
            <div class="weather-header">
                <h3>🌍 Погода в ${data.city}</h3>
                <button class="close-btn" aria-label="Закрыть">×</button>
            </div>
            <div class="weather-main">
                <div class="weather-icon-large">${icon}</div>
                <div class="weather-temp-large">${temp}°</div>
                <div class="weather-desc">${description}</div>
            </div>
            <div class="weather-stats">
                <div class="weather-stat">
                    <span class="stat-label">Ощущается</span>
                    <span class="stat-value">${feelsLike}°</span>
                </div>
                <div class="weather-stat">
                    <span class="stat-label">Влажность</span>
                    <span class="stat-value">${humidity}%</span>
                </div>
                <div class="weather-stat">
                    <span class="stat-label">Ветер</span>
                    <span class="stat-value">${windSpeed} м/с</span>
                </div>
            </div>
            <div class="weather-recommendation">
                <p>💡 ${recommendation}</p>
            </div>
            <div class="weather-update">
                📅 Обновлено: ${this.formatTime(this.state.lastUpdate)}
                ${this.state.error === 'Демо-режим' ? '<br><small>⚠️ Демо-режим погоды</small>' : ''}
            </div>
        `;

        details.hidden = false;
        this.setupCloseButton();
    }

    getRecommendation(temp) {
        if (temp >= 25) return this.recommendations.hot;
        if (temp >= 18) return this.recommendations.warm;
        if (temp >= 10) return this.recommendations.mild;
        if (temp >= 0) return this.recommendations.cool;
        if (temp >= -10) return this.recommendations.cold;
        return this.recommendations.freezing;
    }

    formatTime(timestamp) {
        if (!timestamp) return 'неизвестно';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    setCache(data) {
        try {
            localStorage.setItem('weather_cache', JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Cache failed');
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

    attachEvents() {
        if (!this.widget) return;

        // Клик по компактному виду
        const compact = this.widget.querySelector('.weather-compact');
        if (compact) {
            compact.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDetails();
            });

            compact.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleDetails();
                }
            });
        }

        // Закрытие по клику вне виджета
        document.addEventListener('click', (e) => {
            if (this.state.expanded && this.widget && !this.widget.contains(e.target)) {
                this.closeDetails();
            }
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.expanded) {
                this.closeDetails();
            }
        });

        // Обновление при возвращении онлайн
        window.addEventListener('online', () => this.loadData());
    }

    setupRetryButton() {
        const retryBtn = this.widget?.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.loadData();
            });
        }
    }

    setupCloseButton() {
        const closeBtn = this.widget?.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeDetails();
            });
        }
    }

    toggleDetails() {
        this.state.expanded = !this.state.expanded;
        const details = this.widget?.querySelector('.weather-details');

        if (details) {
            if (this.state.expanded) {
                this.renderDetails();
                details.hidden = false;
            } else {
                details.hidden = true;
            }
        }

        const compact = this.widget?.querySelector('.weather-compact');
        if (compact) {
            compact.setAttribute('aria-expanded', this.state.expanded);
        }
    }

    closeDetails() {
        this.state.expanded = false;
        const details = this.widget?.querySelector('.weather-details');
        if (details) {
            details.hidden = true;
        }
        const compact = this.widget?.querySelector('.weather-compact');
        if (compact) {
            compact.setAttribute('aria-expanded', 'false');
        }
    }

    setupAutoUpdate() {
        // Автообновление по таймеру
        setInterval(() => {
            if (navigator.onLine && document.visibilityState === 'visible') {
                this.loadData();
            }
        }, this.config.updateInterval);

        // Обновление при возвращении на вкладку
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && navigator.onLine) {
                this.loadData();
            }
        });
    }
}

// Инициализация
function initWeatherModule() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.weatherModule = new WeatherModule();
        });
    } else {
        window.weatherModule = new WeatherModule();
    }
}

initWeatherModule();
