/**
 * Модуль сезонных эффектов для киноклуба Одиссея
 * Автоматически определяет сезон и создает соответствующие анимации
 */
class SeasonsEffectsModule {
    constructor() {
        this.container = null;
        this.toggle = null;
        this.currentSeason = this.getCurrentSeason();
        this.elements = [];
        this.isEnabled = true;
        this.pageType = this.detectPageType();
        
        this.effectsConfig = {
            autumn: {
                elements: ['leaf'],
                density: 15,
                maxElements: 20
            },
            winter: {
                elements: ['snowflake'],
                density: 25,
                maxElements: 30
            },
            spring: {
                elements: ['butterfly', 'flower'],
                density: 12,
                maxElements: 20
            },
            summer: {
                elements: ['sun-ray', 'bubble'],
                density: 8,
                maxElements: 15
            }
        };
        
        this.init();
    }

    /**
     * Инициализация модуля сезонных эффектов
     */
    init() {
        this.createContainer();
        this.createToggle();
        this.applyPageSpecificSettings();
        this.createEffects();
        this.setupEventListeners();
        
        // Восстанавливаем состояние из localStorage
        this.restoreState();
    }

    /**
     * Создает контейнер для сезонных эффектов
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
     * Создает переключатель сезонных эффектов
     */
    createToggle() {
        if (!document.getElementById('seasons-toggle-container')) {
            const toggleHTML = `
                <div class="seasons-toggle-container" id="seasons-toggle-container">
                    <label class="seasons-toggle">
                        <input type="checkbox" id="seasons-toggle" checked>
                        <span class="slider"></span>
                        <span class="toggle-label">Сезонные эффекты</span>
                    </label>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', toggleHTML);
        }
        
        this.toggle = document.getElementById('seasons-toggle');
    }

    /**
     * Определяет текущий сезон на основе даты
     */
    getCurrentSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }

    /**
     * Определяет тип страницы для специфичных настроек
     */
    detectPageType() {
        const path = window.location.pathname;
        
        if (path.includes('index.html') || path.endsWith('/') || path.includes('/kinoclub-odisseya/')) {
            return 'home';
        } else if (path.includes('quiz.html')) {
            return 'quiz';
        } else if (path.includes('crocodile-game.html')) {
            return 'crocodile';
        } else if (path.includes('Interactive-game.html')) {
            return 'interactive';
        } else {
            return 'other';
        }
    }

    /**
     * Применяет специфичные настройки для разных типов страниц
     */
    applyPageSpecificSettings() {
        // Добавляем класс к body для специфичных стилей
        document.body.classList.add(`${this.pageType}-page`);
        
        // Настройки плотности эффектов для разных страниц
        const densityMultipliers = {
            'home': 1.0,
            'quiz': 0.7,
            'crocodile': 0.4,
            'interactive': 0.3,
            'other': 0.8
        };
        
        const multiplier = densityMultipliers[this.pageType] || 0.8;
        
        // Корректируем конфигурацию эффектов
        Object.keys(this.effectsConfig).forEach(season => {
            this.effectsConfig[season].density = Math.floor(
                this.effectsConfig[season].density * multiplier
            );
            this.effectsConfig[season].maxElements = Math.floor(
                this.effectsConfig[season].maxElements * multiplier
            );
        });
    }

    /**
     * Создает сезонные эффекты
     */
    createEffects() {
        if (!this.isEnabled) return;
        
        this.cleanup();
        
        const config = this.effectsConfig[this.currentSeason];
        if (!config) return;
        
        config.elements.forEach(elementType => {
            this.createElementType(elementType, config);
        });
    }

    /**
     * Создает элементы определенного типа
     */
    createElementType(elementType, config) {
        const count = Math.min(config.density, config.maxElements);
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (this.isEnabled) {
                    this.createElement(elementType, i);
                }
            }, i * (2000 / count)); // Распределяем создание во времени
        }
    }

    /**
     * Создает отдельный элемент эффекта
     */
    createElement(type, index) {
        if (!this.isEnabled || !this.container) return;
        
        const element = document.createElement('div');
        element.className = `season-element ${type}`;
        
        // Уникальные настройки для каждого типа элементов
        this.setupElementProperties(element, type, index);
        
        this.container.appendChild(element);
        this.elements.push(element);
        
        // Удаляем элемент после завершения анимации
        this.setupElementCleanup(element, type);
    }

    /**
     * Настраивает свойства элемента в зависимости от типа
     */
    setupElementProperties(element, type, index) {
        const left = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = 8 + Math.random() * 12;
        
        element.style.left = `${left}vw`;
        element.style.animationDelay = `${delay}s`;
        element.style.animationDuration = `${duration}s`;
        
        switch (type) {
            case 'leaf':
                const leafSize = 15 + Math.random() * 25;
                element.style.width = `${leafSize}px`;
                element.style.height = `${leafSize}px`;
                element.style.opacity = 0.6 + Math.random() * 0.3;
                break;
                
            case 'snowflake':
                const snowSize = 12 + Math.random() * 16;
                element.style.fontSize = `${snowSize}px`;
                element.style.opacity = 0.3 + Math.random() * 0.4;
                break;
                
            case 'butterfly':
                element.style.top = `${20 + Math.random() * 60}vh`;
                element.style.opacity = 0.5 + Math.random() * 0.3;
                break;
                
            case 'flower':
                element.style.bottom = '30px';
                element.style.opacity = 0.4 + Math.random() * 0.4;
                break;
                
            case 'sun-ray':
                element.style.top = `${Math.random() * 20}vh`;
                element.style.left = `${Math.random() * 100}vw`;
                element.style.opacity = 0.2 + Math.random() * 0.3;
                break;
                
            case 'bubble':
                const bubbleSize = 10 + Math.random() * 20;
                element.style.width = `${bubbleSize}px`;
                element.style.height = `${bubbleSize}px`;
                element.style.left = `${Math.random() * 100}vw`;
                element.style.opacity = 0.2 + Math.random() * 0.3;
                break;
        }
    }

    /**
     * Настраивает автоматическую очистку элемента после анимации
     */
    setupElementCleanup(element, type) {
        const duration = parseFloat(element.style.animationDuration) * 1000;
        
        setTimeout(() => {
            if (element.parentNode === this.container) {
                this.container.removeChild(element);
                this.elements = this.elements.filter(el => el !== element);
                
                // Создаем новый элемент для бесконечного цикла
                if (this.isEnabled) {
                    setTimeout(() => {
                        this.createElement(type, Math.random() * 1000);
                    }, Math.random() * 5000);
                }
            }
        }, duration + 1000);
    }

    /**
     * Настраивает обработчики событий
     */
    setupEventListeners() {
        // Переключатель
        if (this.toggle) {
            this.toggle.addEventListener('change', (e) => {
                this.setEnabled(e.target.checked);
            });
        }
        
        // Изменение размера окна
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
        
        // Видимость страницы
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    /**
     * Обработчик изменения размера окна
     */
    handleResize() {
        // При сильном изменении размера пересоздаем эффекты
        this.cleanup();
        if (this.isEnabled) {
            setTimeout(() => this.createEffects(), 100);
        }
    }

    /**
     * Восстанавливает состояние из localStorage
     */
    restoreState() {
        try {
            const savedState = localStorage.getItem('seasonsEffectsEnabled');
            if (savedState !== null) {
                this.setEnabled(savedState === 'true');
                if (this.toggle) {
                    this.toggle.checked = this.isEnabled;
                }
            }
        } catch (error) {
            console.warn('Не удалось восстановить состояние сезонных эффектов:', error);
        }
    }

    /**
     * Устанавливает состояние активности эффектов
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        try {
            localStorage.setItem('seasonsEffectsEnabled', enabled);
        } catch (error) {
            console.warn('Не удалось сохранить состояние сезонных эффектов:', error);
        }
        
        if (enabled) {
            this.container.style.display = 'block';
            this.createEffects();
            this.resume();
        } else {
            this.container.style.display = 'none';
            this.cleanup();
            this.pause();
        }
    }

    /**
     * Очищает все эффекты
     */
    cleanup() {
        if (this.container) {
            this.elements.forEach(element => {
                if (element.parentNode === this.container) {
                    this.container.removeChild(element);
                }
            });
        }
        this.elements = [];
    }

    /**
     * Приостанавливает анимации
     */
    pause() {
        this.elements.forEach(element => {
            element.style.animationPlayState = 'paused';
        });
    }

    /**
     * Возобновляет анимации
     */
    resume() {
        this.elements.forEach(element => {
            element.style.animationPlayState = 'running';
        });
    }

    /**
     * Изменяет текущий сезон
     */
    setSeason(season) {
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
     */
    getSeason() {
        return this.currentSeason;
    }

    /**
     * Возвращает состояние активности
     */
    getEnabled() {
        return this.isEnabled;
    }

    /**
     * Обновляет конфигурацию эффектов
     */
    updateConfig(newConfig) {
        this.effectsConfig = { ...this.effectsConfig, ...newConfig };
        if (this.isEnabled) {
            this.cleanup();
            this.createEffects();
        }
    }
}

/**
 * Функция инициализации сезонных эффектов
 */
function initSeasonsEffects() {
    try {
        window.seasonsEffects = new SeasonsEffectsModule();
        console.log('Сезонные эффекты инициализированы');
    } catch (error) {
        console.error('Ошибка инициализации сезонных эффектов:', error);
    }
}

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSeasonsEffects);
} else {
    initSeasonsEffects();
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SeasonsEffectsModule, initSeasonsEffects };
}
