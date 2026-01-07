class NextMeetingModule {
    constructor() {
        this.config = {
            dataUrl: '../data/next-meeting.json',
            fallbackPoster: '../images/default-poster.jpg',
            messages: {
                loading: 'Загрузка информации о встрече...',
                noMeeting: 'Следующая встреча пока не запланирована',
                meetingSoon: 'Следующая встреча скоро будет анонсирована'
            }
        };

        this.state = {
            meeting: null,
            countdownInterval: null,
            modal: null,
            lastUpdate: 0,
            cacheKey: 'nextMeetingCache'
        };

        // Предварительное связывание обработчиков
        this.handleVKShare = this.handleVKShare.bind(this);
        this.handleTGShare = this.handleTGShare.bind(this);
        this.handleCopyInfo = this.handleCopyInfo.bind(this);
        this.handlePosterClick = this.handlePosterClick.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.updateCountdown = this.updateCountdown.bind(this);

        this.init();
    }

    async init() {
        const container = document.getElementById('next-meeting-container');
        if (!container) return;

        // Проверяем кэш
        const cached = this.getCachedData();
        if (cached && this.isCacheValid(cached.timestamp)) {
            this.renderMeeting(cached.data);
        } else {
            this.showLoading(container);
            await this.loadMeeting();
        }

        // Глобальные обработчики
        this.setupGlobalListeners();
    }

    /**
     * Получить данные из кэша
     */
    getCachedData() {
        try {
            const cached = localStorage.getItem(this.state.cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    }

    /**
     * Проверить валидность кэша (15 минут)
     */
    isCacheValid(timestamp) {
        return Date.now() - timestamp < 15 * 60 * 1000;
    }

    /**
     * Сохранить данные в кэш
     */
    cacheData(data) {
        try {
            localStorage.setItem(this.state.cacheKey, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Ошибка кэширования:', error);
        }
    }

    /**
     * Загрузка данных встречи
     */
    async loadMeeting() {
        try {
            const response = await fetch(this.config.dataUrl, {
                cache: 'no-cache',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) throw new Error('Network response not ok');

            const data = await response.json();
            
            if (data && Object.keys(data).length > 0) {
                // Автоматически определяем день недели
                data.weekday = this.getWeekdayFromDate(data.date);
                
                // Добавляем информацию о боте
                data.botInfo = {
                    username: '@Odyssey_Cinema_Club_bot',
                    schedule: 'Каждую пятницу в 14:00',
                    description: 'Получайте анонсы встреч первыми'
                };
                
                this.state.meeting = data;
                this.cacheData(data);
                this.renderMeeting(data);
            } else {
                this.showNoMeeting();
            }
        } catch (error) {
            console.warn('Ошибка загрузки встречи:', error);
            this.showFallbackMeeting();
        }
    }

    /**
     * Показать состояние загрузки
     */
    showLoading(container) {
        container.innerHTML = `
            <div class="next-meeting-loading">
                <div class="loading-spinner" aria-hidden="true"></div>
                <p class="important-text">${this.config.messages.loading}</p>
            </div>
        `;
    }

    /**
     * Показать резервную встречу
     */
    showFallbackMeeting() {
        const fallbackData = {
            film: 'Фильм будет анонсирован',
            year: new Date().getFullYear(),
            date: 'Скоро',
            time: '15:00',
            place: 'Кофейня "Том Сойер"',
            director: 'Скоро узнаем',
            genre: 'Сюрприз',
            country: 'Международный',
            cast: 'Скоро узнаем',
            poster: this.config.fallbackPoster,
            discussionNumber: Math.floor(Math.random() * 50) + 1,
            requirements: 'Следите за обновлениями в наших соцсетях',
            weekday: null,
            botInfo: {
                username: '@Odyssey_Cinema_Club_bot',
                schedule: 'Каждую пятницу в 14:00',
                description: 'Получайте анонсы встреч первыми'
            }
        };

        this.renderMeeting(fallbackData);
    }

    /**
     * Показать сообщение об отсутствии встречи
     */
    showNoMeeting() {
        const container = document.getElementById('next-meeting-container');
        if (!container) return;

        container.innerHTML = `
            <div class="next-meeting-empty">
                <h3 class="meeting-title">🎬 Ждем следующую встречу!</h3>
                <p class="important-text">${this.config.messages.meetingSoon}</p>
                <div class="meeting-actions" style="margin-top: var(--space-lg);">
                    <a href="https://vk.com/club199046020" target="_blank" 
                       class="meeting-btn meeting-btn--vk">
                        ВКонтакте
                    </a>
                    <a href="https://t.me/Odyssey_Cinema_Club_bot" target="_blank"
                       class="meeting-btn meeting-btn--tg">
                        Telegram
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * Рендер встречи
     */
    renderMeeting(data) {
        const container = document.getElementById('next-meeting-container');
        if (!container) return;

        container.innerHTML = this.generateMeetingHTML(data);
        this.setupMeetingInteractions(data);
    }

    /**
     * Генерация HTML встречи
     */
    generateMeetingHTML(data) {
        const {
            film,
            year,
            date,
            time,
            place,
            director,
            genre,
            country,
            cast,
            poster,
            discussionNumber,
            requirements,
            weekday,
            botInfo
        } = data;

        const kinopoiskUrl = this.generateKinopoiskUrl(film, year);
        const shareData = this.prepareShareData(data);
        
        // Генерация таймера если есть дата и время
        const countdownHTML = date && time && date !== 'Скоро' ? `
            <div class="countdown-wrapper">
                ${this.generateCountdownHTML(date, time)}
            </div>
        ` : '';

        return `
            <div class="next-meeting-card">
                <div class="meeting-top-section">
                    <!-- Левая колонка: информация о фильме и таймер -->
                    <div class="meeting-info-container">
                        <div class="meeting-main-info">
                            <div class="meeting-header">
                                <h3 class="meeting-title">${this.escapeHtml(film)}</h3>
                                <div style="display: flex; align-items: center; gap: var(--space-sm); flex-wrap: wrap;">
                                    <span class="meeting-year">🎬 ${year || 'Год не указан'}</span>
                                </div>
                            </div>

                            <!-- Детали фильма -->
                            <div class="meeting-details-grid">
                                ${this.renderDetailItem('🎬 Режиссер', director)}
                                ${this.renderDetailItem('🎭 Жанр', genre)}
                                ${this.renderDetailItem('🌍 Страна', country)}
                                ${this.renderDetailItem('📍 Место встречи', place)}
                                ${this.renderDetailItem('📅 Дата встречи', date)}
                                ${this.renderDetailItem('🕒 Время встречи', time)}
                            </div>

                            <!-- Актеры -->
                            ${cast && cast !== 'Нет данных' ? `
                                <div class="meeting-detail-item" style="grid-column: span 2;">
                                    <div class="detail-label">👥 В главных ролях</div>
                                    <div class="detail-value">${this.escapeHtml(cast)}</div>
                                </div>
                            ` : ''}

                            <!-- Неделя встречи -->
                            <div class="meeting-header">
                                <h3 class="meeting-detail-item">Неделя встречи: ${weekday ? `<span class="meeting-weekday">${weekday}</span>` : ''}</h3>
                                <div style="display: flex; align-items: center; gap: var(--space-sm); flex-wrap: wrap;">
                                    
                                </div>
                            </div>
                            
                            <!-- Таймер -->
                            ${countdownHTML}
                        </div>
                    </div>

                    <!-- Правая колонка: постер -->
                    <div class="meeting-poster-container">
                        <div class="meeting-poster" data-poster="${poster}">
                            <div class="poster-watermark-container">
                                <img src="${poster}" 
                                     alt="Постер фильма: ${this.escapeHtml(film)}"
                                     loading="lazy"
                                     class="poster-with-watermark"
                                     onerror="this.src='${this.config.fallbackPoster}'">
                                <div class="poster-watermark">ОДИССЕЯ</div>
                            </div>
                            <div class="meeting-poster-badge">
                                Обсуждение #${discussionNumber || 'XX'}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Информация о боте и рассылке -->
                <div class="bot-info">
                    <div class="bot-info-content">
                        <p class="bot-info-text">
                            Подпишитесь на нашего бота: 
                            <a href="https://t.me/Odyssey_Cinema_Club_bot" target="_blank" 
                               class="bot-info-link">${botInfo?.username || '@Odyssey_Cinema_Club_bot'}</a>
                        </p>
                        <p class="bot-info-text">
                            ${botInfo?.schedule || 'Каждую пятницу в 14:00'} получайте анонсы встреч
                        </p>
                        <p class="bot-info-text">
                            Узнавайте первыми: что смотрим, когда и где собираемся
                        </p>
                    </div>
                </div>

                <!-- Нижняя часть с кнопками и важной информацией -->
                <div class="meeting-bottom-section">
                    <!-- Кнопки действий -->
                    <div class="meeting-actions">
                        ${kinopoiskUrl ? `
                            <a href="${kinopoiskUrl}" 
                               target="_blank" 
                               rel="noopener noreferrer"
                               class="meeting-btn meeting-btn--primary"
                               title="Посмотреть информацию о фильме на КиноПоиске">
                               <span class="btn-icon">🎬</span>
                               <span class="btn-text">КиноПоиск</span>
                               <span class="btn-hint">Инфо</span>
                            </a>
                        ` : ''}
                        
                        <button class="meeting-btn meeting-btn--vk" 
                                data-share='${JSON.stringify(shareData)}'
                                title="Поделиться информацией о встрече во ВКонтакте">
                            <span class="btn-icon">📱</span>
                            <span class="btn-text">ВКонтакте</span>
                            <span class="btn-hint">Поделиться</span>
                        </button>
                        
                        <button class="meeting-btn meeting-btn--tg" 
                                data-share='${JSON.stringify(shareData)}'
                                title="Поделиться информацией о встрече в Telegram">
                            <span class="btn-icon">✈️</span>
                            <span class="btn-text">Telegram</span>
                            <span class="btn-hint">Поделиться</span>
                        </button>
                        
                        <button class="meeting-btn meeting-btn--copy" 
                                data-share='${JSON.stringify(shareData)}'
                                title="Скопировать информацию о встрече">
                            <span class="btn-icon">📋</span>
                            <span class="btn-text">Скопировать</span>
                            <span class="btn-hint">Поделиться</span>
                        </button>
                    </div>

                    <!-- Важная информация -->
                    <div class="meeting-important">
                        ${requirements ? `<p class="important-text">${this.escapeHtml(requirements)}</p>` : ''}
                        <ul class="meeting-important-list">
                            <li>Ссылки ведут на сторонние ресурсы, не контролируемые киноклубом, такие как: "КиноПоиск"</li>
                            <li>Мы не размещаем и не распространяем пиратский контент</li>
                            <li>Рекомендуем использовать легальные сервисы (Netflix, IVI, КиноПоиск и др.)</li>
                            <li>Администрация сайта не несет ответственности за содержимое внешних ссылок</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Генерация элемента деталей
     */
    renderDetailItem(label, value) {
        if (!value || value === 'Нет данных') return '';
        return `
            <div class="meeting-detail-item">
                <div class="detail-label">${label}</div>
                <div class="detail-value">${this.escapeHtml(value)}</div>
            </div>
        `;
    }

    /**
     * Генерация HTML таймера
     */
    generateCountdownHTML(dateStr, timeStr) {
        return `
            <div class="meeting-countdown">
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
    }

    /**
     * Получить день недели по дате
     */
    getWeekdayFromDate(dateStr) {
        if (!dateStr || dateStr === 'Скоро') return null;
        
        try {
            const [day, month, year] = dateStr.split('.').map(Number);
            const date = new Date(year, month - 1, day);
            
            const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 
                             'Четверг', 'Пятница', 'Суббота'];
            
            return weekdays[date.getDay()];
        } catch (error) {
            console.warn('Ошибка определения дня недели:', error);
            return null;
        }
    }

    /**
     * Настройка интерактивных элементов
     */
    setupMeetingInteractions(data) {
        // Обработчик постера
        const poster = document.querySelector('.meeting-poster');
        if (poster) {
            poster.addEventListener('click', this.handlePosterClick);
        }

        // Обработчики кнопок шеринга
        const vkBtn = document.querySelector('.meeting-btn--vk');
        if (vkBtn) {
            vkBtn.addEventListener('click', this.handleVKShare);
        }

        const tgBtn = document.querySelector('.meeting-btn--tg');
        if (tgBtn) {
            tgBtn.addEventListener('click', this.handleTGShare);
        }

        const copyBtn = document.querySelector('.meeting-btn--copy');
        if (copyBtn) {
            copyBtn.addEventListener('click', this.handleCopyInfo);
        }

        // Запуск таймера
        if (data.date && data.time && data.date !== 'Скоро') {
            this.startCountdown(data.date, data.time);
        }
    }

    /**
     * Запуск таймера обратного отсчета
     */
    startCountdown(dateStr, timeStr) {
        if (this.state.countdownInterval) {
            clearInterval(this.state.countdownInterval);
        }

        const targetDate = this.parseDateTime(dateStr, timeStr);
        if (isNaN(targetDate.getTime())) return;

        // Первое обновление
        this.updateCountdown(targetDate);

        // Интервал обновления
        this.state.countdownInterval = setInterval(() => {
            this.updateCountdown(targetDate);
        }, 1000);
    }

    /**
     * Обновление таймера
     */
    updateCountdown(targetDate) {
        const now = Date.now();
        const diff = targetDate.getTime() - now;

        if (diff <= 0) {
            this.showMeetingStarted();
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Обновляем значения
        const updateElement = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value.toString().padStart(2, '0');
        };

        updateElement('countdown-days', days);
        updateElement('countdown-hours', hours);
        updateElement('countdown-minutes', minutes);
        updateElement('countdown-seconds', seconds);
    }

    /**
     * Показать что встреча началась
     */
    showMeetingStarted() {
        if (this.state.countdownInterval) {
            clearInterval(this.state.countdownInterval);
        }

        const countdownEl = document.querySelector('.meeting-countdown');
        if (countdownEl) {
            countdownEl.innerHTML = `
                <div class="meeting-important">
                    <p class="important-text" style="text-align: center; color: var(--accent);">
                        🎬 Встреча началась! Присоединяйтесь!
                    </p>
                </div>
            `;
        }
    }

    /**
     * Обработчик клика на постер
     */
    handlePosterClick(event) {
        const poster = event.currentTarget;
        const imgUrl = poster.dataset.poster || this.config.fallbackPoster;
        const title = document.querySelector('.meeting-title')?.textContent || 'Постер фильма';

        this.showImageModal(imgUrl, title);
    }

    /**
     * Показать модальное окно с изображением
     */
    showImageModal(imgUrl, title) {
        if (this.state.modal) return;

        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-overlay" data-close="true"></div>
            <button class="image-modal-close" aria-label="Закрыть">&times;</button>
            <img src="${imgUrl}" 
                 alt="${this.escapeHtml(title)}" 
                 class="image-modal-img"
                 loading="eager"
                 onerror="this.src='${this.config.fallbackPoster}'">
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        this.state.modal = modal;

        // Анимация появления
        setTimeout(() => modal.classList.add('active'), 10);

        // Обработчики закрытия
        const closeElements = modal.querySelectorAll('[data-close], .image-modal-close');
        closeElements.forEach(el => {
            el.addEventListener('click', this.closeModal);
        });
    }

    /**
     * Закрыть модальное окно
     */
    closeModal() {
        if (!this.state.modal) return;

        const modal = this.state.modal;
        modal.classList.remove('active');

        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            this.state.modal = null;
            document.body.style.overflow = '';
        }, 300);
    }

    /**
     * Обработчик кнопки "Поделиться ВКонтакте"
     */
    handleVKShare(event) {
        try {
            const shareBtn = event.currentTarget;
            const shareData = JSON.parse(shareBtn.dataset.share || '{}');
            
            const vkUrl = `https://vk.com/share.php?` +
                `url=${encodeURIComponent(shareData.url)}&` +
                `title=${encodeURIComponent(shareData.title)}&` +
                `description=${encodeURIComponent(shareData.text)}&` +
                `image=${encodeURIComponent(shareData.image || '')}&` +
                `noparse=true`;
            
            window.open(vkUrl, '_blank', 'width=550,height=400');
        } catch (error) {
            console.warn('Ошибка шеринга ВК:', error);
            this.showNotification('Не удалось открыть ВКонтакте');
        }
    }

    /**
     * Обработчик кнопки "Поделиться в Telegram"
     */
    handleTGShare(event) {
        try {
            const shareBtn = event.currentTarget;
            const shareData = JSON.parse(shareBtn.dataset.share || '{}');
            
            const tgUrl = `https://t.me/share/url?` +
                `url=${encodeURIComponent(shareData.url)}&` +
                `text=${encodeURIComponent(`${shareData.title}\n\n${shareData.text}`)}`;
            
            window.open(tgUrl, '_blank', 'width=550,height=400');
        } catch (error) {
            console.warn('Ошибка шеринга Telegram:', error);
            this.showNotification('Не удалось открыть Telegram');
        }
    }

    /**
     * Обработчик кнопки "Скопировать информацию" - ИСПРАВЛЕННЫЙ
     */
    async handleCopyInfo(event) {
        try {
            const shareBtn = event.currentTarget;
            const shareData = JSON.parse(shareBtn.dataset.share || '{}');
            
            // Получаем данные из DOM безопасным способом
            const filmTitle = document.querySelector('.meeting-title')?.textContent || '';
            const filmYearElement = document.querySelector('.meeting-year');
            const filmYear = filmYearElement ? filmYearElement.textContent.replace('🎬 ', '') : '';
            const weekdayElement = document.querySelector('.meeting-weekday');
            const weekday = weekdayElement ? weekdayElement.textContent : '';
            
            // Получаем место, дату и время из деталей
            let place = '';
            let date = '';
            let time = '';
            
            // Ищем все детали
            const detailItems = document.querySelectorAll('.meeting-detail-item');
            detailItems.forEach(item => {
                const label = item.querySelector('.detail-label');
                const value = item.querySelector('.detail-value');
                
                if (label && value) {
                    const labelText = label.textContent;
                    const valueText = value.textContent;
                    
                    if (labelText.includes('Место встречи')) {
                        place = valueText;
                    } else if (labelText.includes('Дата встречи')) {
                        date = valueText;
                    } else if (labelText.includes('Время встречи')) {
                        time = valueText;
                    }
                }
            });
            
            const botInfo = "Подпишитесь на бота: @Odyssey_Cinema_Club_bot\nКаждую пятницу в 14:00 получайте анонсы встреч";
            
            const textToCopy = `🎬 КИНОКЛУБ "ОДИССЕЯ"\n\n${filmTitle} (${filmYear})\n\n📅 ${weekday ? `${weekday}, ` : ''}${date}\n🕒 ${time}\n📍 ${place}\n\n🤖 ${botInfo}\n\n🔗 ${shareData.url}\n\n#КиноклубОдиссея #Киновстреча`.trim();

            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(textToCopy);
                this.showNotification('Информация о встрече скопирована!');
            } else {
                // Fallback для старых браузеров
                const textarea = document.createElement('textarea');
                textarea.value = textToCopy;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                this.showNotification('Информация о встрече скопирована!');
            }
        } catch (error) {
            console.warn('Ошибка копирования:', error);
            this.showNotification('Не удалось скопировать информацию');
        }
    }

    /**
     * Показать уведомление
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 12px 24px;
            border-radius: var(--radius-md);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Глобальные обработчики
     */
    setupGlobalListeners() {
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.modal) {
                this.closeModal();
            }
        });

        // Предотвращаем сохранение изображения
        document.addEventListener('contextmenu', (e) => {
            if (e.target.classList.contains('poster-with-watermark') || 
                e.target.classList.contains('image-modal-img')) {
                e.preventDefault();
            }
        }, false);

        // Очистка при разгрузке страницы
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    /**
     * Очистка ресурсов
     */
    cleanup() {
        if (this.state.countdownInterval) {
            clearInterval(this.state.countdownInterval);
        }

        if (this.state.modal) {
            this.closeModal();
        }
    }

    /**
     * Утилиты
     */
    parseDateTime(dateStr, timeStr) {
        try {
            const [day, month, year] = dateStr.split('.').map(Number);
            const [hours, minutes] = (timeStr || '15:00').split(':').map(Number);
            
            return new Date(year, month - 1, day, hours || 15, minutes || 0);
        } catch {
            return new Date(Date.now() + 86400000); // Завтра
        }
    }

    generateKinopoiskUrl(film, year) {
        if (!film || film.includes('анонсирован')) return null;

        const searchQuery = year ? `${film} ${year}` : film;
        return `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(searchQuery)}`;
    }

    prepareShareData(data) {
        const weekday = this.getWeekdayFromDate(data.date);
        const dateWithWeekday = weekday ? `${weekday}, ${data.date}` : data.date;
        
        return {
            title: `🎬 Киноклуб Одиссея: ${data.film}`,
            text: `${data.film} (${data.year})\n📅 ${dateWithWeekday} | 🕒 ${data.time}\n📍 ${data.place}\n\n🤖 Подпишитесь на бота: @Odyssey_Cinema_Club_bot`,
            url: window.location.href,
            image: data.poster
        };
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/**
 * Инициализация модуля
 */
function initNextMeetingModule() {
    // Проверяем наличие контейнера
    const container = document.getElementById('next-meeting-container');
    if (!container) return;

    // Создаем экземпляр
    window.nextMeetingModule = new NextMeetingModule();
}

/**
 * Автоматическая инициализация
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNextMeetingModule);
} else {
    initNextMeetingModule();
}

/**
 * Глобальный экспорт для отладки
 */
window.NextMeetingModule = NextMeetingModule;
