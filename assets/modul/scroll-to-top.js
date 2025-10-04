class ScrollToTop {
    constructor() {
        this.button = null;
        this.scrollThreshold = 300;
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

        // Отслеживание скролла
        window.addEventListener('scroll', () => {
            this.checkScrollPosition();
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

    checkScrollPosition() {
        if (window.pageYOffset > this.scrollThreshold) {
            this.button.classList.add('visible');
        } else {
            this.button.classList.remove('visible');
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

        function animation(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
    }

    // Публичный метод для ручного показа/скрытия
    show() {
        this.button.classList.add('visible');
    }

    hide() {
        this.button.classList.remove('visible');
    }

    // Публичный метод для обновления позиции
    updatePosition(bottom = null, right = null) {
        if (bottom) this.button.style.bottom = bottom;
        if (right) this.button.style.right = right;
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