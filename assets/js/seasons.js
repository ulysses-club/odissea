/**
 * Класс для создания сезонных эффектов на веб-странице
 * Автоматически определяет текущий сезон и создает соответствующие анимации
 */
class SeasonalEffects {
    /**
     * Конструктор класса SeasonalEffects
     * Инициализирует основные свойства и запускает создание эффектов
     */
    constructor() {
        this.container = null;
        this.currentSeason = this.getCurrentSeason();
        this.elements = [];
        this.isEnabled = true;
        this.toggleElement = null;
        this.init();
    }

    /**
     * Инициализация системы сезонных эффектов
     * Создает контейнер, переключатель и эффекты, настраивает обработчики
     */
    init() {
        this.createContainer();
        this.initToggle();
        this.createEffects();
        this.handleResize();

        // Применяем начальное состояние после создания эффектов
        this.applyEnabledState();
    }

    /**
     * Инициализация переключателя сезонных эффектов
     * Создает UI-элемент для включения/выключения эффектов
     * Восстанавливает состояние из localStorage
     */
    initToggle() {
        // Создаем переключатель если его нет
        if (!document.getElementById('seasons-toggle')) {
            const toggleHTML = `
            <div class="seasons-toggle-container">
                <label class="seasons-toggle">
                    <input type="checkbox" id="seasons-toggle" checked>
                    <span class="slider"></span>
                    <span class="toggle-label">Сезонные эффекты</span>
                </label>
            </div>
            `;
            document.body.insertAdjacentHTML('beforeend', toggleHTML);
        }

        this.toggleElement = document.getElementById('seasons-toggle');

        // Восстанавливаем состояние из localStorage
        const savedState = localStorage.getItem('seasonsEnabled');
        if (savedState !== null) {
            this.isEnabled = savedState === 'true';
            this.toggleElement.checked = this.isEnabled;
        }

        // Добавляем обработчик события
        this.toggleElement.addEventListener('change', (e) => {
            this.setEnabled(e.target.checked);
        });
    }

    /**
     * Устанавливает состояние активности сезонных эффектов
     * Сохраняет настройки в localStorage и применяет изменения
     * 
     * @param {boolean} enabled - true для включения, false для выключения
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        localStorage.setItem('seasonsEnabled', enabled);
        this.applyEnabledState();
    }

    /**
     * Применяет текущее состояние активности к визуальным элементам
     * Показывает/скрывает контейнер и управляет анимациями
     */
    applyEnabledState() {
        if (this.container) {
            if (this.isEnabled) {
                this.container.style.display = 'block';
                this.resume();
                // Пересоздаем эффекты если контейнер пустой
                if (this.elements.length === 0) {
                    this.createEffects();
                }
            } else {
                this.container.style.display = 'none';
                this.pause();
            }
        }
    }

    /**
     * Определяет текущий сезон на основе текущей даты
     * 
     * @returns {string} - название сезона: 'spring', 'summer', 'autumn', 'winter'
     */
    getCurrentSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }

    /**
     * Создает контейнер для сезонных эффектов
     * Если контейнер уже существует, использует его
     */
    createContainer() {
        // Проверяем, не существует ли уже контейнер
        let container = document.querySelector('.seasons-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'seasons-container';
            document.body.appendChild(container);
        }
        this.container = container;
    }

    /**
     * Создает сезонные эффекты в зависимости от текущего сезона
     * Предварительно очищает предыдущие эффекты
     */
    createEffects() {
        // Очищаем предыдущие эффекты
        this.cleanup();

        if (!this.isEnabled) return;

        switch (this.currentSeason) {
            case 'autumn':
                this.createAutumnEffects();
                break;
            case 'winter':
                this.createWinterEffects();
                break;
            case 'spring':
                this.createSpringEffects();
                break;
            case 'summer':
                this.createSummerEffects();
                break;
        }
    }

    /**
     * Создает эффекты для осени (падающие листья)
     */
    createAutumnEffects() {
        const leafCount = 15;
        for (let i = 0; i < leafCount; i++) {
            setTimeout(() => {
                this.createLeaf(i);
            }, i * 300);
        }
    }

    /**
     * Создает отдельный лист для осенних эффектов
     * 
     * @param {number} index - индекс листа для задержки анимации
     */
    createLeaf(index) {
        if (!this.isEnabled) return;

        const leaf = document.createElement('div');
        leaf.className = 'season-element leaf';

        const left = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 8 + Math.random() * 7;

        leaf.style.left = `${left}vw`;
        leaf.style.animationDelay = `${delay}s`;
        leaf.style.animationDuration = `${duration}s`;

        const size = 20 + Math.random() * 20;
        leaf.style.width = `${size}px`;
        leaf.style.height = `${size}px`;

        this.container.appendChild(leaf);
        this.elements.push(leaf);
    }

    /**
     * Создает эффекты для зимы (падающий снег)
     */
    createWinterEffects() {
        const snowflakeCount = 25;
        for (let i = 0; i < snowflakeCount; i++) {
            setTimeout(() => {
                this.createSnowflake(i);
            }, i * 150);
        }
    }

    /**
     * Создает отдельную снежинку для зимних эффектов
     * 
     * @param {number} index - индекс снежинки для задержки анимации
     */
    createSnowflake(index) {
        if (!this.isEnabled) return;

        const snowflake = document.createElement('div');
        snowflake.className = 'season-element snowflake';

        const left = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = 10 + Math.random() * 10;
        const size = 12 + Math.random() * 16;

        snowflake.style.left = `${left}vw`;
        snowflake.style.animationDelay = `${delay}s`;
        snowflake.style.animationDuration = `${duration}s`;
        snowflake.style.fontSize = `${size}px`;
        snowflake.style.opacity = 0.3 + Math.random() * 0.5;

        this.container.appendChild(snowflake);
        this.elements.push(snowflake);
    }

    /**
     * Создает эффекты для весны (бабочки и цветы)
     */
    createSpringEffects() {
        const butterflyCount = 8;
        const flowerCount = 12;

        for (let i = 0; i < butterflyCount; i++) {
            setTimeout(() => {
                this.createButterfly(i);
            }, i * 500);
        }

        for (let i = 0; i < flowerCount; i++) {
            setTimeout(() => {
                this.createFlower(i);
            }, i * 800);
        }
    }

    /**
     * Создает бабочку для весенних эффектов
     * 
     * @param {number} index - индекс бабочки для задержки анимации
     */
    createButterfly(index) {
        if (!this.isEnabled) return;

        const butterfly = document.createElement('div');
        butterfly.className = 'season-element butterfly';

        const top = 20 + Math.random() * 60;
        const delay = Math.random() * 5;
        const duration = 15 + Math.random() * 10;

        butterfly.style.top = `${top}vh`;
        butterfly.style.left = `${Math.random() * 100}vw`;
        butterfly.style.animationDelay = `${delay}s`;
        butterfly.style.animationDuration = `${duration}s`;

        this.container.appendChild(butterfly);
        this.elements.push(butterfly);
    }

    /**
     * Создает цветок для весенних эффектов
     * 
     * @param {number} index - индекс цветка для задержки анимации
     */
    createFlower(index) {
        if (!this.isEnabled) return;

        const flower = document.createElement('div');
        flower.className = 'season-element flower';

        const left = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = 20 + Math.random() * 10;

        flower.style.bottom = '50px';
        flower.style.left = `${left}vw`;
        flower.style.animationDelay = `${delay}s`;
        flower.style.animationDuration = `${duration}s`;

        this.container.appendChild(flower);
        this.elements.push(flower);
    }

    /**
     * Создает эффекты для лета (солнечные лучи)
     */
    createSummerEffects() {
        const rayCount = 5;
        for (let i = 0; i < rayCount; i++) {
            setTimeout(() => {
                this.createSunRay(i);
            }, i * 1000);
        }
    }

    /**
     * Создает солнечный луч для летних эффектов
     * 
     * @param {number} index - индекс луча для определения угла поворота
     */
    createSunRay(index) {
        if (!this.isEnabled) return;

        const ray = document.createElement('div');
        ray.className = 'season-element sun-ray';

        const angle = (360 / rayCount) * index;
        const delay = Math.random() * 3;

        ray.style.transform = `rotate(${angle}deg)`;
        ray.style.transformOrigin = 'center';
        ray.style.animationDelay = `${delay}s`;

        this.container.appendChild(ray);
        this.elements.push(ray);
    }

    /**
     * Настраивает обработчик изменения размера окна
     * Пересоздает эффекты при изменении размера с задержкой
     */
    handleResize() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.cleanup();
                if (this.isEnabled) {
                    this.createEffects();
                }
            }, 250);
        });
    }

    /**
     * Очищает все созданные сезонные эффекты
     * Удаляет элементы из DOM и очищает массив элементов
     */
    cleanup() {
        this.elements.forEach(element => {
            if (element.parentNode === this.container) {
                this.container.removeChild(element);
            }
        });
        this.elements = [];
    }

    /**
     * Приостанавливает все анимации сезонных эффектов
     */
    pause() {
        this.elements.forEach(element => {
            element.style.animationPlayState = 'paused';
        });
    }

    /**
     * Возобновляет все анимации сезонных эффектов
     */
    resume() {
        this.elements.forEach(element => {
            element.style.animationPlayState = 'running';
        });
    }

    /**
     * Изменяет текущий сезон и пересоздает эффекты
     * 
     * @param {string} season - название сезона: 'spring', 'summer', 'autumn', 'winter'
     */
    changeSeason(season) {
        if (['spring', 'summer', 'autumn', 'winter'].includes(season)) {
            this.currentSeason = season;
            this.cleanup();
            if (this.isEnabled) {
                this.createEffects();
            }
        }
    }

    /**
     * Возвращает текущий сезон
     * 
     * @returns {string} - название текущего сезона
     */
    getSeason() {
        return this.currentSeason;
    }

    /**
     * Устанавливает новый сезон (синоним для changeSeason)
     * 
     * @param {string} season - название сезона: 'spring', 'summer', 'autumn', 'winter'
     */
    setSeason(season) {
        this.changeSeason(season);
    }
}

// Правильная инициализация после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // Небольшая задержка для гарантии полной загрузки
    setTimeout(() => {
        window.seasonalEffects = new SeasonalEffects();
    }, 100);
});

// Экспорт для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SeasonalEffects;
}
