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
                correctAnswer: "Бегущий по лезвию 2049, Дени Вильнёв",
                time: 60
            },
            {
                round: 2,
                type: 'open',
                question: "Какой актер изображен на фото и в каком фильме?",
                image: "../images/quiz/round2-1.jpg",
                correctAnswer: "Роберт Де Ниро, Таксист",
                time: 60
            },
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
            {
                round: 4,
                type: 'open',
                question: "Определите фильм по этому iconic кадру",
                image: "../images/quiz/round4-1.jpg",
                correctAnswer: "Космическая одиссея 2001 года",
                time: 60
            },
            {
                round: 5,
                type: 'open',
                question: "Назовите режиссер и фильм",
                image: "../images/quiz/round5-1.jpg",
                correctAnswer: "Андрей Тарковский, Сталкер",
                time: 60
            },
            {
                round: 6,
                type: 'open',
                question: "Какой фильм представлен на изображении?",
                image: "../images/quiz/round6-1.jpg",
                correctAnswer: "Расёмон",
                time: 60
            },
            {
                round: 7,
                type: 'blitz',
                question: "Блиц-раунд! Ответьте на 5 быстрых вопросов",
                blitzQuestions: [
                    { question: "В каком году вышел 'Крестный отец'?", correctAnswer: "1972" },
                    { question: "Кто сыграл главную роль в 'Заводном апельсине'?", correctAnswer: "Малкольм Макдауэлл" },
                    { question: "Какой фильм получил Оскар за лучший фильм в 1994?", correctAnswer: "Форрест Гамп" },
                    { question: "Режиссер 'Подводной лодки'?", correctAnswer: "Вольфганг Петерсен" },
                    { question: "Актер, сыгравший Дарта Вейдера в оригинальной трилогии?", correctAnswer: "Дэвид Проуз" }
                ],
                time: 30
            }
        ];
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
                document.getElementById('leaderboard-modal').style.display = 'none';
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
                        <div class="instruction-icon">🔍</div>
                        <div class="instruction-text"><strong>Проверка ответов:</strong><br>После каждого тура будут показаны правильные ответы для самопроверки</div>
                    </div>
                </div>
                <div class="instructions-warning">
                    ⚠️ <strong>Внимание:</strong> <br>Данная игра является исключительно развлекательным продуктом. Она не несёт никакого подтекста и не призывает ни к каким действиям. <br>Всё было задумано для вашего удовольствия, поэтому рекомендуем отнестись к игровому процессу просто и с долей здорового юмора.
                </div>
                <button class="btn btn--primary start-quiz-after-instructions">Понятно, начинаем квиз!</button>
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

    getRoundTime(round) { return round === 7 ? 30 : 60; }
    getRoundType(round) { return [1, 2, 4, 5, 6].includes(round) ? 'Фото' : (round === 3 ? 'Выбор' : 'Блиц'); }

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
                        <div class="progress-bar"><div class="progress-fill" style="width: ${((this.currentQuestionIndex + 1) / currentRoundQuestions.length) * 100}%"></div></div>
                    </div>
                    <div class="question-timer" id="timer"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/></svg><span id="time-left">${question.time}</span></div>
                </div>
                <div class="question-content">
                    ${question.image ? `<div class="question-image"><img src="${question.image}" alt="Изображение к вопросу" loading="lazy"></div>` : ''}
                    <h3 class="question-text">${question.question}</h3>
                    ${this.renderQuestionContent(question)}
                </div>
                <div class="quiz-navigation">
                    <div class="nav-buttons">
                        <button class="btn btn--outline nav-btn prev-btn" id="prev-btn" ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>← Назад</button>
                        <button class="btn btn--primary nav-btn next-btn" id="next-btn">${this.currentQuestionIndex === currentRoundQuestions.length - 1 ? 'Завершить тур' : 'Далее →'}</button>
                    </div>
                    <div class="nav-hint">Используйте кнопки для ручного перехода</div>
                </div>
            </div>
        `;

        this.bindNavigationEvents(currentRoundQuestions);
        this.startTimer(question.time);
    }

    renderQuestionContent(question) {
        switch (question.type) {
            case 'multiple':
                return `<div class="answers-grid">${question.answers.map((answer, index) => `<div class="answer-option"><span class="answer-letter">${String.fromCharCode(65 + index)}</span><span class="answer-text">${answer}</span></div>`).join('')}</div><div class="answer-hint">Запишите букву ответа (A, B, C, D)</div>`;
            case 'blitz':
                return `<div class="blitz-container">${question.blitzQuestions.map((blitzQ, index) => `<div class="blitz-question"><p><strong>${index + 1}.</strong> ${blitzQ.question}</p></div>`).join('')}</div><div class="answer-hint">Запишите ответы на все 5 вопросов</div>`;
            default:
                return `<div class="answer-hint">Запишите ответ на листе бумаги</div>`;
        }
    }

    bindNavigationEvents(currentRoundQuestions) {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        if (prevBtn) prevBtn.addEventListener('click', () => this.goToPreviousQuestion());
        if (nextBtn) nextBtn.addEventListener('click', () => this.goToNextQuestion());

        const keyHandler = (e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.goToPreviousQuestion(); }
            else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); this.goToNextQuestion(); }
        };
        document.addEventListener('keydown', keyHandler);
        this.keyHandler = keyHandler;
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
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft--;
            if (timerElement) timerElement.textContent = this.timeLeft;
            if (this.timeLeft <= 10 && timerElement) timerElement.parentElement.classList.add('timer-critical');
            if (this.timeLeft <= 0) { clearInterval(this.timer); this.goToNextQuestion(); }
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
                    <div class="question-progress"><span>Проверка • Тур ${this.currentRound} • ${this.currentAnswerIndex + 1} из ${currentRoundQuestions.length}</span><div class="progress-bar"><div class="progress-fill" style="width: ${((this.currentAnswerIndex + 1) / currentRoundQuestions.length) * 100}%"></div></div></div>
                    <div class="answer-badge">🔍 Проверка</div>
                </div>
                <div class="question-content">
                    ${question.image ? `<div class="question-image"><img src="${question.image}" alt="Изображение к вопросу" loading="lazy"></div>` : ''}
                    <h3 class="question-text">${question.question}</h3>
                    <div class="correct-answer-section">
                        <div class="correct-answer-header"><span class="answer-icon">✅</span><h4>Правильный ответ:</h4></div>
                        <div class="correct-answer-content">${this.getCorrectAnswerDisplay(question)}</div>
                    </div>
                </div>
                <div class="quiz-instruction"><div class="instruction-badge">📋 Сверьте с вашими ответами!</div></div>
                <div class="quiz-navigation">
                    <div class="nav-buttons">
                        <button class="btn btn--outline nav-btn prev-answer-btn" id="prev-answer-btn" ${this.currentAnswerIndex === 0 ? 'disabled' : ''}>← Назад</button>
                        <button class="btn btn--primary nav-btn next-answer-btn" id="next-answer-btn">${this.currentAnswerIndex === currentRoundQuestions.length - 1 ? 'Завершить проверку' : 'Следующий ответ →'}</button>
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
        if (prevBtn) prevBtn.addEventListener('click', () => { if (this.currentAnswerIndex > 0) { this.currentAnswerIndex--; this.showAnswerSlide(); } });
        if (nextBtn) nextBtn.addEventListener('click', () => { if (this.currentAnswerIndex < currentRoundQuestions.length - 1) { this.currentAnswerIndex++; this.showAnswerSlide(); } else { this.finishRound(); } });

        const keyHandler = (e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); if (this.currentAnswerIndex > 0) { this.currentAnswerIndex--; this.showAnswerSlide(); } }
            else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); if (this.currentAnswerIndex < currentRoundQuestions.length - 1) { this.currentAnswerIndex++; this.showAnswerSlide(); } else { this.finishRound(); } }
        };
        document.addEventListener('keydown', keyHandler);
        this.answerKeyHandler = keyHandler;
    }

    finishRound() {
        this.showingAnswers = false;
        if (this.keyHandler) document.removeEventListener('keydown', this.keyHandler);
        if (this.answerKeyHandler) document.removeEventListener('keydown', this.answerKeyHandler);

        const questionsContainer = document.getElementById('quiz-questions');
        const currentRoundQuestions = this.questions.filter(q => q.round === this.currentRound);

        questionsContainer.innerHTML = `
            <div class="round-results">
                <h2 class="quiz-title">Тур ${this.currentRound} завершен! 🎯</h2>
                <div class="round-summary"><p>Вы ответили на <strong>${currentRoundQuestions.length}</strong> вопросов</p><p>Проверили все правильные ответы</p></div>
                <div class="quiz-stats-grid">
                    <div class="quiz-stat-item"><div class="quiz-stat-number">${currentRoundQuestions.length}</div><div class="quiz-stat-label">вопросов</div></div>
                    <div class="quiz-stat-item"><div class="quiz-stat-number">${this.getRoundType(this.currentRound)}</div><div class="quiz-stat-label">тип</div></div>
                    <div class="quiz-stat-item"><div class="quiz-stat-number">${this.currentRound}/7</div><div class="quiz-stat-label">прогресс</div></div>
                </div>
                <div class="round-actions">${this.currentRound < 7 ? '<button class="btn btn--primary next-round-btn">Перейти к туру ' + (this.currentRound + 1) + '</button>' : '<button class="btn btn--primary finish-quiz-btn">Завершить квиз</button>'}</div>
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
            document.querySelector('.finish-quiz-btn').addEventListener('click', () => this.finishQuiz());
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
                <h2 class="quiz-title">Квиз завершен! 🎬</h2>
                <div class="final-message"><p>Спасибо за участие в квизе "Odissea"!</p><p>Вы прошли все 7 туров.</p><p>Сдайте ваши бланки с ответами для проверки.</p></div>
                <div class="quiz-stats-grid">
                    <div class="quiz-stat-item"><div class="quiz-stat-number">7</div><div class="quiz-stat-label">туров</div></div>
                    <div class="quiz-stat-item"><div class="quiz-stat-number">${this.questions.length}</div><div class="quiz-stat-label">вопросов</div></div>
                </div>
                <div class="results-actions"><button class="btn btn--primary" id="restart-quiz">Начать заново</button>${!this.isBroadcastMode ? '<button class="btn btn--outline" id="view-leaderboard-final">Таблица лидеров</button>' : ''}</div>
            </div>
        `;

        document.getElementById('restart-quiz').addEventListener('click', () => this.startQuiz());
        const leaderboardBtn = document.getElementById('view-leaderboard-final');
        if (leaderboardBtn) leaderboardBtn.addEventListener('click', () => this.showLeaderboard());
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
