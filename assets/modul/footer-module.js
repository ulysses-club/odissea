/**
 * МОДУЛЬ ФУТЕРА - Генерация и управление футером
 * Поддерживает разные страницы с уникальными настройками
 */
class FooterModule {
    constructor() {
        this.config = {
            pages: {
                index: {
                    logo: 'ОДИССЕЯ',
                    links: [
                        { text: 'Фильмы', href: '#film-archive' },
                        { text: 'О нас', href: '#about' },
                        { text: 'Топы', href: '#top-films' },
                        { text: 'Контакты', href: '#contacts' },
                        { text: 'Автор', href: '../pages/stanislav.html' }
                    ],
                    social: [
                        { text: 'VK', href: 'https://vk.com/club199046020', ariaLabel: 'ВКонтакте' },
                        { text: 'TG', href: 'https://t.me/Odyssey_Cinema_Club_bot', ariaLabel: 'Telegram' }
                    ],
                    copyright: '© 2026 Киноклуб "ОДИССЕЯ"'
                },
                'crocodile-game': {
                    logo: 'КРОКОДИЛ',
                    links: [
                        { text: 'Правила', href: '#rules', active: true },
                        { text: 'Играть', href: '#game-start' },
                        { text: 'Главная', href: 'index.html' },
                        { text: 'Автор', href: '../pages/stanislav.html' }
                    ],
                    copyright: '© 2026 Киноклуб "ОДИССЕЯ" | Игра "Крокодил"'
                },
                'Interactive-game': {
                    logo: 'ODISSEA',
                    links: [
                        { text: 'Как играть', href: '#how-to-play', active: true },
                        { text: 'Правила', href: '#rules' },
                        { text: 'Главная', href: 'index.html' },
                        { text: 'Автор', href: '../pages/stanislav.html' }
                    ],
                    copyright: '© 2026 Киноклуб "ОДИССЕЯ" | Киноквест'
                },
                quiz: {
                    logo: 'Квиз Odissea',
                    links: [
                        { text: 'Правила', href: '#quiz-rules', active: true },
                        { text: 'Главная', href: 'index.html' },
                        { text: 'Автор', href: '../pages/stanislav.html' }
                    ],
                    copyright: '© 2026 Киноклуб "ОДИССЕЯ" | Квиз'
                },
                randomizer: {
                    logo: 'РАНДОМАЙЗЕР',
                    links: [
                        { text: 'Числа', href: '#numbers-mode', active: true },
                        { text: 'Главная', href: 'index.html' },
                        { text: 'Автор', href: '../pages/stanislav.html' }
                    ],
                    copyright: '© 2026 Киноклуб "ОДИССЕЯ" | Рандомайзер'
                },
                'santa-game': {
                    logo: '🎅 ТАЙНЫЙ САНТА',
                    links: [
                        { text: 'Узнать Санту', href: '#auth', active: true },
                        { text: 'Правила', href: '#rules' },
                        { text: 'Главная', href: 'index.html' },
                        { text: 'Автор', href: '../pages/stanislav.html' }
                    ],
                    copyright: '© 2026 Киноклуб "ОДИССЕЯ" | Тайный Санта'
                },
                default: {
                    logo: 'ОДИССЕЯ',
                    links: [
                        { text: 'О нас', href: 'index.html#about' },
                        { text: 'Топы', href: 'index.html#top-films' },
                        { text: 'Фильмы', href: 'index.html#film-archive' },
                        { text: 'Контакты', href: 'index.html#contacts' },
                        { text: 'Главная', href: 'index.html' },
                        { text: 'Автор', href: '../pages/stanislav.html' }
                    ],
                    copyright: '© 2026 Киноклуб "ОДИССЕЯ"'
                }
            },
            social: [
                { text: 'VK', href: 'https://vk.com/club199046020', ariaLabel: 'ВКонтакте' },
                { text: 'TG', href: 'https://t.me/Odyssey_Cinema_Club_bot', ariaLabel: 'Telegram' }
            ]
        };
    }

    // Основная инициализация
    async init(container = 'body', pageKey = '', method = 'append') {
        const containerEl = document.querySelector(container);
        if (!containerEl) {
            console.warn('Контейнер футера не найден:', container);
            return;
        }

        const page = pageKey || this.detectPage();
        const data = this.config.pages[page] || this.config.pages.default;
        
        // Добавляем социальные сети если их нет
        if (!data.social) {
            data.social = this.config.social;
        }

        const html = this.generateFooter(data);
        
        if (method === 'prepend') {
            containerEl.insertAdjacentHTML('afterbegin', html);
        } else {
            containerEl.insertAdjacentHTML('beforeend', html);
        }

        this.setupInteractions();
    }

    // Определение текущей страницы
    detectPage() {
        const path = window.location.pathname.toLowerCase();
        const pageMap = {
            'index': 'index',
            'crocodile-game': 'crocodile-game',
            'interactive-game': 'Interactive-game',
            'quiz': 'quiz',
            'randomizer': 'randomizer',
            'santa-game': 'santa-game',
            'stanislav': 'default'
        };

        for (const [key, value] of Object.entries(pageMap)) {
            if (path.includes(key)) return value;
        }

        // Проверка темы героя
        const hero = document.querySelector('.hero-container');
        return hero?.dataset.heroTheme || 'default';
    }

    // Генерация HTML футера
    generateFooter(data) {
        return `
        <footer class="footer">
            <div class="footer__decorations"></div>
            <div class="footer__content">
                <div class="footer__logo">${data.logo}</div>
                <nav class="footer__links" aria-label="Навигация">
                    ${data.links.map(link => this.generateLink(link)).join('')}
                </nav>
                <div class="footer__social" aria-label="Социальные сети">
                    ${data.social.map(social => this.generateSocialLink(social)).join('')}
                </div>
                <p class="footer__copyright">${data.copyright}</p>
            </div>
        </footer>`;
    }

    // Генерация ссылки
    generateLink(link) {
        const active = link.active ? 'active' : '';
        const target = link.href.startsWith('#') ? '' : 'target="_blank" rel="noopener noreferrer"';
        return `
        <a href="${link.href}" class="footer__link ${active}" ${target}>
            ${link.text}
        </a>`;
    }

    // Генерация социальной ссылки
    generateSocialLink(social) {
        return `
        <a href="${social.href}" class="social__link" 
           target="_blank" rel="noopener noreferrer"
           aria-label="${social.ariaLabel}">
           ${social.text}
        </a>`;
    }

    // Настройка взаимодействий
    setupInteractions() {
        // Плавная прокрутка для якорных ссылок
        document.addEventListener('click', (e) => {
            const link = e.target.closest('.footer__link[href^="#"]');
            if (!link || link.getAttribute('href') === '#') return;
            
            e.preventDefault();
            const targetId = link.hash.substring(1);
            const target = document.getElementById(targetId);
            
            if (target) {
                const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                window.scrollTo({
                    top: target.offsetTop - headerHeight,
                    behavior: 'smooth'
                });
            }
        });

        // Обновление активных ссылок при скролле
        this.updateActiveLinks();
    }

    // Обновление активных ссылок
    updateActiveLinks() {
        const links = document.querySelectorAll('.footer__link[href^="#"]');
        if (!links.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id;
                        links.forEach(link => {
                            link.classList.toggle('active', link.hash === `#${id}`);
                        });
                    }
                });
            },
            { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
        );

        document.querySelectorAll('section[id]').forEach(section => {
            observer.observe(section);
        });
    }

    // Динамическое обновление данных
    updatePageData(pageKey, newData) {
        if (this.config.pages[pageKey]) {
            this.config.pages[pageKey] = { ...this.config.pages[pageKey], ...newData };
        }
    }

    // Добавление новой страницы
    addPage(pageKey, pageData) {
        this.config.pages[pageKey] = pageData;
    }

    // Удаление футера
    remove() {
        document.querySelector('.footer')?.remove();
    }
}

// Экспорт для использования в других модулях
window.FooterModule = FooterModule;

// Автоматическая инициализация
function initFooterModule() {
    const footer = document.querySelector('#footer-container') || document.body;
    if (footer) {
        new FooterModule().init('#footer-container, body');
    }
}

// Запуск при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooterModule);
} else {
    initFooterModule();
}
