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
            },
            shareText: 'Присоединяйтесь к следующей встрече киноклуба Одиссея!',
            zonaPlus: {
                baseUrl: 'https://w140.zona.plus/search/',
                logoUrl: 'https://w140.zona.plus/build/6b6b2c89e58f3b1d4f402666f6d622c4.svg'
            }
        };

        this.state = {
            nextMeeting: null,
            countdownInterval: null,
            zonaLogoLoaded: false
        };

        this.init();
    }

    /**
     * Инициализация модуля
     */
    async init() {
        this.cacheDOM();
        await this.preloadZonaLogo();
        await this.loadData();
    }

    /**
     * Предзагрузка логотипа Zona.plus
     */
    async preloadZonaLogo() {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.state.zonaLogoLoaded = true;
                resolve();
            };
            img.onerror = resolve;
            img.src = this.config.zonaPlus.logoUrl;
        });
    }

    /**
     * Кэширование DOM элементов
     */
    cacheDOM() {
        this.elements = {};
        Object.keys(this.config.selectors).forEach(key => {
            this.elements[key] = document.querySelector(this.config.selectors[key]);
        });
    }

    /**
     * Загрузка данных о следующей встрече
     */
    async loadData() {
        try {
            this.showLoadingState();
            const data = await this.fetchData();

            if (data && typeof data === 'object') {
                this.state.nextMeeting = data;
                this.renderNextMeeting(data);
            } else {
                throw new Error('Неверный формат данных');
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showErrorState();
            this.loadMockData();
        }
    }

    /**
     * Загрузка данных с резервными путями
     */
    async fetchData() {
        const urls = [
            this.config.dataSources.nextMeeting,
            './data/next-meeting.json'
        ];

        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (!response.ok) continue;
                return await response.json();
            } catch {
                continue;
            }
        }
        throw new Error('Все источники недоступны');
    }

    /**
     * Загрузка демо-данных
     */
    loadMockData() {
        const mockData = {
            "date": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
            "time": "15:00",
            "place": "Кофейня \"Том Сойер\", ул. Шмидта, 12",
            "film": "Фильм будет анонсирован позже",
            "director": "Нет данных",
            "genre": "Нет данных",
            "country": "Нет данных",
            "year": new Date().getFullYear(),
            "poster": "../images/default-poster.jpg",
            "discussionNumber": Math.floor(Math.random() * 50) + 1,
            "cast": "Нет данных",
            "requirements": "Рекомендуем посмотреть фильм заранее"
        };

        this.state.nextMeeting = mockData;
        this.renderNextMeeting(mockData);
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
                </div>
            `;
        }
    }

    /**
     * Рендеринг информации о встрече
     */
    renderNextMeeting(meetingData) {
        if (!this.elements.nextMeetingContainer || !meetingData) {
            this.showErrorState();
            return;
        }

        const { date, time, place, film, director, genre, country, year, poster, discussionNumber, cast, requirements } = meetingData;
        const { defaults, zonaPlus } = this.config;

        // Проверка актуальности даты
        try {
            const meetingDate = this.parseDate(date || '');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (meetingDate < today) {
                this.showAnnouncementMessage();
                return;
            }
        } catch {
            // Продолжаем рендеринг даже при ошибке парсинга даты
        }

        const fullFilmTitle = film || 'Фильм';
        const kinopoiskUrl = this.generateKinopoiskUrl(film, year);
        const zonaUrl = this.generateZonaUrl(film);
        const shareData = this.prepareShareData(meetingData);

        this.elements.nextMeetingContainer.innerHTML = `
            <div class="next-meeting-card">
                <div class="next-meeting-poster">
                    <img src="${poster || defaults.poster}" 
                         alt="Постер: ${fullFilmTitle}" 
                         loading="lazy"
                         onerror="this.src='${defaults.poster}'">
                    <div class="next-meeting-badge">Обсуждение #${discussionNumber || 'N/A'}</div>
                </div>
                
                <div class="next-meeting-info">
                    <div class="next-meeting-header">
                        <h3 class="next-meeting-title">${this.escapeHtml(fullFilmTitle)} (${year || 'Год'})</h3>
                        <div class="next-meeting-meta">
                            <span class="next-meeting-datetime">
                                📅 ${date || 'Дата не указана'} 🕒 ${time || 'Время не указано'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="next-meeting-details">
                        ${this.createMeetingDetail('🎬', 'Режиссер:', director)}
                        ${this.createMeetingDetail('🎭', 'Жанр:', genre)}
                        ${this.createMeetingDetail('🌍', 'Страна:', country)}
                        ${this.createMeetingDetail('📍', 'Место:', place)}
                        ${this.createMeetingDetail('👥', 'В главных ролях:', cast)}
                    </div>
                    
                    <div id="meeting-countdown"></div>
                    
                    <div class="next-meeting-actions">
                        <div class="action-buttons">
                            ${kinopoiskUrl ? `
                                <a href="${kinopoiskUrl}" 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   class="next-meeting-kinopoisk-btn">
                                   🎬 КиноПоиск
                                </a>
                            ` : ''}
                            
                            <button class="next-meeting-share-btn" data-share='${JSON.stringify(shareData)}'>
                                📢 Поделиться
                            </button>
                        </div>
                    </div>
                    
                    <div class="next-meeting-requirements">
                        <p style="margin-bottom: 8px; font-weight: 600;">⚠️ <strong>Важно:</strong> ${this.escapeHtml(requirements || 'Рекомендуем посмотреть фильм заранее')}</p>
                        <ul style="margin: 0; padding-left: 20px; opacity: 0.9;">
                            <li>Ссылки ведут на сторонние ресурсы, не контролируемые киноклубом, такие как: "Zona.plus" и "КиноПоиск"</li>
                            <li>Мы не размещаем и не распространяем пиратский контент</li>
                            <li>Рекомендуем использовать легальные сервисы (Netflix, IVI, КиноПоиск и др.)</li>
                            <li>Администрация сайта не несет ответственности за содержимое внешних ссылок</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Инициализация таймера
        if (date && time) {
            this.initCountdown(date, time);
        }

        // Инициализация кнопки поделиться
        this.initShareButton();
    }

    /**
     * Извлечение русского названия фильма из строки
     * Обрабатывает форматы: "Название фильма", "English Title/Русское Название"
     * 
     * @param {string} filmString - Строка с названием фильма
     * @returns {string} - Русское название или исходная строка
     */
    extractRussianTitle(filmString) {
        if (!filmString || typeof filmString !== 'string') {
            return filmString || '';
        }

        // Разделяем строку по слэшу
        const parts = filmString.split('/');

        if (parts.length < 2) {
            // Если нет слэша, возвращаем как есть
            return filmString.trim();
        }

        // Ищем русское название (содержит кириллические символы)
        for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i].trim();
            // Проверяем, содержит ли часть кириллические символы
            if (/[а-яА-ЯёЁ]/.test(part)) {
                return part;
            }
        }

        // Если русское название не найдено, берем последнюю часть
        return parts[parts.length - 1].trim();
    }

    /**
     * Генерация URL для Zona.plus
     */
    generateZonaUrl(filmName) {
        if (!filmName) return null;

        const russianTitle = this.extractRussianTitle(filmName);
        const cleanName = russianTitle
            .replace(/[^\w\sа-яА-ЯёЁ\-:]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();

        const encodedName = encodeURIComponent(cleanName);
        return `${this.config.zonaPlus.baseUrl}${encodedName}`;
    }

    /**
     * Подготовка данных для шаринга
     */
    prepareShareData(meetingData) {
        const { film, date, time, place } = meetingData;
        const title = `🎬 Киноклуб Одиссея: ${film || 'Новая встреча'}`;
        const text = `${this.config.shareText}\n\n📅 ${date || 'Скоро'} | 🕒 ${time || '15:00'}\n📍 ${place || 'Кофейня "Том Сойер"'}\n\n`;
        const url = window.location.href;

        return { title, text, url };
    }

    /**
     * Инициализация кнопки поделиться
     */
    initShareButton() {
        const shareBtn = document.querySelector('.next-meeting-share-btn');
        if (!shareBtn) return;

        shareBtn.addEventListener('click', async () => {
            try {
                const shareData = JSON.parse(shareBtn.dataset.share);

                if (navigator.share) {
                    try {
                        await navigator.share(shareData);
                        return;
                    } catch (err) {
                        if (err.name !== 'AbortError') {
                            throw err;
                        }
                        return;
                    }
                }

                this.showShareModal(shareData);
            } catch (error) {
                console.error('Ошибка шаринга:', error);
                this.copyToClipboard(`${shareBtn.dataset.share ? JSON.parse(shareBtn.dataset.share).text : 'Присоединяйтесь к киноклубу Одиссея!'}`);
            }
        });
    }

    /**
     * Показать модальное окно шаринга
     */
    showShareModal(shareData) {
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="share-modal-content">
                <h3>Поделиться встречей</h3>
                <div class="share-options">
                    <a href="https://vk.com/share.php?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.title)}&comment=${encodeURIComponent(shareData.text)}"
                       target="_blank" class="share-option vk">
                        ВКонтакте
                    </a>
                    <a href="https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}"
                       target="_blank" class="share-option telegram">
                        Telegram
                    </a>
                    <button class="share-option copy" data-text="${encodeURIComponent(shareData.text + '\n\n' + shareData.url)}">
                        Скопировать ссылку
                    </button>
                </div>
                <button class="close-modal">Закрыть</button>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = '';
        };

        modal.querySelector('.close-modal').addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        modal.querySelector('.copy').addEventListener('click', (e) => {
            const text = decodeURIComponent(e.target.dataset.text);
            this.copyToClipboard(text);
            this.showNotification('Ссылка скопирована в буфер обмена!');
            setTimeout(closeModal, 1000);
        });

        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    }

    /**
     * Копирование текста в буфер обмена
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }

    /**
     * Показать уведомление
     */
    showNotification(message) {
        const oldNotification = document.querySelector('.share-notification');
        if (oldNotification) oldNotification.remove();

        const notification = document.createElement('div');
        notification.className = 'share-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Создание элемента детали встречи
     */
    createMeetingDetail(icon, label, value) {
        if (!value || value === 'Нет данных') return '';
        return `
            <div class="next-meeting-detail">
                <span class="detail-icon">${icon}</span>
                <span><strong>${label}</strong> ${this.escapeHtml(value)}</span>
            </div>
        `;
    }

    /**
     * Показать сообщение об анонсе
     */
    showAnnouncementMessage() {
        if (this.elements.nextMeetingContainer) {
            this.elements.nextMeetingContainer.innerHTML = `
                <div class="next-meeting-card">
                    <div class="next-meeting-info">
                        <div class="next-meeting-header">
                            <h3 class="next-meeting-title">Следующая встреча</h3>
                        </div>
                        <div class="next-meeting-description">
                            <p>${this.config.messages.meetingAnnouncement}</p>
                            <div class="social-links" style="margin-top: 1rem;">
                                <a href="https://vk.com/club199046020" target="_blank" class="btn btn--primary" style="margin-right: 0.5rem;">ВКонтакте</a>
                                <a href="https://t.me/Odyssey_Cinema_Club_bot" target="_blank" class="btn btn--outline">Telegram</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Инициализация таймера
     */
    initCountdown(dateStr, timeStr) {
        try {
            const meetingDateTime = this.parseMeetingDateTime(dateStr, timeStr);
            if (isNaN(meetingDateTime.getTime())) return;
            this.startCountdown(meetingDateTime);
        } catch {
            // Игнорируем ошибки таймера
        }
    }

    /**
     * Парсинг даты и времени
     */
    parseMeetingDateTime(dateStr, timeStr) {
        const [day, month, year] = dateStr.split('.').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes);
    }

    /**
     * Запуск таймера
     */
    startCountdown(targetDate) {
        if (this.state.countdownInterval) {
            clearInterval(this.state.countdownInterval);
        }

        const container = document.getElementById('meeting-countdown');
        if (!container) return;

        container.innerHTML = `
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
        </div>
    `;

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            if (distance < 0) {
                clearInterval(this.state.countdownInterval);
                container.innerHTML = `
                <div class="countdown-completed">
                    <span class="completed-icon">🎬</span>
                    <span>Встреча началась!</span>
                </div>
            `;
                return;
            }

            // Вычисляем единицы времени с секундами
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            this.updateCountdownElement('days', days);
            this.updateCountdownElement('hours', hours);
            this.updateCountdownElement('minutes', minutes);
            this.updateCountdownElement('seconds', seconds);
        };

        updateTimer();
        this.state.countdownInterval = setInterval(updateTimer, 1000); // Обновлять каждую секунду
    }

    /**
     * Обновление элемента таймера
     */
    updateCountdownElement(id, value) {
        const element = document.getElementById(`countdown-${id}`);
        if (element) {
            element.textContent = String(value).padStart(2, '0');
            // Добавляем анимацию только для секунд
            if (id === 'seconds') {
                element.classList.add('updated');
                setTimeout(() => element.classList.remove('updated'), 500);
            }
        }
    }

    /**
     * Парсинг даты
     */
    parseDate(dateString) {
        if (!dateString) return new Date(0);
        const match = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (match) {
            const [, day, month, year] = match.map(Number);
            return new Date(year, month - 1, day);
        }
        return new Date(dateString);
    }

    /**
     * Генерация URL для КиноПоиска
     * Создает ссылку для поиска информации о фильме на КиноПоиске
     * 
     * @param {string} filmName - Название фильма
     * @param {string} filmYear - Год выпуска фильма
     * @returns {string|null} - URL для поиска на КиноПоиске или null при ошибке
     */
    generateKinopoiskUrl(filmName, filmYear) {
        if (!filmName || filmName === 'Фильм будет анонсирован позже' || filmName === 'Еще не выбран') {
            return null;
        }

        // Извлекаем русское название для поиска
        const russianTitle = this.extractRussianTitle(filmName);

        if (!russianTitle) return null;

        // Очищаем название фильма от специальных символов
        const cleanName = russianTitle
            .replace(/[^\w\sа-яА-ЯёЁ\-:]/gi, ' ')  // Оставляем дефисы и двоеточия
            .replace(/\s+/g, ' ')  // Убираем лишние пробелы
            .trim();

        if (!cleanName) return null;

        // Собираем поисковый запрос
        const searchQuery = filmYear && filmYear > 1900 ?
            `${cleanName} ${filmYear}` :
            cleanName;

        const encodedQuery = encodeURIComponent(searchQuery);
        return `https://www.kinopoisk.ru/index.php?kp_query=${encodedQuery}`;
    }

    /**
     * Экранирование HTML
     */
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Обновление данных о встрече
     */
    updateMeetingData(newData) {
        if (newData && typeof newData === 'object') {
            this.state.nextMeeting = newData;
            this.renderNextMeeting(newData);
            return true;
        }
        return false;
    }

    /**
     * Принудительное обновление
     */
    async forceRefresh() {
        await this.loadData();
    }

    /**
     * Очистка ресурсов
     */
    destroy() {
        if (this.state.countdownInterval) {
            clearInterval(this.state.countdownInterval);
        }
    }
}

/**
 * Инициализация модуля
 */
function initNextMeetingModule() {
    if (document.querySelector('#next-meeting')) {
        window.nextMeetingModule = new NextMeetingModule();
    }
}

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNextMeetingModule);
} else {
    initNextMeetingModule();
}
