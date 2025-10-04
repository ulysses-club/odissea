class ScrollToTop {
    /**
     * Конструктор класса ScrollToTop
     * Инициализирует кнопку прокрутки наверх и её параметры
     */
    constructor() {
        this.button = null;
        this.scrollThreshold = 300;
        this.isVisible = false;
        this.init();
    }

    /**
     * Инициализация модуля
     * Создает кнопку, добавляет обработчики событий и проверяет позицию скролла
     */
    init() {
        this.createButton();
        this.addEventListeners();
        this.checkScrollPosition();
    }

    /**
     * Создание кнопки прокрутки наверх
     * Создает и добавляет в DOM кнопку для прокрутки к началу страницы
     */
    createButton() {
        this.button = document.createElement('button');
        this.button.className = 'scroll-to-top';
        this.button.setAttribute('aria-label', 'Наверх');
        this.button.setAttribute('title', 'Наверх');
        this.button.innerHTML = '↑';

        document.body.appendChild(this.button);
    }

    /**
     * Добавление обработчиков событий
     * Назначает обработчики для клика по кнопке, отслеживания скролла и плавной прокрутки
     */
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

    /**
     * Функция троттлинга для оптимизации
     * Ограничивает частоту вызова функции для улучшения производительности
     * 
     * @param {Function} func - Функция для ограничения вызовов
     * @param {number} limit - Временной интервал в миллисекундах
     * @returns {Function} - Функция с примененным троттлингом
     */
    throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    /**
     * Проверка позиции скролла
     * Определяет, должна ли кнопка быть видимой на основе текущей позиции скролла
     */
    checkScrollPosition() {
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollPosition > this.scrollThreshold && !this.isVisible) {
            this.show();
        } else if (scrollPosition <= this.scrollThreshold && this.isVisible) {
            this.hide();
        }
    }

    /**
     * Прокрутка к началу страницы
     * Выполняет плавную прокрутку к верху страницы
     */
    scrollToTop() {
        this.smoothScrollTo(0);
    }

    /**
     * Плавная прокрутка к цели
     * Выполняет анимированную прокрутку к указанному элементу или позиции
     * 
     * @param {string|number} target - CSS селектор элемента или числовая позиция скролла
     */
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

    /**
     * Функция плавности easing
     * Реализует алгоритм плавности easeInOutQuad для анимации прокрутки
     * 
     * @param {number} t - Текущее время анимации
     * @param {number} b - Начальное значение
     * @param {number} c - Изменение значения
     * @param {number} d - Продолжительность анимации
     * @returns {number} - Текущее значение для анимации
     */
    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    /**
     * Показать кнопку
     * Делает кнопку прокрутки наверх видимой
     */
    show() {
        this.button.classList.add('visible');
        this.isVisible = true;
    }

    /**
     * Скрыть кнопку
     * Скрывает кнопку прокрутки наверх
     */
    hide() {
        this.button.classList.remove('visible');
        this.isVisible = false;
    }

    /**
     * Установка порога видимости
     * Изменяет значение скролла, при котором кнопка становится видимой
     * 
     * @param {number} threshold - Новое значение порога в пикселях
     */
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
