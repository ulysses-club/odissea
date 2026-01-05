/**
 * Модуль герой-секции для киноклуба Одиссея
 * Обновленный с кинематографичным дизайном
 */
class HeroSectionModule {
    /**
     * Конструктор класса HeroSectionModule
     */
    constructor() {
        this.pageData = {
            'index': {
                title: 'Киноклуб "ОДИССЕЯ"',
                subtitle: 'Смотри сам! Переживай вместе с нами.',
                image: '../images/logo-group.jpg',
                imageAlt: 'Участники киноклуба на встрече',
                buttons: [
                    {
                        text: 'Наши топы',
                        href: '#top-films',
                        type: 'primary',
                        icon: '🏆'
                    },
                    {
                        text: 'Что смотреть',
                        href: '#next-meeting',
                        type: 'outline',
                        icon: '📼'
                    },
                    {
                        text: 'Место встречи',
                        href: '#map',
                        type: 'outline',
                        icon: '🍵'
                    },
                    {
                        text: 'о нас',
                        href: '#about',
                        type: 'outline',
                        icon: '📽️'
                    },
                    {
                        text: 'Контакты',
                        href: '#contacts',
                        type: 'outline',
                        icon: '📨'
                    },
                    {
                        text: 'Наши работы',
                        href: '#film-archive',
                        type: 'outline',
                        icon: '🎭'
                    },
                    {
                        text: 'Архив обсуждений',
                        href: '#films-container',
                        type: 'outline',
                        icon: '🎬'
                    }
                ]
            },
            'setup-guide': {
                title: 'Настройка устройств',
                subtitle: 'Настрой своё устройство для комфортного просмотра',
                image: '../images/setup/device-setup.png',
                imageAlt: 'Настройка устройств для просмотра фильмов',
                buttons: [
                    {
                        text: 'Настройка ТВ',
                        href: '#tv-setup',
                        type: 'primary',
                        icon: '📺'
                    },
                    {
                        text: 'Настройка ПК',
                        href: '#pc-setup',
                        type: 'outline',
                        icon: '💻'
                    },
                    {
                        text: 'Настройка телефонов',
                        href: '#phone-setup',
                        type: 'outline',
                        icon: '📱'
                    }
                ]
            },
            'crocodile-game': {
                title: 'Крокодил Odissea',
                subtitle: 'Игра в ассоциации на кинотему. Покажи, нарисуй или объясни без слов!',
                image: '../images/crocodile-hero.jpg',
                imageAlt: 'Игра в Крокодил - веселая командная игра',
                buttons: [
                    {
                        text: 'Начать игру',
                        href: '#game-start',
                        type: 'primary',
                        icon: '🎮'
                    }
                ]
            },
            'interactive-game': {
                title: 'Киноквест',
                subtitle: 'Нелинейный интерактивный геоквест по Севастополю с киносюжетом.',
                image: '../images/interactive-game.jpg',
                imageAlt: 'Участники киноквеста на локации',
                buttons: [
                    {
                        text: 'Начать квест',
                        href: '#to-game',
                        type: 'primary',
                        icon: '🧭'
                    }
                ]
            },
            'quiz': {
                title: 'Киновикторина',
                subtitle: 'Проверь свои знания о кино в нашей увлекательной викторине.',
                image: '../images/quiz-hero.jpg',
                imageAlt: 'Квиз Odissea - проверь свои знания о кино',
                buttons: [
                    {
                        text: 'Начать викторину',
                        href: '#quiz-rules',
                        type: 'primary',
                        icon: '❓'
                    }
                ]
            },
            'randomizer': {
                title: 'Рандомайзер',
                subtitle: 'Случайные числа, имена и выборы. Идеально для жеребьевки и игр!',
                image: '../images/randomizer-hero.jpg',
                imageAlt: 'Рандомайзер - инструмент случайного выбора',
                buttons: [
                    {
                        text: 'Генератор чисел',
                        href: '#numbers-mode',
                        type: 'primary',
                        icon: '🎲'
                    },
                    {
                        text: 'Выбор имен',
                        href: '#names-mode',
                        type: 'outline',
                        icon: '👥'
                    }
                ]
            },
            'santa-game': {
                title: '🎅 Тайный Санта',
                subtitle: 'Волшебный обмен подарками в киноклубе! Узнай, кому ты даришь подарок.',
                image: '../images/santa-hero.jpg',
                imageAlt: 'Тайный Санта - рождественский обмен подарками',
                buttons: [
                    {
                        text: 'Узнать Санту',
                        href: '#auth',
                        type: 'primary',
                        icon: '🎁'
                    },
                    {
                        text: 'Правила игры',
                        href: '#rules',
                        type: 'outline',
                        icon: '📜'
                    }
                ]
            },
            'stanislav': {
                title: 'Автор сайта',
                subtitle: 'Разработчик сайта киноклуба Одиссея',
                image: '../images/author.jpg',
                imageAlt: 'Автор сайта - Станислав',
                buttons: [
                    {
                        text: 'Мои работы',
                        href: '#works',
                        type: 'primary',
                        icon: '💼'
                    },
                    {
                        text: 'Контакты',
                        href: '#contacts',
                        type: 'outline',
                        icon: '📱'
                    }
                ]
            }
        };
    }

    /**
     * Определяет текущую страницу по URL
     */
    detectPage() {
        const path = window.location.pathname;
        const pageName = path.split('/').pop().split('.')[0].toLowerCase();

        // Обработка главной страницы
        if (path.includes('index.html') || path === '/' || path.endsWith('/') || path.includes('/kinoclub-odisseya/')) {
            return 'index';
        }

        // Проверяем существование страницы в данных
        return this.pageData[pageName] ? pageName : 'index';
    }

    /**
     * Генерирует HTML для кнопки
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
     * Генерирует HTML для всей герой-секции
     */
    generateHeroSection(pageKey = 'index') {
        const data = this.pageData[pageKey] || this.pageData['index'];

        return `
            <section class="hero" aria-label="Главная секция">
                <div class="hero__content">
                    <div class="hero__text">
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
                        <div class="film-strip-overlay" aria-hidden="true"></div>
                    </div>
                </div>
            </section>
        `;
    }

    /**
     * Инициализирует герой-секцию на странице
     */
    init(containerSelector = '.hero-container', pageKey = '') {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.warn('Контейнер герой-секции не найден:', containerSelector);
            return;
        }

        const actualPageKey = pageKey || this.detectPage();
        container.innerHTML = this.generateHeroSection(actualPageKey);

        console.log(`Герой-секция для страницы "${actualPageKey}" загружена`);
    }
}

/**
 * Глобальная функция инициализации герой-секции
 */
function initHeroSection(containerSelector = '.hero-container', pageKey = '') {
    try {
        window.heroModule = window.heroModule || new HeroSectionModule();
        window.heroModule.init(containerSelector, pageKey);
    } catch (error) {
        console.error('Ошибка инициализации герой-секции:', error);
    }
}

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initHeroSection());
} else {
    initHeroSection();
}

// API для использования из других модулей
window.HeroSection = {
    init: initHeroSection,
    updatePageData: (pageKey, newData) => {
        if (window.heroModule && window.heroModule.pageData[pageKey]) {
            Object.assign(window.heroModule.pageData[pageKey], newData);
            window.heroModule.init();
        }
    },
    addPage: (pageKey, pageData) => {
        if (window.heroModule) {
            window.heroModule.pageData[pageKey] = pageData;
        }
    },
    getCurrentPage: () => {
        return window.heroModule ? window.heroModule.detectPage() : 'index';
    }
};
