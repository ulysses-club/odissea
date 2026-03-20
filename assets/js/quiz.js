class Quiz {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.currentRound = 1;
        this.timer = null;
        this.timeLeft = 0;
        this.quizStarted = false;
        this.showingAnswers = false;
        this.currentAnswerIndex = 0;
        this.isRetryMode = false;
        this.retryQuestions = [];
        this.retryIndex = 0;
        this.keyHandler = null;
        this.answerKeyHandler = null;

        // Определяем режим
        this.isBroadcastMode = document.body.classList.contains('quiz-broadcast');

        this.init();
    }

    async init() {
        await this.loadQuestions();
        this.bindEvents();

        if (this.isBroadcastMode) {
            this.applyBroadcastStyles();
        }
    }

    applyBroadcastStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .quiz-broadcast .question-text {
                font-size: clamp(1.5rem, 4vw, 2.5rem) !important;
            }
            .quiz-broadcast .answer-text {
                font-size: clamp(1rem, 2.5vw, 1.25rem) !important;
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
            this.retryTimeLimit = this.quizConfig?.retryTime || 15;
        } catch (error) {
            console.error('Ошибка загрузки вопросов:', error);
            this.loadFallbackQuestions();
        }
    }

    loadFallbackQuestions() {
        this.questions = [
            {
                round: 1,
                type: 'open',
                question: "Назовите фильм и режиссера по кадру",
                image: "../images/quiz/round1-1.jpg",
                video: null,
                audio: null,
                correctAnswer: "Бегущий по лезвию 2049, Дени Вильнёв",
                time: 60
            }
        ];
        this.retryTimeLimit = 15;
    }

    bindEvents() {
        const startBtn = document.getElementById('start-quiz-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => { this.startQuiz(); });
        }

        const leadersBtn = document.getElementById('view-leaders');
        if (leadersBtn) {
            leadersBtn.addEventListener('click', () => { this.showLeaderboard(); });
        }

        const closeLeaderboard = document.getElementById('close-leaderboard');
        if (closeLeaderboard) {
            closeLeaderboard.addEventListener('click', () => {
                const modal = document.getElementById('leaderboard-modal');
                if (modal) modal.style.display = 'none';
            });
        }

        const modal = document.getElementById('leaderboard-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

    startQuiz() {
        this.quizStarted = true;
        this.currentQuestionIndex = 0;
        this.currentRound = 1;
        this.showingAnswers = false;
        this.currentAnswerIndex = 0;
        this.isRetryMode = false;

        const welcomeEl = document.getElementById('quiz-welcome');
        const questionsEl = document.getElementById('quiz-questions');
        const resultsEl = document.getElementById('quiz-results');
        
        if (welcomeEl) welcomeEl.style.display = 'none';
        if (questionsEl) questionsEl.style.display = 'block';
        if (resultsEl) resultsEl.style.display = 'none';

        this.showInstructions();
    }

    stopAllMedia() {
        document.querySelectorAll('video, audio').forEach(media => {
            media.pause();
            media.currentTime = 0;
        });
    }

    renderMedia(question) {
        if (question.image) {
            return `<div class="media-container"><img src="${question.image}" alt="Изображение к вопросу" loading="lazy"></div>`;
        } else if (question.video) {
            return `<div class="media-container"><video controls autoplay muted><source src="${question.video}" type="video/mp4">Ваш браузер не поддерживает видео</video></div>`;
        } else if (question.audio) {
            return `<div class="media-container"><audio controls autoplay><source src="${question.audio}" type="audio/mpeg">Ваш браузер не поддерживает аудио</audio></div>`;
        }
        return '';
    }

    showInstructions() {
        const questionsContainer = document.getElementById('quiz-questions');
        if (!questionsContainer) return;

        questionsContainer.innerHTML = `
            <div class="instructions-container">
                <h2 class="quiz-title">🎬 Инструкция к квизу</h2>
                <div class="instructions-content">
                    <div class="instruction-item">
                        <div class="instruction-icon">📝</div>
                        <div class="instruction-text"><strong>Записывайте ответы на бумаге!</strong><br>Во время квиза используйте бланки для ответов или свои листочки</div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">⏱️</div>
                        <div class="instruction-text"><strong>Следите за временем!</strong><br>На каждый вопрос отводится ограниченное время</div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">📱</div>
                        <div class="instruction-text"><strong>Телефоны запрещены!</strong><br>Использование мобильных устройств во время квиза не допускается</div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">🏆</div>
                        <div class="instruction-text"><strong>Система баллов:</strong><br>• Фото-вопросы: 15 баллов<br>• Вопросы с выбором: 10 баллов<br>• Блиц-вопросы: 5 баллов за ответ</div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">🔄</div>
                        <div class="instruction-text"><strong>Повтор вопросов:</strong><br>После каждого тура будет показан повтор всех вопросов тура за ${this.retryTimeLimit} секунд</div>
                    </div>
                    <div class="instruction-item">
                        <div class="instruction-icon">🔍</div>
                        <div class="instruction-text"><strong>Проверка ответов:</strong><br>После повторного просмотра будут показаны правильные ответы для самопроверки</div>
                    </div>
                </div>
                <div class="instructions-warning">
                    ⚠️ <strong>Внимание:</strong> <br>Данная игра является исключительно развлекательным продуктом. Она не несёт никакого подтекста и не призывает ни к каким действиям. <br>Всё было задумано для вашего удовольствия, поэтому рекомендуем отнестись к игровому процессу просто и с долей здорового юмора.
                </div>
                <button class="btn btn--primary start-quiz-after-instructions">Понятно, начинаем квиз!</button>
            </div>
        `;

        const startBtn = document.querySelector('.start-quiz-after-instructions');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.showRoundIntro();
            });
        }
    }

    showRoundIntro() {
        const questionsContainer = document.getElementById('quiz-questions');
        if (!questionsContainer) return;
        
        const currentRoundQuestions = this.questions.filter(q => q.round === this.currentRound);

        questionsContainer.innerHTML = `
            <div class="round-intro">
                <h2 class="quiz-title">Тур ${this.currentRound}</h2>
                <div class="round-info">${this.getRoundDescription(this.currentRound)}</div>
                <div class="quiz-stats-grid">
                    <div class="quiz-stat-item"><div class="quiz-stat-number">${currentRoundQuestions.length}</div><div class="quiz-stat-label">вопросов</div></div>
                    <div class="quiz-stat-item"><div class="quiz-stat-number">${this.getRoundTime(this.currentRound)}</div><div class="quiz-stat-label">секунд</div></div>
                    <div class="quiz-stat-item"><div class="quiz-stat-number">${this.getRoundType(this.currentRound)}</div><div class="quiz-stat-label">тип</div></div>
                </div>
                <div class="round-instruction"><p>📝 <strong>Готовьте бланки для ответов!</strong></p><p>Используйте кнопки навигации для перехода между вопросами</p></div>
                <button class="btn btn--primary start-round-btn">Начать тур ${this.currentRound}</button>
            </div>
        `;

        const startBtn = document.querySelector('.start-round-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.isRetryMode = false;
                this.currentQuestionIndex = 0;
                this.showQuestion();
            });
        }
    }

    getRoundDescription(round) {
        const descriptions = {
            1: "Фото-тур: Определите фильм по кадру. Черно Белые фильмы + 1 цветной",
            2: "Фото-тур: Узнайте актера и фильм",
            3: "Тур с выбором: 4 варианта ответа",
            4: "Фото-тур: Iconic кадры кино",
            5: "Фото-тур: Режиссеры и их фильмы",
            6: "Фото-тур: Классика мирового кино",
            7: "Блиц-раунд: 7 быстрых вопросов за 30 секунд!"
        };
        return descriptions[round] || `Тур ${round}`;
    }

    getRoundTime(round) { return round === 7 ? 30 : 60; }
    getRoundType(round) { return [1, 2, 4, 5, 6].includes(round) ? 'Фото' : (round === 3 ? 'Выбор' : 'Блиц'); }

    getCurrentQuestions() {
        if (this.isRetryMode) {
            return this.retryQuestions;
        }
        return this.questions.filter(q => q.round === this.currentRound);
    }

    showQuestion() {
        this.stopAllMedia();
        
        // Удаляем старые обработчики клавиш
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }

        const questions = this.getCurrentQuestions();

        if (this.currentQuestionIndex >= questions.length) {
            if (this.isRetryMode) {
                this.showRoundAnswers();
            } else {
                this.startRetryRound();
            }
            return;
        }

        const question = questions[this.currentQuestionIndex];
        const questionsContainer = document.getElementById('quiz-questions');
        if (!questionsContainer) return;

        const mediaHtml = this.renderMedia(question);
        const retryBadge = this.isRetryMode ? '<div class="retry-badge">🔄 ПОВТОРНЫЙ ПРОСМОТР</div>' : '';

        questionsContainer.innerHTML = `
            <div class="${this.isRetryMode ? 'retry-slide' : 'question-slide'}">
                <div class="quiz-top-section">
                    <div class="question-header">
                        <div class="question-progress">
                            <span>${this.isRetryMode ? 'Повтор • ' : ''}Тур ${this.currentRound} • Вопрос ${this.currentQuestionIndex + 1} из ${questions.length}</span>
                            <div class="progress-bar"><div class="progress-fill" style="width: ${((this.currentQuestionIndex + 1) / questions.length) * 100}%"></div></div>
                        </div>
                        <div class="question-timer" id="timer"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/></svg><span id="time-left">${this.isRetryMode ? this.retryTimeLimit : question.time}</span></div>
                    </div>
                </div>
                ${retryBadge}
                <div class="quiz-middle-section">
                    <div class="question-content">
                        ${mediaHtml}
                        <h3 class="question-text">${question.question}</h3>
                        ${this.renderQuestionContent(question)}
                    </div>
                </div>
                <div class="quiz-bottom-section">
                    <div class="quiz-navigation">
                        <div class="nav-buttons">
                            <button class="btn btn--outline nav-btn prev-btn" id="prev-btn" ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>← Назад</button>
                            <button class="btn btn--primary nav-btn next-btn" id="next-btn">${this.currentQuestionIndex === questions.length - 1 ? (this.isRetryMode ? 'Завершить повтор' : 'Завершить тур') : 'Далее →'}</button>
                        </div>
                        <div class="nav-hint">${this.isRetryMode ? 'Время на повторный просмотр' : 'Используйте кнопки для ручного перехода'}</div>
                    </div>
                </div>
            </div>
        `;

        this.bindNavigationEvents(questions);
        this.startTimer(this.isRetryMode ? this.retryTimeLimit : question.time);
    }

    renderQuestionContent(question) {
        switch (question.type) {
            case 'multiple':
                return `<div class="quiz-answers-section"><div class="answers-grid">${question.answers.map((answer, index) => `<div class="answer-option"><span class="answer-letter">${String.fromCharCode(65 + index)}</span><span class="answer-text">${answer}</span></div>`).join('')}</div><div class="answer-hint">Запишите букву ответа (A, B, C, D)</div></div>`;
            case 'blitz':
                return `<div class="quiz-answers-section"><div class="blitz-container">${question.blitzQuestions.map((blitzQ, index) => `<div class="blitz-question"><p><strong>${index + 1}.</strong> ${blitzQ.question}</p></div>`).join('')}</div><div class="answer-hint">Запишите ответы на все вопросы</div></div>`;
            default:
                return `<div class="quiz-answers-section"><div class="open-answer-instruction"><div class="writing-icon">✍️</div><p>Запишите ответ на листе бумаги</p></div></div>`;
        }
    }

    bindNavigationEvents(questions) {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.goToPreviousQuestion(questions));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.goToNextQuestion(questions));
        }

        this.keyHandler = (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.goToPreviousQuestion(questions);
            } else if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                this.goToNextQuestion(questions);
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    }

    goToPreviousQuestion(questions) {
        if (this.currentQuestionIndex > 0) {
            this.clearTimer();
            this.currentQuestionIndex--;
            this.showQuestion();
        }
    }

    goToNextQuestion(questions) {
        this.clearTimer();
        if (this.currentQuestionIndex < questions.length - 1) {
            this.currentQuestionIndex++;
            this.showQuestion();
        } else {
            if (this.isRetryMode) {
                this.showRoundAnswers();
            } else {
                this.startRetryRound();
            }
        }
    }

    startRetryRound() {
        this.isRetryMode = true;
        this.currentQuestionIndex = 0;
        this.retryQuestions = [...this.questions.filter(q => q.round === this.currentRound)];
        this.showQuestion();
    }

    clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    startTimer(time) {
        this.clearTimer();
        this.timeLeft = time;
        const timerElement = document.getElementById('time-left');
        const timerParent = timerElement?.parentElement;
        
        if (timerParent) timerParent.classList.remove('timer-critical');
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            if (timerElement) timerElement.textContent = this.timeLeft;
            if (this.timeLeft <= 10 && timerParent) timerParent.classList.add('timer-critical');
            if (this.timeLeft <= 0) {
                this.clearTimer();
                const questions = this.getCurrentQuestions();
                if (this.currentQuestionIndex < questions.length - 1) {
                    this.currentQuestionIndex++;
                    this.showQuestion();
                } else {
                    if (this.isRetryMode) {
                        this.showRoundAnswers();
                    } else {
                        this.startRetryRound();
                    }
                }
            }
        }, 1000);
    }

    showRoundAnswers() {
        this.isRetryMode = false;
        this.showingAnswers = true;
        this.currentAnswerIndex = 0;
        
        // Удаляем старые обработчики клавиш
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
        
        this.showAnswerSlide();
    }

    showAnswerSlide() {
        this.stopAllMedia();
        
        const currentRoundQuestions = this.questions.filter(q => q.round === this.currentRound);
        if (this.currentAnswerIndex >= currentRoundQuestions.length) {
            this.finishRound();
            return;
        }

        const question = currentRoundQuestions[this.currentAnswerIndex];
        const questionsContainer = document.getElementById('quiz-questions');
        if (!questionsContainer) return;
        
        const mediaHtml = this.renderMedia(question);

        questionsContainer.innerHTML = `
            <div class="answer-slide">
                <div class="quiz-top-section">
                    <div class="question-header">
                        <div class="question-progress"><span>Проверка • Тур ${this.currentRound} • ${this.currentAnswerIndex + 1} из ${currentRoundQuestions.length}</span><div class="progress-bar"><div class="progress-fill" style="width: ${((this.currentAnswerIndex + 1) / currentRoundQuestions.length) * 100}%"></div></div></div>
                        <div class="answer-badge">🔍 Проверка</div>
                    </div>
                </div>
                <div class="quiz-middle-section">
                    <div class="question-content">
                        ${mediaHtml}
                        <h3 class="question-text">${question.question}</h3>
                        <div class="correct-answer-section">
                            <div class="correct-answer-header"><span class="answer-icon">✅</span><h4>Правильный ответ:</h4></div>
                            <div class="correct-answer-content">${this.getCorrectAnswerDisplay(question)}</div>
                        </div>
                    </div>
                </div>
                <div class="quiz-bottom-section">
                    <div class="quiz-instruction"><div class="instruction-badge">📋 Сверьте с вашими ответами!</div></div>
                    <div class="quiz-navigation">
                        <div class="nav-buttons">
                            <button class="btn btn--outline nav-btn prev-answer-btn" id="prev-answer-btn" ${this.currentAnswerIndex === 0 ? 'disabled' : ''}>← Назад</button>
                            <button class="btn btn--primary nav-btn next-answer-btn" id="next-answer-btn">${this.currentAnswerIndex === currentRoundQuestions.length - 1 ? 'Завершить проверку' : 'Следующий ответ →'}</button>
                        </div>
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
                return `<div class="correct-answer-option"><span class="answer-letter selected">${letter}</span><span class="answer-text">${question.answers[question.correctAnswer]}</span></div>`;
            case 'blitz':
                return `<div class="blitz-answers">${question.blitzQuestions.map((blitzQ, index) => `<div class="blitz-answer-item"><strong>${index + 1}.</strong> ${blitzQ.correctAnswer}</div>`).join('')}</div>`;
            default:
                return `<div class="open-correct-answer">${question.correctAnswer}</div>`;
        }
    }

    bindAnswerNavigationEvents(currentRoundQuestions) {
        const prevBtn = document.getElementById('prev-answer-btn');
        const nextBtn = document.getElementById('next-answer-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentAnswerIndex > 0) {
                    this.currentAnswerIndex--;
                    this.showAnswerSlide();
                }
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentAnswerIndex < currentRoundQuestions.length - 1) {
                    this.currentAnswerIndex++;
                    this.showAnswerSlide();
                } else {
                    this.finishRound();
                }
            });
        }

        this.answerKeyHandler = (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (this.currentAnswerIndex > 0) {
                    this.currentAnswerIndex--;
                    this.showAnswerSlide();
                }
            } else if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                if (this.currentAnswerIndex < currentRoundQuestions.length - 1) {
                    this.currentAnswerIndex++;
                    this.showAnswerSlide();
                } else {
                    this.finishRound();
                }
            }
        };
        document.addEventListener('keydown', this.answerKeyHandler);
    }

    finishRound() {
        this.showingAnswers = false;
        
        // Удаляем обработчики клавиш
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
        if (this.answerKeyHandler) {
            document.removeEventListener('keydown', this.answerKeyHandler);
            this.answerKeyHandler = null;
        }

        const questionsContainer = document.getElementById('quiz-questions');
        if (!questionsContainer) return;
        
        const currentRoundQuestions = this.questions.filter(q => q.round === this.currentRound);

        questionsContainer.innerHTML = `
            <div class="round-results">
                <h2 class="quiz-title">Тур ${this.currentRound} завершен! 🎯</h2>
                <div class="round-summary"><p>Вы просмотрели <strong>${currentRoundQuestions.length}</strong> вопросов</p><p>Проверили все правильные ответы</p></div>
                <div class="quiz-stats-grid">
                    <div class="quiz-stat-item"><div class="quiz-stat-number">${currentRoundQuestions.length}</div><div class="quiz-stat-label">вопросов</div></div>
                    <div class="quiz-stat-item"><div class="quiz-stat-number">${this.getRoundType(this.currentRound)}</div><div class="quiz-stat-label">тип</div></div>
                    <div class="quiz-stat-item"><div class="quiz-stat-number">${this.currentRound}/7</div><div class="quiz-stat-label">прогресс</div></div>
                </div>
                <div class="round-actions">${this.currentRound < 7 ? '<button class="btn btn--primary next-round-btn">Перейти к туру ' + (this.currentRound + 1) + '</button>' : '<button class="btn btn--primary finish-quiz-btn">Завершить квиз</button>'}</div>
            </div>
        `;

        if (this.currentRound < 7) {
            const nextBtn = document.querySelector('.next-round-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    this.currentRound++;
                    this.currentQuestionIndex = 0;
                    this.currentAnswerIndex = 0;
                    this.showRoundIntro();
                });
            }
        } else {
            const finishBtn = document.querySelector('.finish-quiz-btn');
            if (finishBtn) {
                finishBtn.addEventListener('click', () => this.finishQuiz());
            }
        }
    }

    finishQuiz() {
        this.quizStarted = false;
        const questionsEl = document.getElementById('quiz-questions');
        const resultsEl = document.getElementById('quiz-results');
        
        if (questionsEl) questionsEl.style.display = 'none';
        if (resultsEl) resultsEl.style.display = 'block';
        
        this.showResults();
    }

    showResults() {
        const resultsContainer = document.getElementById('quiz-results');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = `
            <div class="results-content">
                <h2 class="quiz-title">Квиз завершен! 🎬</h2>
                <div class="final-message"><p>Спасибо за участие в квизе "Odissea"!</p><p>Вы прошли все 7 туров.</p><p>Сдайте ваши бланки с ответами для проверки.</p></div>
                <div class="quiz-stats-grid">
                    <div class="quiz-stat-item"><div class="quiz-stat-number">7</div><div class="quiz-stat-label">туров</div></div>
                    <div class="quiz-stat-item"><div class="quiz-stat-number">${this.questions.length}</div><div class="quiz-stat-label">вопросов</div></div>
                </div>
                <div class="results-actions"><button class="btn btn--primary" id="restart-quiz">Начать заново</button>${!this.isBroadcastMode ? '<button class="btn btn--outline" id="view-leaderboard-final">Таблица лидеров</button>' : ''}</div>
            </div>
        `;

        const restartBtn = document.getElementById('restart-quiz');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.startQuiz());
        }
        
        const leaderboardBtn = document.getElementById('view-leaderboard-final');
        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', () => this.showLeaderboard());
        }
    }

    showLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('odyssey_leaderboard') || '[]');
        const modal = document.getElementById('leaderboard-modal');
        const list = document.getElementById('leaderboard-list');
        if (!modal || !list) return;

        let leaderboardHTML = '';
        if (leaderboard.length === 0) {
            leaderboardHTML = `<div class="no-leaders">Пока нет результатов. Будьте первым!</div>`;
        } else {
            leaderboard.forEach((entry, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                const date = new Date(entry.date).toLocaleDateString('ru-RU');
                leaderboardHTML += `<div class="leaderboard-item ${index < 3 ? 'top-three' : ''}"><div class="leaderboard-rank">${medal}</div><div class="leaderboard-name">${entry.name}</div><div class="leaderboard-score">${entry.score} баллов</div><div class="leaderboard-details">${date}</div></div>`;
            });
        }
        list.innerHTML = leaderboardHTML;
        modal.style.display = 'flex';
    }
}

// Инициализация квиза
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => { window.quiz = new Quiz(); }, 100);
});
