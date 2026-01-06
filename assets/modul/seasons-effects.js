/**
 * Модуль сезонных эффектов для киноклуба Одиссея
 * @optimized Оптимизирован для производительности
 * @integrated Переключатель перенесен в навигацию
 */
class SeasonsEffects {
    constructor() {
        this.container = null;
        this.currentSeason = this.detectSeason();
        this.elements = [];
        this.isEnabled = false;
        this.pageType = this.detectPageType();
        this.init();
    }

    /** Определяет текущий сезон */
    detectSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }

    /** Определяет тип страницы */
    detectPageType() {
        const path = window.location.pathname;
        if (path.includes('index.html') || path.endsWith('/') || path.includes('/kinoclub-odisseya/')) return 'home';
        if (path.includes('quiz.html')) return 'quiz';
        if (path.includes('crocodile-game.html')) return 'crocodile';
        if (path.includes('Interactive-game.html')) return 'interactive';
        if (path.includes('randomizer.html')) return 'randomizer';
        return 'other';
    }

    /** Инициализация модуля */
    init() {
        this.createContainer();
        this.loadState();
        this.initToggle(); // Инициализируем переключатель
        if (this.isEnabled) this.start();
    }

    /** Создает контейнер для эффектов */
    createContainer() {
        const container = document.querySelector('.seasons-container');
        if (!container) {
            const div = document.createElement('div');
            div.className = 'seasons-container';
            document.body.appendChild(div);
            this.container = div;
        } else {
            this.container = container;
        }
    }

    /** Инициализация переключателя */
    initToggle() {
        // Ждем, пока навигация создаст переключатель
        setTimeout(() => {
            const toggle = document.getElementById('seasons-toggle');
            if (!toggle) return;

            // Устанавливаем начальное состояние
            toggle.checked = this.isEnabled;
            
            // Добавляем обработчик
            toggle.addEventListener('change', (e) => {
                const isEnabled = this.toggle();
                console.log(`🎨 Сезонные эффекты ${isEnabled ? 'включены' : 'отключены'}`);
            });
        }, 100);
    }

    /** Обновляет состояние переключателя в навигации */
    updateToggle() {
        const toggle = document.getElementById('seasons-toggle');
        if (toggle) {
            toggle.checked = this.isEnabled;
            
            // Добавляем анимацию к иконке
            const label = toggle.parentElement?.querySelector('.seasons-toggle-label');
            if (label) {
                label.style.animation = 'none';
                setTimeout(() => {
                    label.style.animation = 'togglePulse 0.5s ease';
                }, 10);
            }
        }
    }

    /** Загружает сохраненное состояние */
    loadState() {
        try {
            const saved = localStorage.getItem('seasonsEffects');
            this.isEnabled = saved ? JSON.parse(saved).enabled : false;
        } catch {
            this.isEnabled = false;
        }
    }

    /** Сохраняет состояние */
    saveState() {
        try {
            localStorage.setItem('seasonsEffects', JSON.stringify({
                enabled: this.isEnabled,
                season: this.currentSeason
            }));
        } catch (error) {
            console.warn('Не удалось сохранить состояние эффектов:', error);
        }
    }

    /** Запускает эффекты */
    start() {
        this.cleanup();
        this.createEffects();
        this.updateToggle();
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    /** Останавливает эффекты */
    stop() {
        this.cleanup();
        this.updateToggle();
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /** Переключает состояние эффектов */
    toggle() {
        this.isEnabled = !this.isEnabled;
        this.saveState();
        
        if (this.isEnabled) {
            this.start();
        } else {
            this.stop();
        }
        
        return this.isEnabled;
    }

    /** Создает сезонные эффекты */
    createEffects() {
        if (!this.container) return;
        
        const density = this.getDensity();
        const config = this.getSeasonConfig();
        
        config.elements.forEach(type => {
            for (let i = 0; i < density; i++) {
                setTimeout(() => {
                    if (this.isEnabled) this.createElement(type, i);
                }, i * (2000 / density));
            }
        });
    }

    /** Получает плотность эффектов для страницы */
    getDensity() {
        const multipliers = {
            'home': 1.0, 'quiz': 0.7, 'crocodile': 0.4,
            'interactive': 0.3, 'randomizer': 0.5, 'other': 0.8
        };
        return Math.floor(15 * (multipliers[this.pageType] || 0.8));
    }

    /** Конфигурация сезонов */
    getSeasonConfig() {
        const configs = {
            autumn: { elements: ['leaf'], max: 20 },
            winter: { elements: ['snowflake'], max: 30 },
            spring: { elements: ['butterfly', 'flower'], max: 15 },
            summer: { elements: ['sun-ray', 'bubble'], max: 12 }
        };
        return configs[this.currentSeason] || configs.autumn;
    }

    /** Создает элемент эффекта */
    createElement(type, index) {
        if (!this.isEnabled || !this.container) return;

        const element = document.createElement('div');
        element.className = `season-element ${type}`;
        
        // Позиционирование
        element.style.left = `${Math.random() * 100}vw`;
        element.style.animationDelay = `${Math.random() * 10}s`;
        element.style.animationDuration = `${8 + Math.random() * 12}s`;
        
        // Настройки по типу
        this.setupElement(element, type);
        
        this.container.appendChild(element);
        this.elements.push(element);
        
        // Автоматическое удаление
        this.setupCleanup(element, type);
    }

    /** Настраивает элемент в зависимости от типа */
    setupElement(el, type) {
        switch(type) {
            case 'leaf':
                const leafSize = 15 + Math.random() * 25;
                el.style.width = `${leafSize}px`;
                el.style.height = `${leafSize}px`;
                el.style.opacity = 0.6 + Math.random() * 0.3;
                break;
            case 'snowflake':
                el.style.fontSize = `${12 + Math.random() * 16}px`;
                el.style.opacity = 0.3 + Math.random() * 0.4;
                el.innerHTML = '❄';
                break;
            case 'butterfly':
                el.style.top = `${20 + Math.random() * 60}vh`;
                el.style.opacity = 0.5 + Math.random() * 0.3;
                break;
            case 'flower':
                el.style.bottom = '30px';
                el.style.opacity = 0.4 + Math.random() * 0.4;
                break;
            case 'sun-ray':
                el.style.top = `${Math.random() * 20}vh`;
                el.style.opacity = 0.2 + Math.random() * 0.3;
                break;
            case 'bubble':
                const bubbleSize = 10 + Math.random() * 20;
                el.style.width = `${bubbleSize}px`;
                el.style.height = `${bubbleSize}px`;
                el.style.opacity = 0.2 + Math.random() * 0.3;
                break;
        }
    }

    /** Настраивает автоматическую очистку элемента */
    setupCleanup(element, type) {
        const duration = parseFloat(element.style.animationDuration) * 1000;
        
        setTimeout(() => {
            if (element.parentNode === this.container) {
                element.remove();
                this.elements = this.elements.filter(el => el !== element);
                
                // Воссоздание для бесконечного цикла
                if (this.isEnabled) {
                    setTimeout(() => this.createElement(type, Math.random() * 1000), Math.random() * 5000);
                }
            }
        }, duration + 1000);
    }

    /** Очищает все эффекты */
    cleanup() {
        if (this.container) {
            this.elements.forEach(el => el.remove());
        }
        this.elements = [];
    }

    /** Возвращает текущее состояние */
    getState() {
        return {
            enabled: this.isEnabled,
            season: this.currentSeason
        };
    }

    /** Устанавливает сезон (для тестирования) */
    setSeason(season) {
        if (['spring', 'summer', 'autumn', 'winter'].includes(season)) {
            this.currentSeason = season;
            if (this.isEnabled) {
                this.cleanup();
                this.createEffects();
            }
        }
    }
}

/** Инициализация сезонных эффектов */
function initSeasonsEffects() {
    try {
        window.seasonsEffects = new SeasonsEffects();
        console.log('🎨 Сезонные эффекты инициализированы');
    } catch (error) {
        console.error('Ошибка инициализации сезонных эффектов:', error);
    }
}

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSeasonsEffects);
} else {
    initSeasonsEffects();
}

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SeasonsEffects, initSeasonsEffects };
}
