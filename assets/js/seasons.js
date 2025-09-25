class SeasonalEffects {
    constructor() {
        this.container = null;
        this.currentSeason = this.getCurrentSeason();
        this.elements = [];
        this.init();
    }

    // Определение текущего сезона
    getCurrentSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }

    // Инициализация
    init() {
        this.createContainer();
        this.createEffects();
        this.handleResize();
    }

    // Создание контейнера для эффектов
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'seasons-container';
        document.body.appendChild(this.container);
    }

    // Создание эффектов в зависимости от сезона
    createEffects() {
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

    // Осень - падающие листья
    createAutumnEffects() {
        const leafCount = 15;
        
        for (let i = 0; i < leafCount; i++) {
            setTimeout(() => {
                this.createLeaf(i);
            }, i * 300);
        }
    }

    createLeaf(index) {
        const leaf = document.createElement('div');
        leaf.className = 'season-element leaf';
        
        // Случайная позиция
        const left = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 8 + Math.random() * 7;
        
        leaf.style.left = `${left}vw`;
        leaf.style.animationDelay = `${delay}s`;
        leaf.style.animationDuration = `${duration}s`;
        
        // Случайный размер
        const size = 20 + Math.random() * 20;
        leaf.style.width = `${size}px`;
        leaf.style.height = `${size}px`;
        
        this.container.appendChild(leaf);
        this.elements.push(leaf);
    }

    // Зима - падающий снег
    createWinterEffects() {
        const snowflakeCount = 25;
        
        for (let i = 0; i < snowflakeCount; i++) {
            setTimeout(() => {
                this.createSnowflake(i);
            }, i * 150);
        }
    }

    createSnowflake(index) {
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
        
        // Случайное мерцание
        snowflake.style.opacity = 0.3 + Math.random() * 0.5;
        
        this.container.appendChild(snowflake);
        this.elements.push(snowflake);
    }

    // Весна - бабочки и цветы
    createSpringEffects() {
        const butterflyCount = 8;
        const flowerCount = 12;
        
        // Бабочки
        for (let i = 0; i < butterflyCount; i++) {
            setTimeout(() => {
                this.createButterfly(i);
            }, i * 500);
        }
        
        // Цветы (появляются на "земле")
        for (let i = 0; i < flowerCount; i++) {
            setTimeout(() => {
                this.createFlower(i);
            }, i * 800);
        }
    }

    createButterfly(index) {
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

    createFlower(index) {
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

    // Лето - солнечные лучи
    createSummerEffects() {
        const rayCount = 5;
        
        for (let i = 0; i < rayCount; i++) {
            setTimeout(() => {
                this.createSunRay(i);
            }, i * 1000);
        }
    }

    createSunRay(index) {
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

    // Обработка изменения размера окна
    handleResize() {
        window.addEventListener('resize', () => {
            this.cleanup();
            this.createEffects();
        });
    }

    // Очистка эффектов
    cleanup() {
        this.elements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.elements = [];
    }

    // Смена сезона (для тестирования)
    changeSeason(season) {
        this.currentSeason = season;
        this.cleanup();
        this.createEffects();
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.seasonalEffects = new SeasonalEffects();
});

// Экспорт для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SeasonalEffects;
}

// Дополнительные методы управления
SeasonalEffects.prototype = {
    // Пауза всех анимаций
    pause: function() {
        this.elements.forEach(element => {
            element.style.animationPlayState = 'paused';
        });
    },
    
    // Возобновление анимаций
    resume: function() {
        this.elements.forEach(element => {
            element.style.animationPlayState = 'running';
        });
    },
    
    // Получение текущего сезона
    getSeason: function() {
        return this.currentSeason;
    },
    
    // Принудительная смена сезона
    setSeason: function(season) {
        if (['spring', 'summer', 'autumn', 'winter'].includes(season)) {
            this.changeSeason(season);
        }
    }
};