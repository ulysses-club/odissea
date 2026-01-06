/**
 * setup-guide.js - Модернизированная логика для страницы настройки устройств
 * Оптимизированная производительность, modern interactions
 */

class SetupGuide {
    constructor() {
        this.sections = [];
        this.currentSection = null;
        this.isScrolling = false;
        this.init();
    }

    init() {
        console.log('🚀 Страница настройки устройств инициализируется...');
        
        this.cacheElements();
        this.initLazyLoading();
        this.initSectionNavigation();
        this.initScrollAnimations();
        this.initMobileOptimizations();
        this.initObservers();
        
        // Добавляем обработчик для кнопок "Перейти"
        this.initDownloadButtons();
        
        console.log('✅ Страница настройки устройств готова!');
    }

    cacheElements() {
        this.DOM = {
            sections: document.querySelectorAll('.setup-section'),
            navCards: document.querySelectorAll('.nav-card'),
            softwareItems: document.querySelectorAll('.software-item'),
            downloadLinks: document.querySelectorAll('.download-link'),
            images: document.querySelectorAll('img[loading="lazy"]'),
            aboutQuote: document.querySelector('.about__quote')
        };
    }

    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '100px 0px',
                threshold: 0.01
            });

            this.DOM.images.forEach(img => imageObserver.observe(img));
        }
    }

    loadImage(img) {
        // Если изображение уже загружено
        if (img.complete) {
            img.classList.add('loaded');
            return;
        }
        
        // Добавляем эффект загрузки
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        img.onload = () => {
            img.style.opacity = '1';
            img.classList.add('loaded');
        };
        
        // Обработка ошибок загрузки
        img.onerror = () => {
            console.warn('Не удалось загрузить изображение:', img.src);
            if (img.dataset.fallback) {
                img.src = img.dataset.fallback;
            } else if (img.hasAttribute('onerror')) {
                // Используем fallback из атрибута onerror
                const onerrorAttr = img.getAttribute('onerror');
                const match = onerrorAttr.match(/this\.src='([^']+)'/);
                if (match && match[1]) {
                    img.src = match[1];
                }
            }
        };
    }

    initSectionNavigation() {
        // Навигация по карточкам
        this.DOM.navCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = card.getAttribute('href').slice(1);
                this.scrollToSection(targetId);
                
                // Анимация клика
                this.animateClick(card);
            });
        });

        // Навигация по якорным ссылкам
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#') return;
                
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    this.scrollToElement(targetElement);
                    
                    // Обновление URL
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }
                }
            });
        });
    }

    initScrollAnimations() {
        const animatedElements = document.querySelectorAll('.fade-in, .parameter-card, .software-item, .tip-card, .app-item');
        
        if ('IntersectionObserver' in window) {
            const animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateElement(entry.target);
                        animationObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });
            
            animatedElements.forEach(el => {
                this.prepareForAnimation(el);
                animationObserver.observe(el);
            });
        }
    }

    prepareForAnimation(el) {
        if (el.classList.contains('fade-in')) return;
        
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Добавляем задержку на основе класса
        const delayClass = Array.from(el.classList).find(cls => cls.startsWith('delay-'));
        if (delayClass) {
            const delay = delayClass.split('-')[1] * 0.1;
            el.style.transitionDelay = `${delay}s`;
        }
    }

    animateElement(el) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        el.classList.add('animated');
    }

    initMobileOptimizations() {
        // Определяем тач-устройство
        if ('ontouchstart' in window) {
            document.documentElement.classList.add('touch-device');
            
            // Оптимизация для тач-элементов
            const touchElements = document.querySelectorAll('.nav-card, .software-item, .tip-card, .download-link, .app-item');
            touchElements.forEach(el => {
                el.style.touchAction = 'manipulation';
                el.style.WebkitTapHighlightColor = 'transparent';
            });
        }
        
        // Проверка на медленные соединения
        if (navigator.connection) {
            const connection = navigator.connection;
            
            if (connection.saveData || connection.effectiveType.includes('2g')) {
                this.optimizeForSlowConnection();
            }
        }
    }

    optimizeForSlowConnection() {
        document.documentElement.classList.add('save-data');
        
        // Убираем тяжелые анимации
        const heavyAnimations = document.querySelectorAll('[class*="animate"], .fade-in, .nav-card, .tip-card');
        heavyAnimations.forEach(el => {
            el.style.animation = 'none';
            el.style.transition = 'none';
        });
        
        // Отключаем фоновые изображения
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            if (!img.classList.contains('essential')) {
                img.style.display = 'none';
            }
        });
    }

    initDownloadButtons() {
        this.DOM.downloadLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.getAttribute('href').startsWith('#')) return;
                
                // Открываем в новой вкладке
                window.open(link.href, '_blank', 'noopener,noreferrer');
                
                // Добавляем индикатор загрузки
                const originalText = link.innerHTML;
                link.innerHTML = `
                    <span class="spinner"></span>
                    <span>Загрузка...</span>
                `;
                link.style.pointerEvents = 'none';
                
                // Восстанавливаем через 2 секунды
                setTimeout(() => {
                    link.innerHTML = originalText;
                    link.style.pointerEvents = '';
                    
                    // Показываем уведомление
                    this.showNotification('Ссылка открыта в новой вкладке', 'success');
                }, 2000);
            });
        });
    }

    initObservers() {
        // Отслеживаем видимость изображений для прогрессивной загрузки
        const imgObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        delete img.dataset.src;
                    }
                }
            });
        });
        
        document.querySelectorAll('img[loading="lazy"][data-src]').forEach(img => {
            imgObserver.observe(img);
        });
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            this.scrollToElement(section);
            this.updateActiveSection(sectionId);
        }
    }

    scrollToElement(element) {
        if (this.isScrolling) return;
        
        this.isScrolling = true;
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const elementPosition = element.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
        
        setTimeout(() => {
            this.isScrolling = false;
        }, 1000);
    }

    updateActiveSection(sectionId) {
        // Обновляем активные навигационные карточки
        this.DOM.navCards.forEach(card => {
            const href = card.getAttribute('href').slice(1);
            card.classList.toggle('active', href === sectionId);
        });
        
        this.currentSection = sectionId;
    }

    animateClick(element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = '';
        }, 150);
    }

    showNotification(message, type = 'info') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Стили уведомления
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success)' : 'var(--info)'};
            color: white;
            padding: var(--space-md) var(--space-lg);
            border-radius: var(--radius-md);
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
            box-shadow: var(--shadow-lg);
        `;
        
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Утилиты
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

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
        };
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.setupGuide = new SetupGuide();
    
    // Добавляем стили для уведомлений
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s linear infinite;
            margin-right: 8px;
        }
        
        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }
        
        .img.loaded {
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(style);
});

// Глобальные обработчики
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Загрузка не критичных ресурсов
    setTimeout(() => {
        loadNonCriticalResources();
    }, 2000);
});

function loadNonCriticalResources() {
    // Загрузка дополнительных шрифтов, иконок
    console.log('📦 Загрузка нефункциональных ресурсов...');
    
    // Предзагрузка изображений для следующей секции
    const nextImages = document.querySelectorAll('img[loading="lazy"]:not([src])');
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            nextImages.forEach(img => {
                if (img.dataset.src) {
                    const tempImg = new Image();
                    tempImg.src = img.dataset.src;
                }
            });
        });
    }
}

// Экспорт для использования в других модулях
window.SetupGuideUtils = {
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    scrollToElement: (element) => {
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const elementPosition = element.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
};
