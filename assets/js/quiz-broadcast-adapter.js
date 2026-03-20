/**
 * Адаптер для режима трансляции квиза
 * Обеспечивает корректное отображение контента в пределах окна
 * Не нарушает исходную логику Quiz
 */

(function() {
    // Сохраняем оригинальные методы
    const originalShowQuestion = Quiz.prototype.showQuestion;
    const originalShowAnswerSlide = Quiz.prototype.showAnswerSlide;
    const originalShowInstructions = Quiz.prototype.showInstructions;
    const originalShowRoundIntro = Quiz.prototype.showRoundIntro;
    const originalShowRoundAnswers = Quiz.prototype.showRoundAnswers;
    const originalFinishRound = Quiz.prototype.finishRound;

    /**
     * Добавляет структурные секции к слайду для правильного распределения пространства
     */
    function addStructuralSections(slide) {
        if (!slide || slide.querySelector('.quiz-top-section')) return;

        const header = slide.querySelector('.question-header');
        const content = slide.querySelector('.question-content');
        const navigation = slide.querySelector('.quiz-navigation');
        const instruction = slide.querySelector('.quiz-instruction');

        if (header && content) {
            // Создаем и добавляем верхнюю секцию
            let topSection = slide.querySelector('.quiz-top-section');
            if (!topSection) {
                topSection = document.createElement('div');
                topSection.className = 'quiz-top-section';
                slide.insertBefore(topSection, slide.firstChild);
            }
            if (header.parentElement !== topSection) {
                topSection.appendChild(header);
            }

            // Создаем и добавляем среднюю секцию
            let middleSection = slide.querySelector('.quiz-middle-section');
            if (!middleSection) {
                middleSection = document.createElement('div');
                middleSection.className = 'quiz-middle-section';
                topSection.insertAdjacentElement('afterend', middleSection);
            }
            if (content.parentElement !== middleSection) {
                middleSection.appendChild(content);
            }

            // Переносим контейнер ответов в отдельную секцию внутри middleSection
            const answersSection = content.querySelector('.answers-grid, .blitz-container, .open-answer-instruction, .correct-answer-section');
            let answersContainer = middleSection.querySelector('.quiz-answers-section');
            
            if (answersSection) {
                if (!answersContainer) {
                    answersContainer = document.createElement('div');
                    answersContainer.className = 'quiz-answers-section';
                    content.appendChild(answersContainer);
                }
                if (answersSection.parentElement !== answersContainer) {
                    answersContainer.appendChild(answersSection);
                }
            }

            // Создаем и добавляем нижнюю секцию
            let bottomSection = slide.querySelector('.quiz-bottom-section');
            if (!bottomSection) {
                bottomSection = document.createElement('div');
                bottomSection.className = 'quiz-bottom-section';
                middleSection.insertAdjacentElement('afterend', bottomSection);
            }
            
            if (instruction) {
                bottomSection.appendChild(instruction);
            }
            if (navigation) {
                bottomSection.appendChild(navigation);
            }
        }
    }

    /**
     * Адаптирует все слайды на странице
     */
    function adaptAllSlides() {
        setTimeout(() => {
            const slides = document.querySelectorAll('.question-slide, .answer-slide, .instructions-container, .round-intro, .round-results');
            slides.forEach(slide => {
                addStructuralSections(slide);
            });
            
            // Дополнительно обрабатываем инструкции
            const instructions = document.querySelector('.instructions-container');
            if (instructions && !instructions.querySelector('.quiz-top-section')) {
                instructions.classList.add('force-fit');
            }
        }, 30);
    }

    // Переопределяем метод showQuestion
    Quiz.prototype.showQuestion = function() {
        originalShowQuestion.apply(this, arguments);
        adaptAllSlides();
    };

    // Переопределяем метод showAnswerSlide
    Quiz.prototype.showAnswerSlide = function() {
        originalShowAnswerSlide.apply(this, arguments);
        adaptAllSlides();
    };

    // Переопределяем метод showInstructions
    Quiz.prototype.showInstructions = function() {
        originalShowInstructions.apply(this, arguments);
        adaptAllSlides();
    };

    // Переопределяем метод showRoundIntro
    Quiz.prototype.showRoundIntro = function() {
        originalShowRoundIntro.apply(this, arguments);
        adaptAllSlides();
    };

    // Переопределяем метод showRoundAnswers
    Quiz.prototype.showRoundAnswers = function() {
        originalShowRoundAnswers.apply(this, arguments);
        adaptAllSlides();
    };

    // Переопределяем метод finishRound
    Quiz.prototype.finishRound = function() {
        originalFinishRound.apply(this, arguments);
        adaptAllSlides();
    };

    // Обработчик изменения размера окна
    function handleResize() {
        const container = document.querySelector('.quiz-container');
        if (container) {
            container.style.height = window.innerHeight + 'px';
            container.style.width = window.innerWidth + 'px';
        }
        
        // Переадаптируем текущие слайды
        adaptAllSlides();
    }

    // Инициализация при загрузке
    document.addEventListener('DOMContentLoaded', function() {
        // Устанавливаем размеры контейнера
        const container = document.querySelector('.quiz-container');
        if (container) {
            container.style.height = window.innerHeight + 'px';
            container.style.width = window.innerWidth + 'px';
        }
        
        // Добавляем обработчик resize
        window.addEventListener('resize', handleResize);
        
        // Наблюдаем за изменениями в DOM
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    adaptAllSlides();
                }
            });
        });
        
        observer.observe(document.querySelector('#quiz-questions') || document.body, {
            childList: true,
            subtree: true
        });
        
        // Первичная адаптация
        adaptAllSlides();
    });
})();