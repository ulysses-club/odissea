class MapModule {
    /** Конструктор - инициализация модуля карты */
    constructor() {
        this.config = {
            coordinates: [44.601145, 33.520966], // Координаты Севастополя
            placeInfo: {
                name: 'Кофейня "Том Сойер"',
                address: 'ул. Шмидта, 12, Севастополь',
                description: 'Место встреч киноклуба',
                vkLink: 'https://vk.com/tomsoyerbartending',
                tgBot: 'https://t.me/Odyssey_Cinema_Club_bot'
            },
            mapOptions: {
                zoom: 16,
                controls: ['zoomControl', 'typeSelector', 'fullscreenControl'],
                behaviors: ['drag', 'scrollZoom', 'dblClickZoom', 'multiTouch']
            }
        };
        
        this.state = {
            map: null,
            placemark: null,
            isInitialized: false,
            isVisible: false,
            meetingData: null,
            observer: null,
            loadAttempts: 0,
            maxLoadAttempts: 3
        };
        
        // Загружаем немедленно если видима, иначе ждем появления
        setTimeout(() => this.init(), 100);
    }

    /** Основная инициализация модуля */
    async init() {
        console.log('🔄 Инициализация модуля карты...');
        
        try {
            this.cacheDOM();
            
            // Показываем loading состояние
            this.showLoading();
            
            // Параллельно загружаем данные и карту
            await Promise.all([
                this.loadMeetingData(),
                this.initMapIfVisible()
            ]);
            
        } catch (error) {
            console.error('❌ Ошибка инициализации карты:', error);
            this.showFallback();
        }
    }

    /** Кэширование DOM элементов */
    cacheDOM() {
        this.elements = {
            container: document.querySelector('.map-section'),
            mapElement: document.getElementById('map'),
            infoElement: document.querySelector('.map-info'),
            loadingElement: null
        };
        
        if (!this.elements.mapElement) {
            throw new Error('Элемент карты не найден');
        }
    }

    /** Показать состояние загрузки */
    showLoading() {
        if (!this.elements.mapElement) return;
        
        this.elements.mapElement.innerHTML = `
            <div class="map-loading">
                <div class="spinner"></div>
                <p>Загрузка кинематографичной карты...</p>
                <p style="margin-top: 10px; font-size: 0.9em; opacity: 0.7;">Подождите немного...</p>
            </div>
        `;
        this.elements.loadingElement = this.elements.mapElement.querySelector('.map-loading');
    }

    /** Загрузить данные о встрече */
    async loadMeetingData() {
        try {
            const response = await fetch('../data/next-meeting.json');
            this.state.meetingData = await response.json();
            if (this.state.meetingData?.place) {
                this.updatePlaceInfo(this.state.meetingData.place);
            }
            this.updateInfoElement();
        } catch (error) {
            console.warn('⚠️ Не удалось загрузить данные о встрече:', error);
            // Не прерываем работу, используем стандартные данные
        }
    }

    /** Обновить информацию о месте */
    updatePlaceInfo(place) {
        if (!place) return;
        
        if (place.includes('"')) {
            const nameMatch = place.match(/"([^"]*)"/);
            if (nameMatch) {
                this.config.placeInfo.name = nameMatch[1];
                this.config.placeInfo.address = place.replace(nameMatch[0], '').replace(',', '').trim();
            }
        } else if (place.includes(',')) {
            const parts = place.split(',');
            this.config.placeInfo.name = parts[0].trim();
            this.config.placeInfo.address = parts.slice(1).join(',').trim();
        }
        
        if (this.state.meetingData?.film) {
            this.config.placeInfo.description = `Место встречи киноклуба. Обсуждаем: ${this.state.meetingData.film}`;
        }
    }

    /** Инициализировать карту если видима */
    async initMapIfVisible() {
        if (this.isElementVisible()) {
            console.log('📍 Карта видима, загружаем немедленно');
            await this.loadMap();
        } else {
            console.log('📍 Карта не видима, настраиваем ленивую загрузку');
            this.setupIntersectionObserver();
        }
    }

    /** Проверить видимость элемента */
    isElementVisible() {
        if (!this.elements.mapElement) return false;
        const rect = this.elements.mapElement.getBoundingClientRect();
        return rect.top < window.innerHeight + 100 && rect.bottom > -100;
    }

    /** Настроить Intersection Observer */
    setupIntersectionObserver() {
        if (!this.elements.mapElement || !('IntersectionObserver' in window)) {
            // Если IntersectionObserver не поддерживается, загружаем немедленно
            setTimeout(() => this.loadMap(), 500);
            return;
        }
        
        this.state.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.state.isInitialized && this.state.loadAttempts < this.state.maxLoadAttempts) {
                    console.log('📍 Карта появилась в viewport, начинаем загрузку');
                    this.state.isVisible = true;
                    this.loadMap();
                    this.state.observer?.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '200px', // Загружаем заранее
            threshold: 0.01
        });
        
        this.state.observer.observe(this.elements.mapElement);
        
        // На всякий случай загружаем через 3 секунды
        setTimeout(() => {
            if (!this.state.isInitialized && !this.state.isVisible) {
                console.log('📍 Загрузка по таймауту');
                this.loadMap();
            }
        }, 3000);
    }

    /** Загрузить карту */
    async loadMap() {
        if (this.state.isInitialized || this.state.loadAttempts >= this.state.maxLoadAttempts) {
            return;
        }
        
        this.state.loadAttempts++;
        console.log(`📍 Попытка загрузки карты ${this.state.loadAttempts}/${this.state.maxLoadAttempts}`);
        
        try {
            await this.loadYandexMaps();
            await this.initYandexMap();
            this.state.isInitialized = true;
            console.log('✅ Карта успешно загружена');
        } catch (error) {
            console.error('❌ Ошибка загрузки карты:', error);
            
            if (this.state.loadAttempts < this.state.maxLoadAttempts) {
                console.log(`📍 Повторная попытка через 2 секунды...`);
                setTimeout(() => this.loadMap(), 2000);
            } else {
                this.showFallback();
            }
        }
    }

    /** Загрузить API Яндекс.Карт */
    loadYandexMaps() {
        return new Promise((resolve, reject) => {
            // Проверяем, не загружается ли уже
            if (window._yandexMapsLoading) {
                const checkInterval = setInterval(() => {
                    if (typeof ymaps !== 'undefined') {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                return;
            }
            
            // Проверяем, не загружено ли уже
            if (typeof ymaps !== 'undefined') {
                return resolve();
            }
            
            window._yandexMapsLoading = true;
            const script = document.createElement('script');
            script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=';
            script.async = true;
            
            let loaded = false;
            
            script.onload = () => {
                if (loaded) return;
                loaded = true;
                window._yandexMapsLoading = false;
                console.log('✅ Яндекс.Карты загружены');
                resolve();
            };
            
            script.onerror = () => {
                if (loaded) return;
                loaded = true;
                window._yandexMapsLoading = false;
                console.error('❌ Ошибка загрузки Яндекс.Карт');
                reject(new Error('Не удалось загрузить Яндекс.Карты'));
            };
            
            // Таймаут на случай проблем с сетью
            setTimeout(() => {
                if (!loaded) {
                    loaded = true;
                    window._yandexMapsLoading = false;
                    reject(new Error('Таймаут загрузки Яндекс.Карт'));
                }
            }, 10000);
            
            document.head.appendChild(script);
        });
    }

    /** Инициализировать Яндекс.Карту */
    initYandexMap() {
        return new Promise((resolve, reject) => {
            ymaps.ready(() => {
                try {
                    // Создаем карту
                    this.state.map = new ymaps.Map(this.elements.mapElement, {
                        center: this.config.coordinates,
                        zoom: this.config.mapOptions.zoom,
                        controls: this.config.mapOptions.controls
                    });
                    
                    // Оптимизация для мобильных
                    if (window.innerWidth < 768) {
                        this.state.map.behaviors.disable('scrollZoom');
                    }
                    
                    // Создаем кастомную метку
                    this.createPlacemark();
                    
                    // Обновляем местоположение если есть данные
                    if (this.state.meetingData?.place) {
                        this.updateMapLocation();
                    }
                    
                    // Настраиваем обработчики
                    this.setupMapEvents();
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /** Создать кастомную метку */
    createPlacemark() {
        // Создаем кастомную иконку метки
        const placemarkLayout = ymaps.templateLayoutFactory.createClass(
            '<div class="custom-placemark" title="Место встречи киноклуба"></div>'
        );

        this.state.placemark = new ymaps.Placemark(this.config.coordinates, {
            hintContent: this.config.placeInfo.name,
            balloonContentHeader: `
                <div style="padding: 8px 0; border-bottom: 1px solid #eee; margin-bottom: 10px;">
                    <strong style="color: #6a11cb; font-size: 18px;">${this.config.placeInfo.name}</strong>
                </div>
            `,
            balloonContentBody: `
                <div style="padding: 8px 0;">
                    <p style="margin: 8px 0; color: #333;">
                        <span style="color: #6a11cb;">📍</span> ${this.config.placeInfo.address}
                    </p>
                    ${this.state.meetingData?.film ? `
                        <p style="margin: 8px 0; color: #666; font-style: italic;">
                            🎬 Обсуждаем: ${this.state.meetingData.film}
                        </p>
                    ` : ''}
                    <p style="margin: 8px 0; color: #666;">
                        ${this.config.placeInfo.description}
                    </p>
                </div>
            `,
            balloonContentFooter: `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                    <a href="${this.config.placeInfo.vkLink}" target="_blank" 
                       style="color: #2575fc; text-decoration: none; margin-right: 15px; display: inline-block;">
                        💬 ВКонтакте
                    </a>
                    <a href="${this.config.placeInfo.tgBot}" target="_blank" 
                       style="color: #2575fc; text-decoration: none; display: inline-block;">
                        🤖 Telegram
                    </a>
                </div>
            `
        }, {
            iconLayout: placemarkLayout,
            iconShape: {
                type: 'Circle',
                coordinates: [0, 0],
                radius: 30
            },
            hasBalloon: true,
            openBalloonOnClick: true,
            hideIconOnBalloonOpen: false
        });

        this.state.map.geoObjects.add(this.state.placemark);
    }

    /** Обновить местоположение на карте */
    async updateMapLocation() {
        try {
            if (!ymaps || !this.state.map) return;
            
            const fullAddress = `${this.config.placeInfo.address}, Севастополь`;
            
            ymaps.geocode(fullAddress).then(res => {
                const geoObject = res.geoObjects.get(0);
                if (geoObject) {
                    const coordinates = geoObject.geometry.getCoordinates();
                    
                    // Плавное перемещение карты
                    this.state.map.panTo(coordinates, {
                        duration: 1000,
                        timingFunction: 'ease-in-out'
                    });
                    
                    // Обновляем позицию метки
                    this.state.placemark.geometry.setCoordinates(coordinates);
                }
            });
        } catch (error) {
            console.warn('⚠️ Не удалось геокодировать адрес:', error);
        }
    }

    /** Обновить информационный элемент */
    updateInfoElement() {
        if (!this.elements.infoElement) return;
        
        const filmInfo = this.state.meetingData?.film ? 
            `<p class="map-info__text"><strong>🎬 Обсуждаем:</strong> ${this.state.meetingData.film}</p>` : '';
        
        const timeInfo = (this.state.meetingData?.date && this.state.meetingData?.time) ? 
            `<p class="map-info__text"><strong>⏰ Когда:</strong> ${this.state.meetingData.date} в ${this.state.meetingData.time}</p>` : '';

        this.elements.infoElement.innerHTML = `
            <h3 class="map-info__title">${this.config.placeInfo.name}</h3>
            <address class="map-info__address">${this.config.placeInfo.address}</address>
            ${filmInfo}
            ${timeInfo}
            <div style="margin-top: var(--space-md);">
                <a href="${this.config.placeInfo.vkLink}" target="_blank" rel="noopener noreferrer" class="contact-card__link map-link">
                    💬 Tom Soyer Bartending
                </a>
                <br>
                <a href="${this.config.placeInfo.tgBot}" target="_blank" rel="noopener noreferrer" class="contact-card__link map-link">
                    🤖 @Odyssey_Cinema_Club_bot
                </a>
            </div>
            <p class="map-info__text" style="margin-top: var(--space-md); font-size: 0.9em;">
                Собираемся каждую неделю в выходные<br>
                Точное время и дату узнавать в телеграм-боте
            </p>
        `;
    }

    /** Настроить обработчики событий карты */
    setupMapEvents() {
        if (!this.state.map) return;
        
        // Оптимизация при изменении размера окна
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.state.map) {
                    this.state.map.container.fitToViewport();
                    
                    // Отключаем scrollZoom на мобильных
                    if (window.innerWidth < 768) {
                        this.state.map.behaviors.disable('scrollZoom');
                    } else {
                        this.state.map.behaviors.enable('scrollZoom');
                    }
                }
            }, 250);
        };
        
        window.addEventListener('resize', handleResize);
        this.handleResize = handleResize;
    }

    /** Показать fallback-контент */
    showFallback() {
        if (!this.elements.mapElement) return;
        
        const filmInfo = this.state.meetingData?.film ? 
            `<p class="map-info__text"><strong>🎬 Обсуждаем:</strong> ${this.state.meetingData.film}</p>` : '';
        
        const timeInfo = (this.state.meetingData?.date && this.state.meetingData?.time) ? 
            `<p class="map-info__text"><strong>⏰ Когда:</strong> ${this.state.meetingData.date} в ${this.state.meetingData.time}</p>` : '';

        this.elements.mapElement.innerHTML = `
            <div class="map-module-fallback">
                <div style="font-size: 4rem; margin-bottom: 1.5rem; animation: bounce 2s infinite;">🗺️</div>
                <h3>Кинематографичная карта встреч</h3>
                <p><strong>🎭 Место:</strong> ${this.config.placeInfo.name}</p>
                <p><strong>📍 Адрес:</strong> ${this.config.placeInfo.address}</p>
                ${filmInfo}
                ${timeInfo}
                <p style="margin: 1.5rem 0; font-style: italic; color: var(--accent);">
                    ${this.config.placeInfo.description}
                </p>
                <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem;">
                    <a href="${this.config.placeInfo.vkLink}" target="_blank" class="contact-card__link map-link">
                        💬 Перейти в группу ВКонтакте
                    </a>
                    <a href="${this.config.placeInfo.tgBot}" target="_blank" class="contact-card__link map-link">
                        🤖 Написать в Telegram-бот
                    </a>
                </div>
                <p style="margin-top: 1.5rem; font-size: 0.9rem; opacity: 0.8;">
                    Карта временно недоступна. Мы встретимся здесь в ближайшие выходные!
                </p>
            </div>
        `;
    }

    /** Очистить ресурсы */
    destroy() {
        if (this.state.observer) {
            this.state.observer.disconnect();
        }
        
        if (this.state.map) {
            this.state.map.destroy();
        }
        
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
        }
    }
}

/** Функция инициализации модуля карты */
function initMapModule() {
    console.log('🚀 Запуск инициализации модуля карты...');
    
    const mapContainer = document.querySelector('.map-section');
    if (!mapContainer) {
        console.warn('⚠️ Контейнер карты не найден');
        return;
    }
    
    console.log('✅ Контейнер карты найден, создаем экземпляр MapModule');
    
    // Создаем глобальную переменную для отладки
    window.mapModuleInstance = new MapModule();
}

// Проверяем, нужно ли подождать загрузки DOM
if (document.readyState === 'loading') {
    console.log('📄 DOM еще загружается, ждем события DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOM загружен, инициализируем карту');
        setTimeout(initMapModule, 100);
    });
} else {
    console.log('✅ DOM уже загружен, инициализируем карту');
    setTimeout(initMapModule, 100);
}

// Альтернативная инициализация на случай если DOM уже готов
window.addEventListener('load', () => {
    if (!window.mapModuleInstance) {
        console.log('⚡ Страница полностью загружена, пробуем инициализировать карту');
        setTimeout(initMapModule, 500);
    }
});
