class Quiz {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.currentRound = 1;
        this.score = 0;
        this.timer = null;
        this.timeLeft = 0;
        this.hintsUsed = 0;
        this.maxHints = 2;
        this.userAnswers = [];
        this.quizStarted = false;
        this.roundResults = [];
        this.showingAnswers = false;
        this.currentAnswerIndex = 0;

        // Определяем режим
        this.isBroadcastMode = document.body.classList.contains('quiz-broadcast');

        this.init();
    }

    async init() {
        await this.loadQuestions();
        this.bindEvents();

        // Для трансляции сразу применяем специальные стили
        if (this.isBroadcastMode) {
            this.applyBroadcastStyles();
        }
    }

    applyBroadcastStyles() {
        // Увеличиваем шрифты для лучшей читаемости в трансляции
        const style = document.createElement('style');
        style.textContent = `
            .quiz-broadcast .question-text {
                font-size: 2.5em !important;
                font-weight: 600;
            }
            .quiz-broadcast .answer-text {
                font-size: 1.8em !important;
                font-weight: 500;
            }
            .quiz-broadcast .quiz-instruction {
                font-size: 1.3em !important;
            }
            .quiz-broadcast .instruction-badge {
                font-size: 1.4em !important;
            }
        `;
        document.head.appendChild(style);
    }

    async loadQuestions() {
        try {
            const response = await fetch('../data/quiz-questions.json');
            const data = await response.json();
            this.questions = data.questions;
            this.quizConfig = data.config;
        } catch (error) {
            console.error('Ошибка загрузки вопросов:', error);
            this.loadFallbackQuestions();
        }
    }

    loadFallbackQuestions() {
        // Резервные вопросы по новой структуре
        this.questions = [
            // Тур 1: Фото + открытый ответ (1 минута)
            {
                round: 1,
                type: 'open',
                question: "Назовите фильм и режиссера по кадру",
                image: "../images/quiz/round1-1.jpg",
                correctAnswer: "Бегущий по лезвию 2049, Дени Вильнёв",
                time: 60
            },
            // Тур 2: Фото + открытый ответ (1 минута)
            {
                round: 2,
                type: 'open',
                question: "Какой актер изображен на фото и в каком фильме?",
                image: "../images/quiz/round2-1.jpg",
                correctAnswer: "Роберт Де Ниро, Таксист",
                time: 60
            },
            // Тур 3: Вопрос с выбором (1 минута)
            {
                round: 3,
                type: 'multiple',
                question: "Кто режиссер фильма 'Семь самураев'?",
                answers: [
                    "Ясудзиро Одзу",
                    "Акира Куросава",
                    "Кэнжи Мидзогути",
                    "Хироси Тэсигахара"
                ],
                correctAnswer: 1,
                time: 60
            },
            // Тур 4: Фото + открытый ответ (1 минута)
            {
                round: 4,
                type: 'open',
                question: "Определите фильм по этому iconic кадру",
                image: "../images/quiz/round4-1.jpg",
                correctAnswer: "Космическая одиссея 2001 года",
                time: 60
            },
            // Тур 5: Фото + открытый ответ (1 минута)  
            {
                round: 5,
                type: 'open',
                question: "Назовите режиссер и фильм",
                image: "../images/quiz/round5-1.jpg",
                correctAnswer: "Андрей Тарковский, Сталкер",
                time: 60
            },
            // Тур 6: Фото + открытый ответ (1 минута)
            {
                round: 6,
                type: 'open',
                question: "Какой фильм представлен на изображении?",
                image: "../images/quiz/round6-1.jpg",
                correctAnswer: "Расёмон",
                time: 60
            },
            // Тур 7: Блиц (30 секунд)
            {
                round: 7,
                type: 'blitz',
                question: "Блиц-раунд! Ответьте на 5 быстрых вопросов",
                blitzQuestions: [
                    {
                        question: "В каком году вышел 'Крестный отец'?",
                        correctAnswer: "1972"
                    },
                    {
                        question: "Кто сыграл главную роль в 'Заводном апельсине'?",
                        correctAnswer: "Малкольм Макдауэлл"
                    },
                    {
                        question: "Какой фильм получил Оскар за лучший фильм в 1994?",
                        correctAnswer: "Форрест Гамп"
                    },
                    {
                        question: "Режиссер 'Подводной лодки'?",
                        correctAnswer: "Вольфганг Петерсен"
                    },
                    {
                        question: "Актер, сыгравший Дарта Вейдера в оригинальной трилогии?",
                        correctAnswer: "Дэвид Проуз"
                    }
                ],
                time: 30
            }
        ];
    }

    bindEvents() {
        const startBtn = document.getElementById('start-quiz-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startQuiz();
            });
        }

        const leadersBtn = document.getElementById('view-leaders');
        if (leadersBtn) {
            leadersBtn.addEventListener('click', () => {
                this.showLeaderboard();
            });
        }

        // Плавная прокрутка только для обычного режима
        if (!this.isBroadcastMode) {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        }
    }

    startQuiz() {
        this.quizStarted = true;
        this.currentQuestionIndex = 0;
        this.currentRound = 1;
        this.score = 0;
        this.hintsUsed = 0;
        this.userAnswers = [];
        this.roundResults = [];
        this.showingAnswers = false;
        this.currentAnswerIndex = 0;

        document.getElementById('quiz-welcome').style.display = 'none';
        document.getElementById('quiz-questions').style.display = 'block';
        document.getElementById('quiz-results').style.display = 'none';

        this.showInstructions();
    }

    showInstructions() {
        const questionsContainer = document.getElementById('quiz-questions');

        questionsContainer.innerHTML = `
            <div class="instructions-container">
                <h2>🎬 Инструкция к квизу</h2>
                <div class="instructions-content">
                    <div class="instruction-item">
                        <div class="instruction-icon">📝</div>
                        <div class="instruction-text">
                            <strong>Записывайте ответы на бумаге!</strong><br>
                            Во время квиза используйте бланки для ответов или свои листочки
                        </div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">⏱️</div>
                        <div class="instruction-text">
                            <strong>Следите за временем!</strong><br>
                            На каждый вопрос отводится ограниченное время
                        </div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">📱</div>
                        <div class="instruction-text">
                            <strong>Телефоны запрещены!</strong><br>
                            Использование мобильных устройств во время квиза не допускается
                        </div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">🏆</div>
                        <div class="instruction-text">
                            <strong>Система баллов:</strong><br>
                            • Фото-вопросы: 15 баллов<br>
                            • Вопросы с выбором: 10 баллов<br>
                            • Блиц-вопросы: 5 баллов за ответ
                        </div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">🔍</div>
                        <div class="instruction-text">
                            <strong>Проверка ответов:</strong><br>
                            После каждого тура будут показаны правильные ответы для самопроверки
                        </div>
                    </div>
                </div>
                <div class="instructions-warning">
                    ⚠️ <strong>Внимание:</strong> <br>Данная игра является исключительно развлекательным продуктом. Она не несёт никакого подтекста и не призывает ни к каким действиям. <br>Всё было задумано для вашего удовольствия, поэтому рекомендуем отнестись к игровому процессу просто и с долей здорового юмора. Помните, главная цель — получить удовольствие!
                </div>
                <button class="btn btn--primary start-quiz-after-instructions">
                    Понятно, начинаем квиз!
                </button>
            </div>
        `;

        document.querySelector('.start-quiz-after-instructions').addEventListener('click', () => {
            this.showRoundIntro();
        });
    }

    showRoundIntro() {
        const questionsContainer = document.getElementById('quiz-questions');
        const currentRoundQuestions = this.questions.filter(q => q.round === this.currentRound);

        questionsContainer.innerHTML = `
            <div class="round-intro">
                <h2>Тур ${this.currentRound}</h2>
                <div class="round-info">
                    ${this.getRoundDescription(this.currentRound)}
                </div>
                <div class="round-stats">
                    <div class="stat-item">
                        <div class="stat-number">${currentRoundQuestions.length}</div>
                        <div class="stat-label">вопросов</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${this.getRoundTime(this.currentRound)}</div>
                        <div class="stat-label">секунд на вопрос</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${this.getRoundType(this.currentRound)}</div>
                        <div class="stat-label">тип вопросов</div>
                    </div>
                </div>
                <div class="round-instruction">
                    <p>📝 <strong>Готовьте бланки для ответов!</strong></p>
                    <p>Используйте кнопки навигации для перехода между вопросами</p>
                </div>
                <button class="btn btn--primary start-round-btn">Начать тур ${this.currentRound}</button>
            </div>
        `;

        document.querySelector('.start-round-btn').addEventListener('click', () => {
            this.showQuestion();
        });
    }

    getRoundDescription(round) {
        const descriptions = {
            1: "Фото-тур: Определите фильм по кадру. Черно Белые фильмы + 1 цветной",
            2: "Фото-тур: Узнайте актера и фильм",
            3: "Тур с выбором: 4 варианта ответа",
            4: "Фото-тур: Iconic кадры кино",
            5: "Фото-тур: Режиссеры и их фильмы",
            6: "Фото-тур: Классика мирового кино",
            7: "Блиц-раунд: 5 быстрых вопросов за 30 секунд!"
        };
        return descriptions[round] || `Тур ${round}`;
    }

    getRoundTime(round) {
        return round === 7 ? 30 : 60;
    }

    getRoundType(round) {
        return [1, 2, 4, 5, 6].includes(round) ? 'Фото' :
            round === 3 ? 'Выбор' : 'Блиц';
    }

    showQuestion() {
        const currentRoundQuestions = this.questions.filter(q => q.round === this.currentRound);

        if (this.currentQuestionIndex >= currentRoundQuestions.length) {
            this.showRoundAnswers();
            return;
        }

        const question = currentRoundQuestions[this.currentQuestionIndex];
        const questionsContainer = document.getElementById('quiz-questions');

        questionsContainer.innerHTML = `
            <div class="question-slide">
                <div class="question-header">
                    <div class="question-progress">
                        <span>Тур ${this.currentRound} • Вопрос ${this.currentQuestionIndex + 1} из ${currentRoundQuestions.length}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${((this.currentQuestionIndex + 1) / currentRoundQuestions.length) * 100}%"></div>
                        </div>
                    </div>
                    <div class="question-timer" id="timer">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
                        </svg>
                        <span id="time-left">${question.time}</span>
                    </div>
                </div>

                <div class="question-content">
                    ${question.image ? `
                        <div class="question-image">
                            <img src="${question.image}" alt="Изображение к вопросу" loading="lazy">
                            <div class="quiz-logo">
                                <img src="../images/quiz-logo.png" alt="Логотип Odissea Quiz">
                            </div>
                        </div>
                    ` : ''}
                    
                    <h3 class="question-text">${question.question}</h3>
                    
                    ${this.renderQuestionContent(question)}
                </div>

                <div class="quiz-navigation">
                    <div class="nav-buttons">
                        <button class="btn btn--outline nav-btn prev-btn" id="prev-btn" ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>
                            ← Назад
                        </button>
                        <button class="btn btn--primary nav-btn next-btn" id="next-btn">
                            ${this.currentQuestionIndex === currentRoundQuestions.length - 1 ? 'Завершить тур' : 'Далее →'}
                        </button>
                    </div>
                    <div class="nav-hint">
                        Используйте кнопки для ручного перехода между вопросами
                    </div>
                </div>
            </div>
        `;

        this.bindNavigationEvents(currentRoundQuestions);
        this.startTimer(question.time);
    }

    renderQuestionContent(question) {
        switch (question.type) {
            case 'multiple':
                return `
                    <div class="answers-grid">
                        ${question.answers.map((answer, index) => `
                            <div class="answer-option">
                                <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
                                <span class="answer-text">${answer}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="answer-hint">Выберите правильный вариант и запишите букву ответа (A, B, C, D)</div>
                `;
            case 'blitz':
                return `
                    <div class="blitz-container">
                        ${question.blitzQuestions.map((blitzQ, index) => `
                            <div class="blitz-question">
                                <p><strong>${index + 1}.</strong> ${blitzQ.question}</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="answer-hint">Запишите ответы на все 5 вопросов последовательно</div>
                `;
            default: // open
                return ``;
        }
    }

    bindNavigationEvents(currentRoundQuestions) {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        prevBtn.addEventListener('click', () => {
            this.goToPreviousQuestion();
        });

        nextBtn.addEventListener('click', () => {
            this.goToNextQuestion();
        });

        // Добавляем обработчики клавиатуры
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.goToPreviousQuestion();
            } else if (e.key === 'ArrowRight' || e.key === ' ') {
                this.goToNextQuestion();
            }
        });
    }

    goToPreviousQuestion() {
        if (this.currentQuestionIndex > 0) {
            clearInterval(this.timer);
            this.currentQuestionIndex--;
            this.showQuestion();
        }
    }

    goToNextQuestion() {
        const currentRoundQuestions = this.questions.filter(q => q.round === this.currentRound);
        clearInterval(this.timer);

        if (this.currentQuestionIndex < currentRoundQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.showQuestion();
        } else {
            this.showRoundAnswers();
        }
    }

    startTimer(time) {
        this.timeLeft = time;
        const timerElement = document.getElementById('time-left');
        const timeRemainingElement = document.getElementById('time-remaining');

        this.timer = setInterval(() => {
            this.timeLeft--;

            if (timerElement) timerElement.textContent = this.timeLeft;
            if (timeRemainingElement) timeRemainingElement.textContent = this.timeLeft;

            if (this.timeLeft <= 10) {
                if (timerElement) timerElement.parentElement.classList.add('timer-critical');
            }

            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.goToNextQuestion();
            }
        }, 1000);
    }

    showRoundAnswers() {
        this.showingAnswers = true;
        this.currentAnswerIndex = 0;
        this.showAnswerSlide();
    }

    showAnswerSlide() {
        const currentRoundQuestions = this.questions.filter(q => q.round === this.currentRound);

        if (this.currentAnswerIndex >= currentRoundQuestions.length) {
            this.finishRound();
            return;
        }

        const question = currentRoundQuestions[this.currentAnswerIndex];
        const questionsContainer = document.getElementById('quiz-questions');

        questionsContainer.innerHTML = `
            <div class="answer-slide">
                <div class="question-header">
                    <div class="question-progress">
                        <span>Проверка ответов • Тур ${this.currentRound} • Ответ ${this.currentAnswerIndex + 1} из ${currentRoundQuestions.length}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${((this.currentAnswerIndex + 1) / currentRoundQuestions.length) * 100}%"></div>
                        </div>
                    </div>
                    <div class="answer-badge">
                        🔍 Проверка
                    </div>
                </div>

                <div class="question-content">
                    ${question.image ? `
                        <div class="question-image">
                            <img src="${question.image}" alt="Изображение к вопросу" loading="lazy">
                            <div class="quiz-logo">
                                <img src="../images/quiz-logo.png" alt="Логотип Odissea Quiz">
                            </div>
                        </div>
                    ` : ''}
                    
                    <h3 class="question-text">${question.question}</h3>
                    
                    <div class="correct-answer-section">
                        <div class="correct-answer-header">
                            <span class="answer-icon">✅</span>
                            <h4>Правильный ответ:</h4>
                        </div>
                        <div class="correct-answer-content">
                            ${this.getCorrectAnswerDisplay(question)}
                        </div>
                    </div>

                    ${this.getAnswerExplanation(question)}
                </div>

                <div class="quiz-instruction">
                    <div class="instruction-badge">
                        📋 Сверьте с вашими ответами!
                    </div>
                    <p>Отметьте правильные и неправильные ответы на ваших бланках</p>
                </div>

                <div class="quiz-navigation">
                    <div class="nav-buttons">
                        <button class="btn btn--outline nav-btn prev-answer-btn" id="prev-answer-btn" ${this.currentAnswerIndex === 0 ? 'disabled' : ''}>
                            ← Назад
                        </button>
                        <button class="btn btn--primary nav-btn next-answer-btn" id="next-answer-btn">
                            ${this.currentAnswerIndex === currentRoundQuestions.length - 1 ? 'Завершить проверку' : 'Следующий ответ →'}
                        </button>
                    </div>
                    <div class="nav-hint">
                        Проверьте все ответы перед переходом к следующему туру
                    </div>
                </div>
            </div>
        `;

        this.bindAnswerNavigationEvents(currentRoundQuestions);
    }

    getCorrectAnswerDisplay(question) {
        switch (question.type) {
            case 'multiple':
                const letter = String.fromCharCode(65 + question.correctAnswer);
                return `
                    <div class="correct-answer-option">
                        <span class="answer-letter selected">${letter}</span>
                        <span class="answer-text">${question.answers[question.correctAnswer]}</span>
                    </div>
                `;
            case 'blitz':
                return `
                    <div class="blitz-answers">
                        ${question.blitzQuestions.map((blitzQ, index) => `
                            <div class="blitz-answer-item">
                                <strong>${index + 1}.</strong> ${blitzQ.correctAnswer}
                            </div>
                        `).join('')}
                    </div>
                `;
            default: // open
                return `
                    <div class="open-correct-answer">
                        <p>${question.correctAnswer}</p>
                    </div>
                `;
        }
    }

    getAnswerExplanation(question) {
        if (question.explanation) {
            return `
                <div class="answer-explanation">
                    <div class="explanation-header">
                        <span class="explanation-icon">💡</span>
                        <h4>Пояснение:</h4>
                    </div>
                    <p>${question.explanation}</p>
                </div>
            `;
        }
        return '';
    }

    bindAnswerNavigationEvents(currentRoundQuestions) {
        const prevBtn = document.getElementById('prev-answer-btn');
        const nextBtn = document.getElementById('next-answer-btn');

        prevBtn.addEventListener('click', () => {
            if (this.currentAnswerIndex > 0) {
                this.currentAnswerIndex--;
                this.showAnswerSlide();
            }
        });

        nextBtn.addEventListener('click', () => {
            if (this.currentAnswerIndex < currentRoundQuestions.length - 1) {
                this.currentAnswerIndex++;
                this.showAnswerSlide();
            } else {
                this.finishRound();
            }
        });

        // Обработчики клавиатуры для навигации по ответам
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                if (this.currentAnswerIndex > 0) {
                    this.currentAnswerIndex--;
                    this.showAnswerSlide();
                }
            } else if (e.key === 'ArrowRight' || e.key === ' ') {
                if (this.currentAnswerIndex < currentRoundQuestions.length - 1) {
                    this.currentAnswerIndex++;
                    this.showAnswerSlide();
                } else {
                    this.finishRound();
                }
            }
        });
    }

    finishRound() {
        this.showingAnswers = false;

        const questionsContainer = document.getElementById('quiz-questions');
        const currentRoundQuestions = this.questions.filter(q => q.round === this.currentRound);

        questionsContainer.innerHTML = `
            <div class="round-results">
                <h2>Тур ${this.currentRound} завершен! 🎯</h2>
                <div class="round-summary">
                    <p>Вы ответили на <strong>${currentRoundQuestions.length}</strong> вопросов</p>
                    <p>Проверили все правильные ответы</p>
                    <p>Теперь переходите к следующему туру</p>
                </div>

                <div class="round-stats">
                    <div class="stat-item">
                        <div class="stat-number">${currentRoundQuestions.length}</div>
                        <div class="stat-label">вопросов</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${this.getRoundType(this.currentRound)}</div>
                        <div class="stat-label">тип тура</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${this.currentRound}/7</div>
                        <div class="stat-label">прогресс</div>
                    </div>
                </div>

                <div class="round-actions">
                    ${this.currentRound < 7 ?
                `<button class="btn btn--primary next-round-btn">Перейти к туру ${this.currentRound + 1}</button>` :
                `<button class="btn btn--primary finish-quiz-btn">Завершить квиз</button>`
            }
                </div>
            </div>
        `;

        if (this.currentRound < 7) {
            document.querySelector('.next-round-btn').addEventListener('click', () => {
                this.currentRound++;
                this.currentQuestionIndex = 0;
                this.currentAnswerIndex = 0;
                this.showRoundIntro();
            });
        } else {
            document.querySelector('.finish-quiz-btn').addEventListener('click', () => {
                this.finishQuiz();
            });
        }
    }

    finishQuiz() {
        this.quizStarted = false;
        document.getElementById('quiz-questions').style.display = 'none';
        document.getElementById('quiz-results').style.display = 'block';
        this.showResults();
    }

    showResults() {
        const resultsContainer = document.getElementById('quiz-results');

        resultsContainer.innerHTML = `
            <div class="results-content">
                <h2>Квиз завершен! 🎬</h2>
                <div class="final-message">
                    <p>Спасибо за участие в квизе "Odissea"!</p>
                    <p>Вы прошли все 7 туров и проверили ответы.</p>
                    <p>Сдайте ваши бланки с ответами для окончательной проверки.</p>
                </div>

                <div class="quiz-stats">
                    <div class="stat-item">
                        <div class="stat-number">7</div>
                        <div class="stat-label">туров</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${this.questions.length}</div>
                        <div class="stat-label">вопросов</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">~15</div>
                        <div class="stat-label">минут</div>
                    </div>
                </div>

                <div class="results-message">
                    <p>Результаты будут объявлены после проверки всех бланков!</p>
                </div>

                <div class="results-actions">
                    <button class="btn btn--primary" id="restart-quiz">Начать заново</button>
                    ${!this.isBroadcastMode ? '<button class="btn btn--outline" id="view-leaderboard-final">Таблица лидеров</button>' : ''}
                </div>
            </div>
        `;

        document.getElementById('restart-quiz').addEventListener('click', () => {
            this.startQuiz();
        });

        const leaderboardBtn = document.getElementById('view-leaderboard-final');
        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', () => {
                this.showLeaderboard();
            });
        }
    }

    showLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('odyssey_leaderboard') || '[]');

        let leaderboardHTML = `
            <div class="leaderboard-modal">
                <div class="leaderboard-content">
                    <h2>🏆 Таблица лидеров</h2>
                    <div class="leaderboard-list">
        `;

        if (leaderboard.length === 0) {
            leaderboardHTML += `<div class="no-leaders"><p>Пока нет результатов. Будьте первым!</p></div>`;
        } else {
            leaderboard.forEach((entry, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                const date = new Date(entry.date).toLocaleDateString('ru-RU');

                leaderboardHTML += `
                    <div class="leaderboard-item ${index < 3 ? 'top-three' : ''}">
                        <div class="leaderboard-rank">${medal}</div>
                        <div class="leaderboard-name">${entry.name}</div>
                        <div class="leaderboard-score">${entry.score} баллов</div>
                        <div class="leaderboard-details">${date}</div>
                    </div>
                `;
            });
        }

        leaderboardHTML += `
                    </div>
                    <div class="leaderboard-actions">
                        <button class="btn btn--primary" id="close-leaderboard">Закрыть</button>
                    </div>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = leaderboardHTML;
        document.body.appendChild(modal);

        document.getElementById('close-leaderboard').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
}

// Инициализация квиза
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        window.quiz = new Quiz();
    }, 100);
});
