/**
 * МОДУЛЬ "НАВЕРХ" - Прокрутка к началу страницы
 * Минималистичная реализация с плавной анимацией
 */
class ScrollToTop {
    constructor(options = {}) {
        this.config = {
            threshold: 300,               // Когда показывать кнопку (px)
            duration: 800,                // Длительность анимации (ms)
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Функция плавности
            buttonText: '↑',              // Текст кнопки
            pulseEffect: false,           // Эффект пульсации
            ...options
        };

        this.state = {
            isVisible: false,
            lastScroll: 0,
            isAnimating: false
        };

        this.elements = {};
        this.init();
    }

    // Основная инициализация
    init() {
        this.createButton();
        this.bindEvents();
        this.checkVisibility();
    }

    // Создание кнопки
    createButton() {
        this.elements.button = document.createElement('button');
        this.elements.button.className = 'scroll-to-top';
        this.elements.button.setAttribute('aria-label', 'Прокрутить наверх');
        this.elements.button.innerHTML = this.config.buttonText;
        
        if (this.config.pulseEffect) {
            this.elements.button.classList.add('pulse');
        }

        document.body.appendChild(this.elements.button);
    }

    // Привязка событий с оптимизацией
    bindEvents() {
        // Прокрутка наверх по клику
        this.elements.button.addEventListener('click', () => this.scrollToTop());
        
        // Отслеживание скролла с троттлингом
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.checkVisibility();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // Клавиатурная навигация
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Home' || (e.ctrlKey && e.key === 'Home')) {
                e.preventDefault();
                this.scrollToTop();
            }
        });
    }

    // Проверка видимости кнопки
    checkVisibility() {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        
        if (scrollY > this.config.threshold && !this.state.isVisible) {
            this.show();
        } else if (scrollY <= this.config.threshold && this.state.isVisible) {
            this.hide();
        }
        
        this.state.lastScroll = scrollY;
    }

    // Показать кнопку
    show() {
        this.state.isVisible = true;
        this.elements.button.classList.add('visible');
    }

    // Скрыть кнопку
    hide() {
        this.state.isVisible = false;
        this.elements.button.classList.remove('visible');
    }

    // Прокрутка наверх
    scrollToTop() {
        if (this.state.isAnimating) return;
        
        this.state.isAnimating = true;
        
        // Простая нативная прокрутка
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Прячем кнопку после прокрутки
        setTimeout(() => {
            this.hide();
            this.state.isAnimating = false;
        }, this.config.duration);
    }

    // Альтернативный метод с requestAnimationFrame (если нужно)
    smoothScroll(targetY, duration = this.config.duration) {
        return new Promise(resolve => {
            const startY = window.scrollY;
            const distance = targetY - startY;
            let startTime = null;

            const animation = (currentTime) => {
                if (!startTime) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / duration, 1);
                const ease = this.easeInOut(progress);
                
                window.scrollTo(0, startY + distance * ease);
                
                if (progress < 1) {
                    requestAnimationFrame(animation);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animation);
        });
    }

    // Функция плавности
    easeInOut(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    // Обновление конфигурации
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        if (newConfig.pulseEffect !== undefined) {
            this.elements.button.classList.toggle('pulse', newConfig.pulseEffect);
        }
        
        this.checkVisibility();
    }

    // Удаление кнопки
    destroy() {
        this.elements.button.remove();
        window.removeEventListener('scroll', this.checkVisibility);
    }

    // Статический метод для быстрой инициализации
    static init(options = {}) {
        return new ScrollToTop(options);
    }
}

// Автоматическая инициализация при загрузке
function initScrollToTop() {
    // Проверяем, нужна ли кнопка на этой странице
    const hasLongContent = document.body.scrollHeight > window.innerHeight * 2;
    const isScrollable = document.body.scrollHeight > window.innerHeight;
    
    if (hasLongContent && isScrollable) {
        window.scrollToTop = ScrollToTop.init({
            threshold: 400,
            pulseEffect: true,
            buttonText: '↑'
        });
    }
}

// Запуск при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollToTop);
} else {
    initScrollToTop();
}

// Экспорт для использования в других модулях
window.ScrollToTop = ScrollToTop;

// Глобальный хелпер для быстрого доступа
window.scrollToTop = () => {
    if (window.scrollToTopInstance) {
        window.scrollToTopInstance.scrollToTop();
    } else {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
};
