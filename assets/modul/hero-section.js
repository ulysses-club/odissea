/**
 * Модуль герой-секции для киноклуба Одиссея
 */
class HeroSectionModule {
    /**
     * Конструктор класса HeroSectionModule
     * Инициализирует данные герой-секции для разных страниц
     */
    constructor() {
        this.heroData = {
            // Данные для разных страниц
            pages: {
                'index': {
                    title: 'Киноклуб "ОДИССЕЯ"',
                    subtitle: 'Есть о чем поговорить!',
                    image: '../images/logo-group.jpg',
                    imageAlt: 'Участники киноклуба на встрече',
                    buttons: [
                        {
                            text: 'Смотреть наши топы',
                            href: '#top-films',
                            type: 'primary'
                        },
                        {
                            text: 'О нас',
                            href: '#about',
                            type: 'outline',
                            icon: true
                        }
                    ]
                },
                'crocodile-game': {
                    title: 'Крокодил',
                    subtitle: 'Покажи, нарисуй или объясни без слов!',
                    image: '../images/crocodile-hero.jpg',
                    imageAlt: 'Игра в Крокодил - веселая командная игра',
                    buttons: [
                        {
                            text: 'Начать игру',
                            href: '#game-start',
                            type: 'primary'
                        },
                        {
                            text: 'Правила',
                            href: '#rules',
                            type: 'outline',
                            icon: true
                        }
                    ]
                },
                'Interactive-game': {
                    title: 'Киноквест "Odissea"',
                    subtitle: 'Нелинейный, интерактивный геоквест по городу!',
                    image: '../images/Interactive-game.jpg',
                    imageAlt: 'Участники киноквеста на локации',
                    buttons: [
                        {
                            text: 'Играть',
                            href: '#to-game',
                            type: 'primary'
                        },
                        {
                            text: 'Как играть',
                            href: '#how-to-play',
                            type: 'outline',
                            icon: true
                        }
                    ]
                },
                'quiz': {
                    title: 'Квиз Odissea',
                    subtitle: 'Проверь свои знания о кино!',
                    image: '../images/quiz-hero.jpg',
                    imageAlt: 'Квиз Odissea - проверь свои знания о кино',
                    buttons: [
                        {
                            text: 'Начать квиз',
                            href: '#quiz-rules',
                            type: 'primary'
                        }
                    ]
                },
                'randomizer': {
                    title: 'Рандомайзер',
                    subtitle: 'Случайные числа и имена для жеребьевки!',
                    image: '../images/randomizer-hero.jpg',
                    imageAlt: 'Рандомайзер - инструмент для случайного выбора',
                    buttons: [
                        {
                            text: 'Начать рандом',
                            href: '#numbers-mode',
                            type: 'primary'
                        },
                        {
                            text: 'Как использовать',
                            href: '#randomizer-tips',
                            type: 'outline',
                            icon: true
                        }
                    ]
                },
                // Дефолтные данные для других страниц
                'default': {
                    title: 'Киноклуб "Odissea"',
                    subtitle: 'Как настроить устройство для комфортного просмотра',
                    image: '../images/setup/device-setup.png',
                    imageAlt: 'Киноклуб Одиссея',
                    buttons: []
                }
            }
        };
    }

    /**
     * Генерирует HTML для герой-секции
     * Создает полную HTML разметку герой-секции на основе данных страницы
     * 
     * @param {string} pageKey - Ключ страницы для выбора соответствующих данных
     * @returns {string} - HTML строка герой-секции
     */
    generateHeroSection(pageKey = 'index') {
        const data = this.heroData.pages[pageKey] || this.heroData.pages['default'];

        return `
            <section class="hero ${pageKey !== 'index' ? pageKey + '-hero' : ''}">
                <div class="hero__content">
                    <h1 class="hero__title">${data.title}</h1>
                    <p class="hero__subtitle">${data.subtitle}</p>
                    <div class="hero__cta">
                        ${data.buttons.map(button => this.generateButton(button)).join('')}
                    </div>
                </div>
                <div class="hero__image">
                    <img src="${data.image}" 
                         alt="${data.imageAlt}" 
                         class="hero__image-img"
                         width="600" 
                         height="400" 
                         loading="lazy"
                         onerror="this.src='../images/default-poster.jpg'">
                </div>
            </section>
        `;
    }

    /**
     * Генерирует HTML для кнопки
     * Создает HTML разметку для кнопки призыва к действию
     * 
     * @param {Object} button - Объект с данными кнопки
     * @param {string} button.text - Текст кнопки
     * @param {string} button.href - URL ссылки кнопки
     * @param {string} button.type - Тип кнопки ('primary' или 'outline')
     * @param {boolean} button.icon - Флаг отображения иконки
     * @returns {string} - HTML строка кнопки
     */
    generateButton(button) {
        const btnClass = button.type === 'primary' ? 'btn btn--primary' : 'btn btn--outline';

        const iconSvg = button.icon ? `
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
                    fill="currentColor" />
            </svg>
        ` : '';

        return `
            <a href="${button.href}" class="${btnClass}">
                ${iconSvg}
                ${button.text}
            </a>
        `;
    }

    /**
     * Инициализирует герой-секцию на странице
     * Вставляет герой-секцию в указанный контейнер и настраивает функциональность
     * 
     * @param {string} containerSelector - CSS селектор контейнера для вставки герой-секции
     * @param {string} pageKey - Ключ страницы для выбора данных
     */
    init(containerSelector = '.hero-container', pageKey = '') {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error('Hero section container not found:', containerSelector);
            return;
        }

        const actualPageKey = pageKey || this.detectPage();
        container.innerHTML = this.generateHeroSection(actualPageKey);

        // Добавляем обработчики для плавной прокрутки
        this.attachSmoothScroll();
    }

    /**
     * Определяет текущую страницу
     * Анализирует URL для определения типа страницы и выбора соответствующих данных
     * 
     * @returns {string} - Ключ страницы для данных герой-секции
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
        } else if (path.includes('randomizer.html')) {
            return 'randomizer';
        } else if (path.includes('setup-guide.html')) {
            return 'setup-guide';
        } else {
            return 'default';
        }
    }

    /**
     * Добавляет обработчики для плавной прокрутки
     * Настраивает плавную прокрутку для якорных ссылок в герой-секции
     */
    attachSmoothScroll() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
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
     * Обновляет данные герой-секции
     * Позволяет динамически изменять данные герой-секции для конкретной страницы
     * 
     * @param {string} pageKey - Ключ страницы для обновления
     * @param {Object} newData - Новые данные для страницы
     */
    updateHeroData(pageKey, newData) {
        if (this.heroData.pages[pageKey]) {
            this.heroData.pages[pageKey] = { ...this.heroData.pages[pageKey], ...newData };
        }
    }

    /**
     * Добавляет новую страницу в данные
     * Регистрирует данные герой-секции для новой страницы
     * 
     * @param {string} pageKey - Ключ новой страницы
     * @param {Object} pageData - Данные герой-секции для страницы
     */
    addPage(pageKey, pageData) {
        this.heroData.pages[pageKey] = pageData;
    }
}

/**
 * Функция инициализации герой-секции
 * Создает экземпляр HeroSectionModule и инициализирует герой-секцию на странице
 * 
 * @param {string} containerSelector - CSS селектор контейнера для вставки герой-секции
 * @param {string} pageKey - Ключ страницы для выбора данных
 */
function initHeroSection(containerSelector = '.hero-container', pageKey = '') {
    try {
        new HeroSectionModule().init(containerSelector, pageKey);
    } catch (error) {
        console.error('Failed to initialize hero section:', error);
    }
}

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initHeroSection());
} else {
    initHeroSection();
}
