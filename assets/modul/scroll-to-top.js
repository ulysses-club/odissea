class ScrollToTop {
    constructor() {
        this.button = null;
        this.scrollThreshold = 300;
        this.isVisible = false;
        this.init();
    }

    init() {
        this.createButton();
        this.addEventListeners();
        this.checkScrollPosition();
    }

    createButton() {
        this.button = document.createElement('button');
        this.button.className = 'scroll-to-top';
        this.button.setAttribute('aria-label', 'Наверх');
        this.button.setAttribute('title', 'Наверх');
        this.button.innerHTML = '↑';
        
        document.body.appendChild(this.button);
    }

    addEventListeners() {
        // Клик по кнопке
        this.button.addEventListener('click', () => {
            this.scrollToTop();
        });

        // Отслеживание скролла с троттлингом
        window.addEventListener('scroll', () => {
            this.throttle(this.checkScrollPosition.bind(this), 100)();
        });

        // Плавный скролл для якорей
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link && link.getAttribute('href') !== '#') {
                e.preventDefault();
                this.smoothScrollTo(link.getAttribute('href'));
            }
        });
    }

    // Функция троттлинга для оптимизации
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    checkScrollPosition() {
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollPosition > this.scrollThreshold && !this.isVisible) {
            this.show();
        } else if (scrollPosition <= this.scrollThreshold && this.isVisible) {
            this.hide();
        }
    }

    scrollToTop() {
        this.smoothScrollTo(0);
    }

    smoothScrollTo(target) {
        const targetElement = typeof target === 'string' 
            ? document.querySelector(target) 
            : null;
        
        const targetPosition = targetElement 
            ? targetElement.getBoundingClientRect().top + window.pageYOffset 
            : target;

        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 800;
        let start = null;

        const animation = (currentTime) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        };

        requestAnimationFrame(animation);
    }

    // Функция плавности easing
    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    show() {
        this.button.classList.add('visible');
        this.isVisible = true;
    }

    hide() {
        this.button.classList.remove('visible');
        this.isVisible = false;
    }

    // Публичный метод для обновления порога видимости
    setThreshold(threshold) {
        this.scrollThreshold = threshold;
        this.checkScrollPosition();
    }
}

// Автоматическая инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    new ScrollToTop();
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollToTop;
}
