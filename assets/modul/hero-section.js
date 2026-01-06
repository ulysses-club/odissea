class HeroSectionModule {
    constructor() {
        // Конфигурация для всех страниц
        this.config = {
            pages: {
                'index': {
                    title: 'Киноклуб "ОДИССЕЯ"',
                    subtitle: 'Смотри сам! Переживай вместе с нами.',
                    image: '../images/logo-group.jpg',
                    imageAlt: 'Участники киноклуба на встрече',
                    buttons: [
                        { text: 'Наши топы', href: '#top-films', type: 'primary', icon: '🏆' },
                        { text: 'Что смотреть', href: '#next-meeting', type: 'outline', icon: '📼' },
                        { text: 'Место встречи', href: '#map', type: 'outline', icon: '🍵' },
                        { text: 'О нас', href: '#about', type: 'outline', icon: '📽️' },
                        { text: 'Контакты', href: '#contacts', type: 'outline', icon: '📨' },
                        { text: 'Наши работы', href: '#film-archive', type: 'outline', icon: '🎭' },
                        { text: 'Архив обсуждений', href: '#films-container', type: 'outline', icon: '🎬' }
                    ]
                },
                'setup-guide': {
                    title: 'Настройка устройств',
                    subtitle: 'Настрой своё устройство для комфортного просмотра',
                    image: '../images/setup/device-setup.png',
                    imageAlt: 'Настройка устройств для просмотра фильмов',
                    buttons: [
                        { text: 'Настройка ТВ', href: '#tv-setup', type: 'primary', icon: '📺' },
                        { text: 'Настройка ПК', href: '#pc-setup', type: 'outline', icon: '💻' },
                        { text: 'Настройка телефонов', href: '#phone-setup', type: 'outline', icon: '📱' }
                    ]
                },
                'crocodile-game': {
                    title: 'Крокодил Odissea',
                    subtitle: 'Игра в ассоциации на кинотему. Покажи, нарисуй или объясни без слов!',
                    image: '../images/crocodile-hero.jpg',
                    imageAlt: 'Игра в Крокодил - веселая командная игра',
                    buttons: [
                        { text: 'Начать игру', href: '#game-start', type: 'primary', icon: '🎮' }
                    ]
                },
                'interactive-game': {
                    title: 'Киноквест',
                    subtitle: 'Нелинейный интерактивный геоквест по Севастополю с киносюжетом.',
                    image: '../images/interactive-game.jpg',
                    imageAlt: 'Участники киноквеста на локации',
                    buttons: [
                        { text: 'Начать квест', href: '#to-game', type: 'primary', icon: '🧭' }
                    ]
                },
                'quiz': {
                    title: 'Киновикторина',
                    subtitle: 'Проверь свои знания о кино в нашей увлекательной викторине.',
                    image: '../images/quiz-hero.jpg',
                    imageAlt: 'Квиз Odissea - проверь свои знания о кино',
                    buttons: [
                        { text: 'Начать викторину', href: '#quiz-rules', type: 'primary', icon: '❓' }
                    ]
                },
                'randomizer': {
                    title: 'Рандомайзер',
                    subtitle: 'Случайные числа, имена и выборы. Идеально для жеребьевки и игр!',
                    image: '../images/randomizer-hero.jpg',
                    imageAlt: 'Рандомайзер - инструмент случайного выбора',
                    buttons: [
                        { text: 'Генератор чисел', href: '#numbers-mode', type: 'primary', icon: '🎲' },
                        { text: 'Выбор имен', href: '#names-mode', type: 'outline', icon: '👥' }
                    ]
                },
                'santa-game': {
                    title: '🎅 Тайный Санта',
                    subtitle: 'Волшебный обмен подарками в киноклубе! Узнай, кому ты даришь подарок.',
                    image: '../images/santa-hero.jpg',
                    imageAlt: 'Тайный Санта - рождественский обмен подарками',
                    buttons: [
                        { text: 'Узнать Санту', href: '#auth', type: 'primary', icon: '🎁' },
                        { text: 'Правила игры', href: '#rules', type: 'outline', icon: '📜' }
                    ]
                },
                'stanislav': {
                    title: 'Автор сайта',
                    subtitle: 'Разработчик сайта киноклуба Одиссея',
                    image: '../images/author.jpg',
                    imageAlt: 'Автор сайта - Станислав',
                    buttons: [
                        { text: 'Мои работы', href: '#works', type: 'primary', icon: '💼' },
                        { text: 'Контакты', href: '#contacts', type: 'outline', icon: '📱' }
                    ]
                }
            },
            defaults: {
                image: '../images/default-poster.jpg',
                imageAlt: 'Изображение киноклуба Одиссея'
            }
        };
    }

    /**
     * Определяет текущую страницу
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '').toLowerCase();

        // Определяем страницу
        if (path.includes('index.html') || path === '/' || path.endsWith('/') || path.includes('/kinoclub-odisseya/')) {
            return 'index';
        }

        // Проверяем существование страницы в конфиге
        return page in this.config.pages ? page : 'index';
    }

    /**
     * Генерирует кнопку
     */
    generateButton(button) {
        const btnClass = button.type === 'primary' ? 'btn btn--primary' : 'btn btn--outline';
        const icon = button.icon ? `<span class="btn-icon" aria-hidden="true">${button.icon}</span>` : '';

        return `
            <a href="${button.href}" class="${btnClass}">
                ${icon}
                <span class="btn-text">${button.text}</span>
            </a>
        `;
    }

    /**
     * Генерирует изображение с эффектом кинопленки
     */
    generateImage(pageData) {
        const { image, imageAlt } = pageData;

        return `
            <div class="hero__image">
                <img src="${image}" 
                     alt="${imageAlt}" 
                     class="hero__image-img"
                     width="600" 
                     height="400" 
                     loading="lazy"
                     onerror="this.onerror=null; this.src='${this.config.defaults.image}'">
                <div class="film-strip-overlay" aria-hidden="true"></div>
            </div>
        `;
    }

    /**
     * Генерирует весь HTML герой-секции
     */
    generateHTML(pageKey) {
        const pageData = this.config.pages[pageKey] || this.config.pages['index'];
        const buttonsHTML = pageData.buttons.map(btn => this.generateButton(btn)).join('');
        const imageHTML = this.generateImage(pageData);

        return `
            <section class="hero" data-page="${pageKey}" aria-label="Главная секция">
                <div class="hero__content">
                    <div class="hero__text">
                        <h1 class="hero__title">${pageData.title}</h1>
                        <p class="hero__subtitle">${pageData.subtitle}</p>
                        <div class="hero__cta">
                            ${buttonsHTML}
                        </div>
                    </div>
                    ${imageHTML}
                </div>
            </section>
        `;
    }

    /**
     * Инициализирует модуль
     */
    init(containerSelector = '.hero-container') {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.warn(`HeroSection: контейнер ${containerSelector} не найден`);
            return;
        }

        try {
            const pageKey = this.getCurrentPage();
            container.innerHTML = this.generateHTML(pageKey);

            // Оптимизация изображений
            this.optimizeImages();

            console.log(`HeroSection: секция для "${pageKey}" загружена`);
        } catch (error) {
            console.error('HeroSection: ошибка инициализации:', error);
            // Fallback на главную страницу
            container.innerHTML = this.generateHTML('index');
        }
    }

    /**
     * Оптимизация изображений после загрузки
     */
    optimizeImages() {
        const images = document.querySelectorAll('.hero__image-img');
        images.forEach(img => {
            // Устанавливаем атрибуты для ленивой загрузки
            if (!img.loading) img.loading = 'lazy';

            // Обработчик ошибок загрузки
            img.onerror = () => {
                img.src = this.config.defaults.image;
                img.alt = this.config.defaults.imageAlt;
            };
        });
    }
}

/**
 * API для глобального использования
 */
window.HeroSection = {
    instance: null,

    /**
     * Инициализация герой-секции
     */
    init: function (containerSelector = '.hero-container') {
        if (!this.instance) {
            this.instance = new HeroSectionModule();
        }
        this.instance.init(containerSelector);
        return this.instance;
    },

    /**
     * Обновление данных страницы
     */
    updatePageData: function (pageKey, newData) {
        if (this.instance && this.instance.config.pages[pageKey]) {
            Object.assign(this.instance.config.pages[pageKey], newData);
            this.instance.init();
        }
    },

    /**
     * Добавление новой страницы
     */
    addPage: function (pageKey, pageData) {
        if (this.instance) {
            this.instance.config.pages[pageKey] = pageData;
        }
    },

    /**
     * Получение текущей страницы
     */
    getCurrentPage: function () {
        return this.instance ? this.instance.getCurrentPage() : 'index';
    },

    /**
     * Перезагрузка секции
     */
    reload: function () {
        if (this.instance) {
            this.instance.init();
        }
    }
};

/**
 * Автоматическая инициализация
 */
(function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => HeroSection.init());
    } else {
        HeroSection.init();
    }
})();

/**
 * Экспорт для модульных систем
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeroSectionModule, HeroSection };
}
