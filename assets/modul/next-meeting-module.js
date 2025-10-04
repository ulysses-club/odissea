/**
 * Модуль для управления секцией "Ближайшая встреча"
 */
class NextMeetingModule {
    constructor() {
        this.config = {
            dataSources: {
                nextMeeting: '../data/next-meeting.json'
            },
            selectors: {
                nextMeetingContainer: '#next-meeting-container'
            },
            defaults: {
                poster: '../images/default-poster.jpg'
            },
            messages: {
                loading: 'Загрузка информации о встрече...',
                noMeeting: 'Информация о следующей встрече пока не доступна',
                meetingAnnouncement: 'Ближайшая встреча будет анонсирована позже'
            }
        };

        this.state = {
            nextMeeting: null,
            countdownInterval: null
        };

        this.init();
    }

    /**
     * Инициализация модуля
     */
    async init() {
        console.log('Инициализация NextMeetingModule...');
        this.cacheDOM();
        await this.loadData();
    }

    /**
     * Кэширование DOM элементов
     */
    cacheDOM() {
        this.elements = {};
        Object.keys(this.config.selectors).forEach(key => {
            this.elements[key] = document.querySelector(this.config.selectors[key]);
        });

        console.log('Найденные элементы NextMeetingModule:', this.elements);
    }

    /**
     * Загрузка данных о следующей встрече
     */
    async loadData() {
        try {
            this.showLoadingState();
            console.log('Начинаем загрузку данных о встрече...');
            
            const data = await this.fetchLocalData();
            console.log('Получены данные о встрече:', data);
            
            if (data && typeof data === 'object') {
                this.state.nextMeeting = data;
                this.renderNextMeeting(data);
            } else {
                throw new Error('Неверный формат данных о встрече');
            }
            
        } catch (error) {
            console.error('Ошибка загрузки данных о встрече:', error);
            this.showErrorState();
            
            // Пробуем загрузить демо-данные
            try {
                console.log('Пробуем загрузить демо-данные о встрече...');
                const mockData = this.loadMockMeetingData();
                this.state.nextMeeting = mockData;
                this.renderNextMeeting(mockData);
                console.log('Демо-данные о встрече загружены успешно');
            } catch (mockError) {
                console.error('Ошибка загрузки демо-данных о встрече:', mockError);
            }
        }
    }

    /**
     * Загрузка данных локально
     */
    async fetchLocalData() {
        try {
            console.log('Пробуем загрузить локальные данные о встрече...');
            const response = await fetch(this.config.dataSources.nextMeeting);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Локальные данные о встрече загружены:', data);
            return data;
            
        } catch (error) {
            console.error('Ошибка загрузки локальных данных о встрече:', error);
            
            // Пробуем альтернативный путь
            try {
                console.log('Пробуем альтернативный путь для данных о встрече...');
                const altResponse = await fetch('./data/next-meeting.json');
                
                if (!altResponse.ok) {
                    throw new Error(`Alternative HTTP error! status: ${altResponse.status}`);
                }
                
                const altData = await altResponse.json();
                console.log('Альтернативные данные о встрече загружены:', altData);
                return altData;
                
            } catch (altError) {
                console.error('Ошибка загрузки альтернативных данных о встрече:', altError);
                throw new Error('Все источники данных о встрече недоступны');
            }
        }
    }

    /**
     * Загрузка демонстрационных данных о встрече
     */
    loadMockMeetingData() {
        console.log('Загрузка демо-данных о встрече');
        return {
            "date": "05.10.2025",
            "time": "15:00",
            "place": "Кофейня \"Том Сойер\", ул. Шмидта, 12",
            "film": "Suna no onna/Женщина в песках",
            "director": "Хироси Тэсигахара",
            "genre": "Триллер, Драма",
            "country": "Япония",
            "year": 1964,
            "poster": "https://sun9-62.vkuserphoto.ru/s/v1/ig2/Tq9FLNYDLD2Q7VKcS3H2RCyw4oqjepBQQhke4dPsRy3wRhhIrF1vs_Xw0HcUjCVscVZozsvOl8_qK8jcxqWbI8e_.jpg?quality=95&as=32x40,48x60,72x89,108x134,160x199,240x298,360x447,480x596,540x671,640x795,720x894,1080x1342,1280x1590,1288x1600&from=bu&cs=1288x0",
            "discussionNumber": 260,
            "description": "Инженер, отправившийся в экспедицию для изучения насекомых, оказывается в ловушке в песчаной яме вместе с загадочной женщиной.",
            "requirements": "Рекомендуем посмотреть фильм заранее"
        };
    }

    /**
     * Показать состояние загрузки
     */
    showLoadingState() {
        if (this.elements.nextMeetingContainer) {
            this.elements.nextMeetingContainer.innerHTML = `
                <div class="loading-message">
                    <div class="spinner" aria-hidden="true"></div>
                    ${this.config.messages.loading}
                </div>
            `;
        }
    }

    /**
     * Показать состояние ошибки
     */
    showErrorState() {
        if (this.elements.nextMeetingContainer) {
            this.elements.nextMeetingContainer.innerHTML = `
                <div class="no-data">
                    <p>${this.config.messages.noMeeting}</p>
                    <p>Следите за обновлениями в наших соцсетях</p>
                </div>
            `;
        }
    }

    /**
     * Рендеринг информации о следующей встрече
     */
    renderNextMeeting(meetingData) {
        if (!this.elements.nextMeetingContainer || !meetingData || typeof meetingData !== 'object') {
            this.showErrorState();
            return;
        }

        const { defaults, messages } = this.config;
        const { date, time, place, film, director, genre, country, year, poster, discussionNumber, description, requirements } = meetingData;

        // Проверяем, актуальна ли дата встречи
        try {
            const meetingDate = this.parseDate(date || '');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (meetingDate < today) {
                this.elements.nextMeetingContainer.innerHTML = `
                    <div class="next-meeting-card">
                        <div class="next-meeting-info">
                            <div class="next-meeting-header">
                                <h3 class="next-meeting-title">Следующая встреча</h3>
                            </div>
                            <div class="next-meeting-description">
                                <p>${messages.meetingAnnouncement}</p>
                                <p>Следите за обновлениями в наших соцсетях:</p>
                                <div style="margin-top: 1rem;">
                                    <a href="https://vk.com/club199046020" target="_blank" class="btn btn--primary" style="margin-right: 0.5rem;">ВКонтакте</a>
                                    <a href="https://t.me/Odyssey_Cinema_Club_bot" target="_blank" class="btn btn--outline">Telegram</a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                return;
            }
        } catch (dateError) {
            console.warn('Ошибка парсинга даты:', dateError);
        }

        // Генерируем ссылку на КиноПоиск
        const kinopoiskUrl = this.generateKinopoiskUrl(film, year);

        // HTML с местом для таймера
        this.elements.nextMeetingContainer.innerHTML = `
            <div class="next-meeting-card">
                <div class="next-meeting-poster">
                    <img src="${poster || defaults.poster}" alt="Постер: ${film || 'Фильм'} (${year || 'Год'})" loading="lazy" onerror="this.src='${defaults.poster}'">
                    <div class="next-meeting-badge">Обсуждение #${discussionNumber || 'N/A'}</div>
                </div>
                <div class="next-meeting-info">
                    <div class="next-meeting-header">
                        <h3 class="next-meeting-title">${this.escapeHtml(film || 'Фильм')} (${year || 'Год'})</h3>
                        <div class="next-meeting-meta">
                            <span class="next-meeting-datetime">📅 ${date || 'Дата не указана'} 🕒 ${time || 'Время не указано'}</span>
                        </div>
                    </div>
                    <div class="next-meeting-details">
                        ${this.createMeetingDetail('🎬', 'Режиссер:', director)}
                        ${this.createMeetingDetail('🎭', 'Жанр:', genre)}
                        ${this.createMeetingDetail('🌍', 'Страна:', country)}
                        ${this.createMeetingDetail('📍', 'Место:', place)}
                    </div>
                    
                    <div id="meeting-countdown"></div>
                    
                    ${description ? `
                        <div class="next-meeting-description">
                            <p>${this.escapeHtml(description)}</p>
                        </div>
                    ` : ''}
                    
                    ${kinopoiskUrl ? `
                        <a href="${kinopoiskUrl}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           class="next-meeting-kinopoisk-btn">
                           🎬 Информация о фильме на КиноПоиске
                        </a>
                    ` : ''}
                    ${requirements ? `<div class="next-meeting-requirements"><p>⚠️ <strong>Важно:</strong> ${this.escapeHtml(requirements)}</p></div>` : ''}
                </div>
            </div>
        `;

        // Инициализация таймера
        this.initCountdown(date, time);
    }

    /**
     * Создание HTML-элемента детали информации о встрече
     */
    createMeetingDetail(icon, label, value) {
        return value ? `<div class="next-meeting-detail"><span class="detail-icon">${icon}</span><span><strong>${label}</strong> ${this.escapeHtml(value)}</span></div>` : '';
    }

    /**
     * Инициализация таймера обратного отсчета
     */
    initCountdown(dateStr, timeStr) {
        if (!dateStr || !timeStr) {
            const countdownContainer = document.getElementById('meeting-countdown');
            if (countdownContainer) {
                countdownContainer.innerHTML = `<div class="countdown-error"><p>Дата и время встречи не указаны</p></div>`;
            }
            return;
        }

        try {
            const meetingDateTime = this.parseMeetingDateTime(dateStr, timeStr);
            if (!meetingDateTime || isNaN(meetingDateTime.getTime())) {
                throw new Error('Неверный формат даты или времени');
            }

            this.startCountdown(meetingDateTime);
        } catch (error) {
            console.error('Ошибка инициализации таймера:', error);
            const countdownContainer = document.getElementById('meeting-countdown');
            if (countdownContainer) {
                countdownContainer.innerHTML = `<div class="countdown-error"><p>Таймер временно недоступен</p></div>`;
            }
        }
    }

    /**
     * Парсит дату и время встречи в объект Date
     */
    parseMeetingDateTime(dateStr, timeStr) {
        const [day, month, year] = dateStr.split('.').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);

        return new Date(year, month - 1, day, hours, minutes);
    }

    /**
     * Запускает обратный отсчет
     */
    startCountdown(targetDate) {
        // Очищаем предыдущий интервал
        if (this.state.countdownInterval) {
            clearInterval(this.state.countdownInterval);
        }

        const countdownContainer = document.getElementById('meeting-countdown');
        if (!countdownContainer) return;

        // Создаем HTML структуру таймера
        countdownContainer.innerHTML = `
            <div class="countdown-timer">
                <div class="countdown-title">До встречи осталось:</div>
                <div class="countdown-grid">
                    <div class="countdown-item">
                        <div class="countdown-number" id="countdown-days">--</div>
                        <div class="countdown-label">дней</div>
                    </div>
                    <div class="countdown-item">
                        <div class="countdown-number" id="countdown-hours">--</div>
                        <div class="countdown-label">часов</div>
                    </div>
                    <div class="countdown-item">
                        <div class="countdown-number" id="countdown-minutes">--</div>
                        <div class="countdown-label">минут</div>
                    </div>
                    <div class="countdown-item">
                        <div class="countdown-number" id="countdown-seconds">--</div>
                        <div class="countdown-label">секунд</div>
                    </div>
                </div>
                <div class="countdown-completed" style="display: none;">
                    <span class="completed-icon">🎬</span>
                    <span>Встреча началась!</span>
                </div>
            </div>
        `;

        let previousValues = {
            days: -1,
            hours: -1,
            minutes: -1,
            seconds: -1
        };

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            // Если время истекло
            if (distance < 0) {
                this.showCompletedMessage();
                clearInterval(this.state.countdownInterval);
                return;
            }

            // Вычисляем единицы времени
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Обновляем отображение только если значения изменились
            this.updateNumberIfChanged('days', days, previousValues.days);
            this.updateNumberIfChanged('hours', hours, previousValues.hours);
            this.updateNumberIfChanged('minutes', minutes, previousValues.minutes);
            this.updateNumberIfChanged('seconds', seconds, previousValues.seconds);

            // Сохраняем текущие значения
            previousValues = { days, hours, minutes, seconds };
        };

        // Запускаем обновление каждую секунду
        updateTimer();
        this.state.countdownInterval = setInterval(updateTimer, 1000);
    }

    /**
     * Обновляет число в таймере если оно изменилось
     */
    updateNumberIfChanged(unit, newValue, oldValue) {
        if (newValue !== oldValue) {
            const element = document.getElementById(`countdown-${unit}`);
            if (element) {
                // Добавляем анимацию обновления
                element.classList.remove('updated');
                void element.offsetWidth; // Trigger reflow
                element.textContent = String(newValue).padStart(2, '0');
                element.classList.add('updated');
            }
        }
    }

    /**
     * Показывает сообщение о завершении отсчета
     */
    showCompletedMessage() {
        const countdownContainer = document.getElementById('meeting-countdown');
        if (!countdownContainer) return;

        const grid = countdownContainer.querySelector('.countdown-grid');
        const completedMessage = countdownContainer.querySelector('.countdown-completed');

        if (grid && completedMessage) {
            grid.style.display = 'none';
            completedMessage.style.display = 'flex';
        }
    }

    /**
     * Вспомогательные методы
     */
    parseDate(dateString) {
        if (!dateString) return new Date(0);
        const ddMMyyyyMatch = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (ddMMyyyyMatch) {
            const day = parseInt(ddMMyyyyMatch[1], 10);
            const month = parseInt(ddMMyyyyMatch[2], 10) - 1;
            const year = parseInt(ddMMyyyyMatch[3], 10);
            const result = new Date(year, month, day);
            return isNaN(result.getTime()) ? new Date(0) : result;
        }
        const result = new Date(dateString);
        return isNaN(result.getTime()) ? new Date(0) : result;
    }

    generateKinopoiskUrl(filmName, filmYear) {
        if (!filmName) return null;
        const cleanName = filmName
            .replace(/[^\w\sа-яА-ЯёЁ]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const searchQuery = filmYear ? `${cleanName} ${filmYear}` : cleanName;
        const encodedQuery = encodeURIComponent(searchQuery);
        return `https://www.kinopoisk.ru/index.php?kp_query=${encodedQuery}`;
    }

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

    /**
     * Очистка ресурсов
     */
    destroy() {
        if (this.state.countdownInterval) {
            clearInterval(this.state.countdownInterval);
            this.state.countdownInterval = null;
        }
    }
}

// Инициализация модуля
function initNextMeetingModule() {
    console.log('Проверяем наличие секции next-meeting...');
    if (document.querySelector('#next-meeting')) {
        console.log('Секция next-meeting найдена, инициализируем модуль...');
        window.nextMeetingModule = new NextMeetingModule();
    } else {
        console.log('Секция next-meeting НЕ найдена!');
    }
}

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
    console.log('DOM еще загружается, ждем DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initNextMeetingModule);
} else {
    console.log('DOM уже загружен, инициализируем сразу...');
    initNextMeetingModule();
}