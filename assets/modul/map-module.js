/**
 * Независимый модуль для секции "Где мы собираемся"
 */
class MapModule {
    /**
     * Конструктор класса MapModule
     * Инициализирует конфигурацию, состояние и запускает модуль карты
     */
    constructor() {
        this.config = {
            selectors: {
                mapContainer: '.map-section',
                mapElement: '#map'
            },
            coordinates: {
                default: [44.601145, 33.520966], // Кофейня "Том Сойер"
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
            fallbackDisplayed: false,
            meetingData: null,
            useMeetingLocation: false
        };

        this.init();
    }

    /**
     * Инициализация модуля
     * Кэширует DOM элементы, загружает данные о встрече и Яндекс.Карты
     */
    async init() {
        console.log('Инициализация MapModule...');

        try {
            this.cacheDOM();
            
            // Загружаем данные о встрече перед инициализацией карты
            await this.loadMeetingData();

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
     * Загрузка данных о встрече из next-meeting.json
     * Обновляет информацию о месте на основе данных встречи
     */
    async loadMeetingData() {
        try {
            const response = await fetch('../modul/next-meeting.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const meetingData = await response.json();
            console.log('Данные о встрече загружены:', meetingData);
            
            this.state.meetingData = meetingData;

            // Обновляем информацию о месте на основе данных встречи
            if (meetingData.place && meetingData.place.trim() !== '') {
                this.updatePlaceFromMeetingData(meetingData);
                this.state.useMeetingLocation = true;
                console.log('Будет использовано место встречи из данных:', meetingData.place);
            } else {
                console.log('Место встречи не указано, используем стандартное');
                this.state.useMeetingLocation = false;
            }
            
        } catch (error) {
            console.warn('Не удалось загрузить данные о встрече, используем значения по умолчанию:', error);
            this.state.useMeetingLocation = false;
        }
    }

    /**
     * Обновление информации о месте на основе данных встречи
     * @param {Object} meetingData - Данные о встрече
     */
    updatePlaceFromMeetingData(meetingData) {
        const place = meetingData.place;
        
        // Определяем название места и адрес из поля place
        let placeName = 'Место встречи киноклуба';
        let address = place;
        
        if (place.includes('"')) {
            // Извлекаем название в кавычках
            const nameMatch = place.match(/"([^"]*)"/);
            if (nameMatch) {
                placeName = nameMatch[1];
                // Адрес - все что после кавычек
                address = place.replace(nameMatch[0], '').replace(',', '').trim();
            }
        } else if (place.includes(',')) {
            // Если есть запятая, берем первую часть как название
            const parts = place.split(',');
            placeName = parts[0].trim();
            address = parts.slice(1).join(',').trim();
        }

        // Обновляем конфигурацию
        this.config.placeInfo.name = placeName;
        this.config.placeInfo.address = address;
        
        // Если есть описание фильма, добавляем его в описание места
        if (meetingData.film) {
            this.config.placeInfo.description = `Место встречи киноклуба. Обсуждаем: ${meetingData.film}`;
        }

        console.log('Информация о месте обновлена:', this.config.placeInfo);
    }

    /**
     * Геокодирование адреса для получения координат
     * @param {string} address - Адрес для геокодирования
     * @returns {Promise} - Промис с координатами [широта, долгота]
     */
    geocodeAddress(address) {
        return new Promise((resolve, reject) => {
            if (typeof ymaps === 'undefined') {
                reject(new Error('Yandex Maps API не загружен'));
                return;
            }

            ymaps.geocode(address).then(function (res) {
                const firstGeoObject = res.geoObjects.get(0);
                if (firstGeoObject) {
                    const coordinates = firstGeoObject.geometry.getCoordinates();
                    console.log('Координаты найдены:', coordinates, 'для адреса:', address);
                    resolve(coordinates);
                } else {
                    reject(new Error('Адрес не найден: ' + address));
                }
            }).catch(reject);
        });
    }

    /**
     * Кэширование DOM элементов
     * Находит и сохраняет ссылки на DOM элементы карты
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
     * Определяет, виден ли элемент карты в области просмотра
     * 
     * @returns {boolean} - true если элемент видим, иначе false
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
     * Откладывает загрузку карты до момента её появления в области просмотра
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
     * Динамически загружает API Яндекс.Карт с обработкой ошибок и таймаутами
     * 
     * @returns {Promise} - Промис, разрешающийся при успешной загрузке API
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
            script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=&load=package.full';
            script.async = true;

            script.onload = () => {
                window._yandexMapsLoading = false;
                if (typeof ymaps !== 'undefined') {
                    setTimeout(() => {
                        this.initYandexMap();
                        resolve();
                    }, 100);
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
     * Создает экземпляр карты, добавляет метку и настраивает элементы управления
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

                    console.log('Создание карты. Используем данные встречи:', this.state.useMeetingLocation);

                    // Сначала создаем карту с координатами по умолчанию
                    const map = new ymaps.Map(this.elements.mapElement, {
                        center: this.config.coordinates.default,
                        zoom: 16,
                        controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
                    });

                    // Создаем временную метку
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

                    // Обновляем карту в зависимости от наличия данных о встрече
                    if (this.state.useMeetingLocation) {
                        this.updateMapWithMeetingAddress();
                    } else {
                        this.finalizeMapInitialization();
                    }

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
     * Обновление карты с адресом из данных встречи через геокодирование
     */
    async updateMapWithMeetingAddress() {
        try {
            const fullAddress = `${this.config.placeInfo.address}, Севастополь`;
            console.log('Геокодирование адреса встречи:', fullAddress);

            const coordinates = await this.geocodeAddress(fullAddress);
            
            // Обновляем центр карты
            this.state.map.setCenter(coordinates, 16, {
                duration: 1000
            });

            // Обновляем позицию метки
            this.state.placemark.geometry.setCoordinates(coordinates);

            // Обновляем свойства метки
            this.state.placemark.properties.set({
                hintContent: this.config.placeInfo.name,
                balloonContent: `
                    <strong>${this.config.placeInfo.name}</strong><br>
                    ${this.config.placeInfo.address}<br>
                    <em>${this.config.placeInfo.description}</em>
                `
            });

            this.finalizeMapInitialization();
            console.log('Карта успешно обновлена с координатами встречи');

        } catch (error) {
            console.warn('Не удалось геокодировать адрес встречи, используем стандартное место:', error);
            // Возвращаем к стандартному месту
            this.state.useMeetingLocation = false;
            this.revertToDefaultLocation();
        }
    }

    /**
     * Возврат к стандартному местоположению
     */
    revertToDefaultLocation() {
        if (!this.state.map || !this.state.placemark) return;

        // Возвращаем карту к стандартным координатам
        this.state.map.setCenter(this.config.coordinates.default, 16, {
            duration: 1000
        });

        this.state.placemark.geometry.setCoordinates(this.config.coordinates.default);
        
        // Восстанавливаем стандартную информацию о месте
        this.config.placeInfo = {
            name: 'Кофейня "Том Сойер"',
            address: 'ул. Шмидта, 12, Севастополь',
            description: 'Место встреч киноклуба',
            vkLink: 'https://vk.com/tomsoyerbartending',
            tgBot: 'https://t.me/Odyssey_Cinema_Club_bot'
        };

        this.state.placemark.properties.set({
            hintContent: this.config.placeInfo.name,
            balloonContent: `
                <strong>${this.config.placeInfo.name}</strong><br>
                ${this.config.placeInfo.address}<br>
                <em>${this.config.placeInfo.description}</em>
            `
        });

        this.finalizeMapInitialization();
    }

    /**
     * Завершение инициализации карты
     */
    finalizeMapInitialization() {
        this.state.isInitialized = true;
        this.updateMapInfo();
        this.hideFallback();
        console.log('Карта полностью инициализирована');
    }

    /**
     * Генерация иконки для метки
     * Создает SVG иконку в формате base64 для метки на карте
     * 
     * @returns {string} - Data URL с SVG иконкой
     */
    generatePlacemarkIcon() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiM2YTExY2IiIGZpbGwtb3BhY2l0eT0iMC44IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIyMCIgeT0iMjUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSJib2xkIj7QmtC+PC90ZXh0Pgo8L3N2Zz4=';
    }

    /**
     * Обновление информации на карте
     * Обновляет текстовую информацию о месте встречи рядом с картой
     */
    updateMapInfo() {
        const infoElement = this.elements.container.querySelector('.map-info');
        if (!infoElement) return;

        // Добавляем информацию о фильме если есть
        let filmInfo = '';
        if (this.state.meetingData && this.state.meetingData.film) {
            filmInfo = `<p><strong>Обсуждаем:</strong> ${this.state.meetingData.film}</p>`;
        }

        // Добавляем информацию о дате и времени если есть
        let timeInfo = '';
        if (this.state.meetingData && this.state.meetingData.date && this.state.meetingData.time) {
            timeInfo = `<p><strong>Когда:</strong> ${this.state.meetingData.date} в ${this.state.meetingData.time}</p>`;
        }

        infoElement.innerHTML = `
            <h3>${this.config.placeInfo.name}</h3>
            <p>${this.config.placeInfo.address}</p>
            ${filmInfo}
            ${timeInfo}
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
     * Отображает запасной контент при недоступности Яндекс.Карт
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
     * Скрывает запасной контент при успешной загрузке карты
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
     * Создает HTML разметку для отображения когда карта недоступна
     * 
     * @returns {string} - HTML строка fallback-контента
     */
    generateFallbackHTML() {
        let filmInfo = '';
        if (this.state.meetingData && this.state.meetingData.film) {
            filmInfo = `<p><strong>Обсуждаем:</strong> ${this.state.meetingData.film}</p>`;
        }

        let timeInfo = '';
        if (this.state.meetingData && this.state.meetingData.date && this.state.meetingData.time) {
            timeInfo = `<p><strong>Когда:</strong> ${this.state.meetingData.date} в ${this.state.meetingData.time}</p>`;
        }

        return `
            <div>
                <div style="font-size:3rem;margin-bottom:1rem;">🗺️</div>
                <h3>Карта временно недоступна</h3>
                <p><strong>Место:</strong> ${this.config.placeInfo.name}</p>
                <p><strong>Адрес:</strong> ${this.config.placeInfo.address}</p>
                ${filmInfo}
                ${timeInfo}
                <p><em>${this.config.placeInfo.description}</em></p>
                <p style="font-size:0.9rem;opacity:0.8;">Мы встречаемся здесь каждую неделю!</p>
            </div>
        `;
    }

    /**
     * Очистка ресурсов
     * Уничтожает экземпляр карты и сбрасывает состояние модуля
     */
    destroy() {
        if (this.state.map) {
            this.state.map.destroy();
        }
        this.state = {
            map: null,
            placemark: null,
            isInitialized: false,
            fallbackDisplayed: false,
            meetingData: null,
            useMeetingLocation: false
        };
    }
}

/**
 * Функция инициализации модуля карты
 * Создает экземпляр MapModule с задержкой для стабилизации DOM
 */
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
