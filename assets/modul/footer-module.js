/**
 * Модуль футера для киноклуба Одиссея
 */
class FooterModule {
    /**
     * Конструктор класса FooterModule
     * Инициализирует данные футера для разных страниц
     */
    constructor() {
        this.footerData = {
            // Данные для разных страниц
            pages: {
                'index': {
                    logo: 'ОДИССЕЯ',
                    links: [
                        { text: 'О нас', href: '#about', active: true },
                        { text: 'Топы', href: '#top-films' },
                        { text: 'Фильмы', href: '#film-archive' },
                        { text: 'Контакты', href: '#contacts' },
                        { text: 'Автор сайта', href: '../pages/stanislav.html' }
                    ],
                    social: [
                        {
                            text: 'VK',
                            href: 'https://vk.com/club199046020',
                            ariaLabel: 'ВКонтакте'
                        },
                        {
                            text: 'TG',
                            href: 'https://t.me/Odyssey_Cinema_Club_bot',
                            ariaLabel: 'Telegram'
                        }
                    ],
                    copyright: '© 2025 Киноклуб "ОДИССЕЯ"'
                },
                'crocodile-game': {
                    logo: 'КРОКОДИЛ',
                    links: [
                        { text: 'Правила', href: '#rules', active: true },
                        { text: 'Играть', href: '#game-start' },
                        { text: 'Советы', href: '#about' },
                        { text: 'Главная', href: 'index.html' }
                    ],
                    social: [
                        {
                            text: 'VK',
                            href: 'https://vk.com/club199046020',
                            ariaLabel: 'ВКонтакте'
                        },
                        {
                            text: 'TG',
                            href: 'https://t.me/Odyssey_Cinema_Club_bot',
                            ariaLabel: 'Telegram'
                        }
                    ],
                    copyright: '© 2025 Киноклуб "ОДИССЕЯ" | Игра "Крокодил"'
                },
                'Interactive-game': {
                    logo: 'ODISSEA',
                    links: [
                        { text: 'Как играть', href: '#how-to-play', active: true },
                        { text: 'Играть', href: '#to-game' },
                        { text: 'Правила', href: '#rules' },
                        { text: 'Главная', href: 'index.html' }
                    ],
                    social: [
                        {
                            text: 'VK',
                            href: 'https://vk.com/club199046020',
                            ariaLabel: 'ВКонтакте'
                        },
                        {
                            text: 'TG',
                            href: 'https://t.me/Odyssey_Cinema_Club_bot',
                            ariaLabel: 'Telegram'
                        }
                    ],
                    copyright: '© 2025 Киноклуб "ОДИССЕЯ" | Киноквест'
                },
                'quiz': {
                    logo: 'ODISSEA QUIZ',
                    links: [
                        { text: 'Правила', href: '#quiz-rules', active: true },
                        { text: 'Начать квиз', href: '#quiz-start' },
                        { text: 'Результаты', href: '#quiz-results' },
                        { text: 'Главная', href: 'index.html' }
                    ],
                    social: [
                        {
                            text: 'VK',
                            href: 'https://vk.com/club199046020',
                            ariaLabel: 'ВКонтакте'
                        },
                        {
                            text: 'TG',
                            href: 'https://t.me/Odyssey_Cinema_Club_bot',
                            ariaLabel: 'Telegram'
                        }
                    ],
                    copyright: '© 2025 Киноклуб "ОДИССЕЯ" | Квиз'
                },
                // Дефолтные данные для других страниц
                'default': {
                    logo: 'ОДИССЕЯ',
                    links: [
                        { text: 'О нас', href: '#about' },
                        { text: 'Топы', href: '#top-films' },
                        { text: 'Фильмы', href: '#film-archive' },
                        { text: 'Контакты', href: '#contacts' },
                        { text: 'Главная', href: 'index.html' }
                    ],
                    social: [
                        {
                            text: 'VK',
                            href: 'https://vk.com/club199046020',
                            ariaLabel: 'ВКонтакте'
                        },
                        {
                            text: 'TG',
                            href: 'https://t.me/Odyssey_Cinema_Club_bot',
                            ariaLabel: 'Telegram'
                        }
                    ],
                    copyright: '© 2025 Киноклуб "ОДИССЕЯ"'
                }
            }
        };
    }

    /**
     * Генерирует HTML для футера
     * Создает полную HTML разметку футера на основе данных страницы
     * 
     * @param {string} pageKey - Ключ страницы для выбора соответствующих данных
     * @returns {string} - HTML строка футера
     */
    generateFooter(pageKey = 'index') {
        const data = this.footerData.pages[pageKey] || this.footerData.pages['default'];

        return `
            <footer class="footer">
                <div class="footer__content">
                    <div class="footer__logo">${data.logo}</div>
                    <div class="footer__links">
                        ${data.links.map(link => this.generateLink(link)).join('')}
                    </div>
                    <div class="footer__social">
                        ${data.social.map(social => this.generateSocialLink(social)).join('')}
                    </div>
                    <p class="footer__copyright">${data.copyright}</p>
                </div>
            </footer>
        `;
    }

    /**
     * Генерирует HTML для ссылки
     * Создает HTML разметку для навигационной ссылки футера
     * 
     * @param {Object} link - Объект с данными ссылки
     * @param {string} link.text - Текст ссылки
     * @param {string} link.href - URL ссылки
     * @param {boolean} link.active - Флаг активной ссылки
     * @returns {string} - HTML строка ссылки
     */
    generateLink(link) {
        const activeClass = link.active ? 'active' : '';
        return `
            <a href="${link.href}" class="footer__link ${activeClass}">
                ${link.text}
            </a>
        `;
    }

    /**
     * Генерирует HTML для социальной ссылки
     * Создает HTML разметку для ссылки на социальные сети
     * 
     * @param {Object} social - Объект с данными социальной ссылки
     * @param {string} social.text - Текст ссылки
     * @param {string} social.href - URL социальной сети
     * @param {string} social.ariaLabel - ARIA-лейбл для доступности
     * @returns {string} - HTML строка социальной ссылки
     */
    generateSocialLink(social) {
        return `
            <a href="${social.href}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="social__link"
               aria-label="${social.ariaLabel}">
               ${social.text}
            </a>
        `;
    }

    /**
     * Инициализирует футер на странице
     * Вставляет футер в указанный контейнер и настраивает функциональность
     * 
     * @param {string} containerSelector - CSS селектор контейнера для вставки футера
     * @param {string} pageKey - Ключ страницы для выбора данных
     * @param {string} insertMethod - Метод вставки ('append' или 'prepend')
     */
    init(containerSelector = 'body', pageKey = '', insertMethod = 'append') {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error('Footer container not found:', containerSelector);
            return;
        }

        const actualPageKey = pageKey || this.detectPage();
        const footerHTML = this.generateFooter(actualPageKey);

        // Вставляем футер в конец контейнера
        if (insertMethod === 'prepend') {
            container.insertAdjacentHTML('afterbegin', footerHTML);
        } else {
            container.insertAdjacentHTML('beforeend', footerHTML);
        }

        // Добавляем обработчики для плавной прокрутки
        this.attachSmoothScroll();

        // Добавляем обработчики для активных ссылок
        this.updateActiveLinks();
    }

    /**
     * Определяет текущую страницу
     * Анализирует URL для определения типа страницы и выбора соответствующих данных
     * 
     * @returns {string} - Ключ страницы для данных футера
     */
    detectPage() {
        const path = window.location.pathname;

        if (path.includes('index.html') || path.endsWith('/') || path.includes('/kinoclub-odisseya/')) {
            return 'index';
        } else if (path.includes('crocodile-game.html')) {
            return 'crocodile-game';
        } else if (path.includes('Interactive-game.html')) {
            return 'Interactive-game';
        } else if (path.includes('quiz.html')) {
            return 'quiz';
        } else if (path.includes('stanislav.html')) {
            return 'default';
        } else {
            return 'default';
        }
    }

    /**
     * Добавляет обработчики для плавной прокрутки
     * Настраивает плавную прокрутку для якорных ссылок футера
     */
    attachSmoothScroll() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('.footer__link[href^="#"]');
            if (link && link.getAttribute('href') !== '#') {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    }

    /**
     * Обновляет активные ссылки на основе текущего положения прокрутки
     * Использует Intersection Observer для отслеживания видимых секций
     */
    updateActiveLinks() {
        const sections = document.querySelectorAll('section[id]');
        const footerLinks = document.querySelectorAll('.footer__link[href^="#"]');

        if (sections.length === 0 || footerLinks.length === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    footerLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                    });
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    }

    /**
     * Обновляет данные футера
     * Позволяет динамически изменять данные футера для конкретной страницы
     * 
     * @param {string} pageKey - Ключ страницы для обновления
     * @param {Object} newData - Новые данные для страницы
     */
    updateFooterData(pageKey, newData) {
        if (this.footerData.pages[pageKey]) {
            this.footerData.pages[pageKey] = { ...this.footerData.pages[pageKey], ...newData };
        }
    }

    /**
     * Добавляет новую страницу в данные
     * Регистрирует данные футера для новой страницы
     * 
     * @param {string} pageKey - Ключ новой страницы
     * @param {Object} pageData - Данные футера для страницы
     */
    addPage(pageKey, pageData) {
        this.footerData.pages[pageKey] = pageData;
    }

    /**
     * Удаляет футер со страницы
     * Удаляет элемент футера из DOM
     */
    remove() {
        const footer = document.querySelector('.footer');
        if (footer) {
            footer.remove();
        }
    }
}

/**
 * Функция инициализации футера
 * Создает экземпляр FooterModule и инициализирует футер на странице
 * 
 * @param {string} containerSelector - CSS селектор контейнера для вставки футера
 * @param {string} pageKey - Ключ страницы для выбора данных
 * @param {string} insertMethod - Метод вставки ('append' или 'prepend')
 */
function initFooter(containerSelector = 'body', pageKey = '', insertMethod = 'append') {
    try {
        new FooterModule().init(containerSelector, pageKey, insertMethod);
    } catch (error) {
        console.error('Failed to initialize footer:', error);
    }
}

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initFooter());
} else {
    initFooter();
}
