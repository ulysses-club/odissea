/**
 * Независимый модуль для секции "Где мы собираемся"
 */
class MapModule {
    constructor() {
        this.config = {
            selectors: {
                mapContainer: '.map-section',
                mapElement: '#map'
            },
            coordinates: {
                default: [44.601145, 33.520966],
                fallback: [44.601145, 33.520966]
            },
            placeInfo: {
                name: 'Кофейня "Том Сойер"',
                address: 'ул. Шмидта, 12, Севастополь',
                description: 'Место встреч киноклуба',
                vkLink: 'https://vk.com/tomsoyerbartending',
                tgBot: 'https://t.me/Odyssey_Cinema_Club_bot'
            },
            messages: {
                loading: 'Загрузка карты...',
                error: 'Карта временно недоступна',
                meetingPlace: 'Собираемся каждую неделю в выходные',
                checkTime: 'Точное время и дату узнавать тут:'
            }
        };

        this.state = {
            map: null,
            placemark: null,
            isInitialized: false,
            fallbackDisplayed: false
        };

        this.init();
    }

    /**
     * Инициализация модуля
     */
    async init() {
        console.log('Инициализация MapModule...');
        
        try {
            this.cacheDOM();
            
            // Проверяем, виден ли элемент карты
            if (!this.isMapElementVisible()) {
                console.log('Элемент карты не виден, откладываем инициализацию');
                this.setupIntersectionObserver();
                return;
            }
            
            await this.loadYandexMaps();
        } catch (error) {
            console.error('Ошибка инициализации MapModule:', error);
            this.showFallback();
        }
    }

    /**
     * Кэширование DOM элементов
     */
    cacheDOM() {
        this.elements = {
            container: document.querySelector(this.config.selectors.mapContainer),
            mapElement: document.querySelector(this.config.selectors.mapElement)
        };

        if (!this.elements.container || !this.elements.mapElement) {
            throw new Error('Контейнер карты не найден');
        }

        console.log('DOM элементы MapModule закэшированы');
    }

    /**
     * Проверка видимости элемента карты
     */
    isMapElementVisible() {
        if (!this.elements.mapElement) return false;
        
        const rect = this.elements.mapElement.getBoundingClientRect();
        const isVisible = (
            rect.width > 0 && 
            rect.height > 0 && 
            rect.top < window.innerHeight && 
            rect.bottom > 0
        );
        
        console.log('Элемент карты видим:', isVisible, 'размеры:', rect.width, 'x', rect.height);
        return isVisible;
    }

    /**
     * Настройка Intersection Observer для ленивой загрузки
     */
    setupIntersectionObserver() {
        if (!this.elements.mapElement) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.state.isInitialized) {
                    console.log('Карта стала видимой, начинаем загрузку...');
                    observer.unobserve(entry.target);
                    this.loadYandexMaps().catch(error => {
                        console.error('Ошибка загрузки карты:', error);
                        this.showFallback();
                    });
                }
            });
        }, {
            rootMargin: '100px', // Начинаем загрузку когда до карты осталось 100px
            threshold: 0.1
        });

        observer.observe(this.elements.mapElement);
    }

    /**
     * Загрузка API Яндекс.Карт
     */
    loadYandexMaps() {
        return new Promise((resolve, reject) => {
            // Проверяем, виден ли элемент перед загрузкой API
            if (!this.isMapElementVisible()) {
                console.log('Элемент карты все еще не видим, откладываем загрузку');
                this.setupIntersectionObserver();
                reject(new Error('Элемент карты не видим'));
                return;
            }

            if (typeof ymaps !== 'undefined') {
                this.initYandexMap();
                resolve();
                return;
            }

            // Проверяем, не загружается ли уже API
            if (window._yandexMapsLoading) {
                const checkInterval = setInterval(() => {
                    if (typeof ymaps !== 'undefined') {
                        clearInterval(checkInterval);
                        this.initYandexMap();
                        resolve();
                    }
                }, 100);
                return;
            }

            window._yandexMapsLoading = true;

            const script = document.createElement('script');
            // Убираем API ключ для тестирования или используем демо-ключ
            script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
            script.async = true;

            script.onload = () => {
                window._yandexMapsLoading = false;
                if (typeof ymaps !== 'undefined') {
                    setTimeout(() => {
                        this.initYandexMap();
                        resolve();
                    }, 100); // Небольшая задержка для стабилизации
                } else {
                    reject(new Error('Yandex Maps API не загрузился'));
                }
            };

            script.onerror = () => {
                window._yandexMapsLoading = false;
                reject(new Error('Не удалось загрузить Яндекс Карты'));
            };

            document.head.appendChild(script);

            // Таймаут на загрузку
            setTimeout(() => {
                if (!this.state.isInitialized && !this.state.fallbackDisplayed) {
                    reject(new Error('Таймаут загрузки Яндекс Карт'));
                }
            }, 15000);
        });
    }

    /**
     * Инициализация Яндекс.Карты
     */
    initYandexMap() {
        if (this.state.isInitialized) return;

        try {
            ymaps.ready(() => {
                try {
                    // Дополнительная проверка перед созданием карты
                    if (!this.elements.mapElement || this.elements.mapElement.offsetWidth === 0) {
                        console.error('Элемент карты имеет нулевую ширину');
                        this.showFallback();
                        return;
                    }

                    console.log('Создание карты в элементе:', this.elements.mapElement);
                    
                    const map = new ymaps.Map(this.elements.mapElement, {
                        center: this.config.coordinates.default,
                        zoom: 16,
                        controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
                    });

                    const placemark = new ymaps.Placemark(this.config.coordinates.default, {
                        hintContent: this.config.placeInfo.name,
                        balloonContent: `
                            <strong>${this.config.placeInfo.name}</strong><br>
                            ${this.config.placeInfo.address}<br>
                            <em>${this.config.placeInfo.description}</em>
                        `
                    }, {
                        iconLayout: 'default#image',
                        iconImageHref: this.generatePlacemarkIcon(),
                        iconImageSize: [40, 40],
                        iconImageOffset: [-20, -40]
                    });

                    map.geoObjects.add(placemark);

                    this.state.map = map;
                    this.state.placemark = placemark;
                    this.state.isInitialized = true;

                    this.updateMapInfo();
                    this.hideFallback();

                    console.log('Яндекс.Карта успешно инициализирована');

                } catch (error) {
                    console.error('Ошибка создания карты:', error);
                    this.showFallback();
                }
            });
        } catch (error) {
            console.error('Ошибка ymaps.ready:', error);
            this.showFallback();
        }
    }

    /**
     * Генерация иконки для метки
     */
    generatePlacemarkIcon() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiM2YTExY2IiIGZpbGwtb3BhY2l0eT0iMC44IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIyMCIgeT0iMjUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSJib2xkIj7QmtC+PC90ZXh0Pgo8L3N2Zz4=';
    }

    /**
     * Обновление информации на карте
     */
    updateMapInfo() {
        const infoElement = this.elements.container.querySelector('.map-info');
        if (!infoElement) return;

        infoElement.innerHTML = `
            <h3>${this.config.placeInfo.name}</h3>
            <p>${this.config.placeInfo.address}</p>
            <a href="${this.config.placeInfo.vkLink}" target="_blank" rel="noopener noreferrer" class="contact-card__link">
                Tom Soyer Bartending
            </a>
            <p>${this.config.messages.meetingPlace}</p>
            <p>${this.config.messages.checkTime}</p>
            <a href="${this.config.placeInfo.tgBot}" target="_blank" rel="noopener noreferrer" class="contact-card__link">
                @Odyssey_Cinema_Club_bot
            </a>
        `;
    }

    /**
     * Показать fallback-контент
     */
    showFallback() {
        if (this.state.fallbackDisplayed) return;

        const mapElement = this.elements.mapElement;
        if (!mapElement) return;

        // Скрываем спиннер загрузки если есть
        const loadingMessage = mapElement.querySelector('.loading-message');
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }

        let fallback = mapElement.querySelector('.map-module-fallback');
        
        if (!fallback) {
            fallback = document.createElement('div');
            fallback.className = 'map-module-fallback';
            fallback.innerHTML = this.generateFallbackHTML();
            mapElement.appendChild(fallback);
        } else {
            fallback.innerHTML = this.generateFallbackHTML();
            fallback.style.display = 'flex';
        }

        this.state.fallbackDisplayed = true;
        this.updateMapInfo();
    }

    /**
     * Скрыть fallback-контент
     */
    hideFallback() {
        const fallback = this.elements.mapElement?.querySelector('.map-module-fallback');
        if (fallback) {
            fallback.style.display = 'none';
        }
        this.state.fallbackDisplayed = false;
    }

    /**
     * Генерация HTML для fallback
     */
    generateFallbackHTML() {
        return `
            <div>
                <div style="font-size:3rem;margin-bottom:1rem;">🗺️</div>
                <h3>Карта временно недоступна</h3>
                <p><strong>Место:</strong> ${this.config.placeInfo.name}</p>
                <p><strong>Адрес:</strong> ${this.config.placeInfo.address}</p>
                <p><em>${this.config.placeInfo.description}</em></p>
                <p style="font-size:0.9rem;opacity:0.8;">Мы встречаемся здесь каждую неделю!</p>
            </div>
        `;
    }

    /**
     * Обновление данных о месте встречи
     */
    updateMeetingPlace(newPlaceInfo) {
        if (newPlaceInfo.name) this.config.placeInfo.name = newPlaceInfo.name;
        if (newPlaceInfo.address) this.config.placeInfo.address = newPlaceInfo.address;
        if (newPlaceInfo.description) this.config.placeInfo.description = newPlaceInfo.description;
        if (newPlaceInfo.vkLink) this.config.placeInfo.vkLink = newPlaceInfo.vkLink;
        if (newPlaceInfo.tgBot) this.config.placeInfo.tgBot = newPlaceInfo.tgBot;

        this.updateMapInfo();

        if (this.state.isInitialized && this.state.placemark) {
            this.state.placemark.properties.set({
                hintContent: this.config.placeInfo.name,
                balloonContent: `
                    <strong>${this.config.placeInfo.name}</strong><br>
                    ${this.config.placeInfo.address}<br>
                    <em>${this.config.placeInfo.description}</em>
                `
            });
        }
    }

    /**
     * Очистка ресурсов
     */
    destroy() {
        if (this.state.map) {
            this.state.map.destroy();
        }
        this.state = {
            map: null,
            placemark: null,
            isInitialized: false,
            fallbackDisplayed: false
        };
    }
}

// Автоматическая инициализация с задержкой
function initMapModule() {
    const mapContainer = document.querySelector('.map-section');
    if (mapContainer) {
        console.log('Найден контейнер карты, инициализация MapModule...');
        
        // Небольшая задержка для стабилизации DOM
        setTimeout(() => {
            window.mapModule = new MapModule();
        }, 500);
    }
}

// Инициализация при полной загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMapModule);
} else {
    // Если DOM уже загружен, ждем немного перед инициализацией
    setTimeout(initMapModule, 100);
}