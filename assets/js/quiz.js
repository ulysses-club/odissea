class Quiz {
    /**
     * Инициализирует новый экземпляр квиза
     * @constructor
     */
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.timer = null;
        this.timeLeft = 0;
        this.hintsUsed = 0;
        this.maxHints = 2;
        this.userAnswers = [];
        this.quizStarted = false;

        this.init();
    }

    /**
     * Инициализирует квиз - загружает вопросы и привязывает события
     * @async
     * @returns {Promise<void>}
     */
    async init() {
        await this.loadQuestions();
        this.bindEvents();
    }

    /**
     * Загружает вопросы из JSON файла или использует резервные вопросы
     * @async
     * @returns {Promise<void>}
     */
    async loadQuestions() {
        try {
            const response = await fetch('../data/quiz-questions.json');
            const data = await response.json();
            this.questions = data.questions;

            // Перемешиваем вопросы для разнообразия
            this.shuffleQuestions();
        } catch (error) {
            console.error('Ошибка загрузки вопросов:', error);
            // Fallback - используем встроенные вопросы
            this.loadFallbackQuestions();
        }
    }

    /**
     * Перемешивает вопросы в случайном порядке
     * @returns {void}
     */
    shuffleQuestions() {
        // Перемешиваем вопросы, но сохраняем порядок сложности
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
    }

    /**
     * Загружает резервные вопросы при ошибке загрузки основных
     * @returns {void}
     */
    loadFallbackQuestions() {
        // Резервные вопросы на случай проблем с загрузкой JSON
        this.questions = [
            {
                id: 1,
                question: "Какой фильм считается первым в истории киноклуба 'Одиссея'?",
                answers: [
                    "Бегущий по лезвию 2049",
                    "Начало",
                    "Матрица",
                    "Побег из Шоушенка"
                ],
                correctAnswer: 0,
                difficulty: "easy",
                time: 30,
                image: "../images/quiz/blade-runner.jpg"
            },
            {
                id: 2,
                question: "Кто режиссер фильма 'Семь самураев'?",
                answers: [
                    "Ясудзиро Одзу",
                    "Акира Куросава",
                    "Кэнжи Мидзогути",
                    "Хироси Тэсигахара"
                ],
                correctAnswer: 1,
                difficulty: "medium",
                time: 25
            },
            {
                id: 3,
                question: "В каком году вышел фильм 'Космическая одиссея 2001 года'?",
                answers: [
                    "1965",
                    "1968",
                    "1971",
                    "1975"
                ],
                correctAnswer: 1,
                difficulty: "easy",
                time: 20
            },
            {
                id: 4,
                question: "Какой актер сыграл главную роль в фильме 'Таксист'?",
                answers: [
                    "Аль Пачино",
                    "Роберт Де Ниро",
                    "Джек Николсон",
                    "Дастин Хоффман"
                ],
                correctAnswer: 1,
                difficulty: "medium",
                time: 25
            },
            {
                id: 5,
                question: "Как называется техника съемки, использованная в фильме 'Гражданин Кейн' для показа больших помещений?",
                answers: [
                    "Стедикам",
                    "Глубинный кадр",
                    "Шейкер-камера",
                    "Долли-зум"
                ],
                correctAnswer: 1,
                difficulty: "hard",
                time: 35
            },
            {
                id: 6,
                question: "Какой фильм Андрея Тарковского был показан в киноклубе?",
                answers: [
                    "Сталкер",
                    "Андрей Рублев",
                    "Зеркало",
                    "Все перечисленные"
                ],
                correctAnswer: 3,
                difficulty: "medium",
                time: 30
            },
            {
                id: 7,
                question: "Кто снял трилогию 'Красная', 'Белая', 'Синяя'?",
                answers: [
                    "Люк Бессон",
                    "Кшиштоф Кесьлёвский",
                    "Педро Альмодовар",
                    "Жан-Люк Годар"
                ],
                correctAnswer: 1,
                difficulty: "hard",
                time: 35
            },
            {
                id: 8,
                question: "Какой фильм Вим Вендерс был в программе киноклуба?",
                answers: [
                    "Париж, Техас",
                    "Небо над Берлином",
                    "Лиссабонская история",
                    "Все ответы верны"
                ],
                correctAnswer: 3,
                difficulty: "medium",
                time: 25
            },
            {
                id: 9,
                question: "В каком фильме прозвучала фраза: 'Я люблю запах напалма по утрам'?",
                answers: [
                    "Цельнометаллическая оболочка",
                    "Апокалипсис сегодня",
                    "Взвод",
                    "Охотник на оленей"
                ],
                correctAnswer: 1,
                difficulty: "easy",
                time: 20
            },
            {
                id: 10,
                question: "Кто сыграл главную роль в фильме 'Пролетая над гнездом кукушки'?",
                answers: [
                    "Джек Николсон",
                    "Аль Пачино",
                    "Роберт Де Ниро",
                    "Марлон Брандо"
                ],
                correctAnswer: 0,
                difficulty: "easy",
                time: 20
            },
            {
                id: 11,
                question: "Какой фильм Дэвида Линча наиболее часто обсуждался в киноклубе?",
                answers: [
                    "Голова-ластик",
                    "Синий бархат",
                    "Малхолланд Драйв",
                    "Мулхолланд Драйв"
                ],
                correctAnswer: 2,
                difficulty: "hard",
                time: 40
            },
            {
                id: 12,
                question: "Как называется знаменитый план-эпизод в фильме 'Одержимость'?",
                answers: [
                    "План американский",
                    "План немецкий",
                    "План русский",
                    "План французский"
                ],
                correctAnswer: 2,
                difficulty: "hard",
                time: 35
            },
            {
                id: 13,
                question: "Кто режиссер фильма 'Восемь с половиной'?",
                answers: [
                    "Микеланджело Антониони",
                    "Федерико Феллини",
                    "Лукино Висконти",
                    "Пьер Паоло Пазолини"
                ],
                correctAnswer: 1,
                difficulty: "medium",
                time: 25
            },
            {
                id: 14,
                question: "Какой фильм был посвящен теме памяти и времени?",
                answers: [
                    "Вечное сияние чистого разума",
                    "Помни",
                    "Игра в имитацию",
                    "Все перечисленные"
                ],
                correctAnswer: 3,
                difficulty: "medium",
                time: 30
            },
            {
                id: 15,
                question: "Какой фильм завершил сезон японского кино в киноклубе?",
                answers: [
                    "Расёмон",
                    "Токийская повесть",
                    "Унесенные призраками",
                    "Сказки туманной луны после дождя"
                ],
                correctAnswer: 3,
                difficulty: "hard",
                time: 40
            }
        ];
    }

    /**
     * Привязывает обработчики событий к элементам интерфейса
     * @returns {void}
     */
    bindEvents() {
        // Кнопка начала квиза
        document.getElementById('start-quiz-btn').addEventListener('click', () => {
            this.startQuiz();
        });

        // Кнопка просмотра таблицы лидеров
        document.getElementById('view-leaders').addEventListener('click', () => {
            this.showLeaderboard();
        });

        // Плавная прокрутка к разделам
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Начинает новый квиз
     * @returns {void}
     */
    startQuiz() {
        this.quizStarted = true;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.hintsUsed = 0;
        this.userAnswers = [];

        // Скрываем приветственный экран и показываем вопросы
        document.getElementById('quiz-welcome').style.display = 'none';
        document.getElementById('quiz-questions').style.display = 'block';
        document.getElementById('quiz-results').style.display = 'none';

        this.showQuestion();
    }

    /**
     * Показывает текущий вопрос
     * @returns {void}
     */
    showQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        const questionsContainer = document.getElementById('quiz-questions');

        // Очищаем контейнер
        questionsContainer.innerHTML = '';

        // Создаем HTML для вопроса
        const questionHTML = `
            <div class="question-slide">
                <div class="question-header">
                    <div class="question-progress">
                        <span>Вопрос ${this.currentQuestionIndex + 1} из ${this.questions.length}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${((this.currentQuestionIndex + 1) / this.questions.length) * 100}%"></div>
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
                        </div>
                    ` : ''}
                    
                    <h3 class="question-text">${question.question}</h3>
                    
                    <div class="answers-grid">
                        ${question.answers.map((answer, index) => `
                            <div class="answer-option" data-index="${index}">
                                <span class="answer-text">${answer}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="quiz-controls">
                    <div class="hints-container">
                        <button class="hint-btn" id="hint-btn" ${this.hintsUsed >= this.maxHints ? 'disabled' : ''}>
                            💡 Подсказка (${this.maxHints - this.hintsUsed} осталось)
                        </button>
                    </div>
                    <button class="next-btn" id="next-btn" disabled>Следующий вопрос</button>
                </div>
            </div>
        `;

        questionsContainer.innerHTML = questionHTML;

        // Добавляем обработчики событий
        this.bindQuestionEvents();
        this.startTimer();
    }

    /**
     * Привязывает обработчики событий к элементам вопроса
     * @returns {void}
     */
    bindQuestionEvents() {
        const answerOptions = document.querySelectorAll('.answer-option');
        const nextBtn = document.getElementById('next-btn');
        const hintBtn = document.getElementById('hint-btn');

        // Обработчики для вариантов ответов
        answerOptions.forEach(option => {
            option.addEventListener('click', () => {
                if (option.classList.contains('selected')) return;

                // Снимаем выделение со всех вариантов
                answerOptions.forEach(opt => opt.classList.remove('selected'));

                // Выделяем выбранный вариант
                option.classList.add('selected');

                // Активируем кнопку "Следующий вопрос"
                nextBtn.disabled = false;

                // Сохраняем ответ пользователя
                const selectedIndex = parseInt(option.dataset.index);
                this.userAnswers[this.currentQuestionIndex] = selectedIndex;
            });
        });

        // Обработчик для кнопки "Следующий вопрос"
        nextBtn.addEventListener('click', () => {
            this.handleAnswer();
        });

        // Обработчик для подсказки
        hintBtn.addEventListener('click', () => {
            this.useHint();
        });
    }

    /**
     * Запускает таймер для текущего вопроса
     * @returns {void}
     */
    startTimer() {
        const question = this.questions[this.currentQuestionIndex];
        this.timeLeft = question.time;
        const timerElement = document.getElementById('time-left');

        this.timer = setInterval(() => {
            this.timeLeft--;
            timerElement.textContent = this.timeLeft;

            // Меняем цвет при малом количестве времени
            if (this.timeLeft <= 10) {
                timerElement.parentElement.classList.add('timer-critical');
            }

            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.handleTimeUp();
            }
        }, 1000);
    }

    /**
     * Обрабатывает ситуацию, когда время на вопрос истекло
     * @returns {void}
     */
    handleTimeUp() {
        // Автоматически переходим к следующему вопросу
        this.userAnswers[this.currentQuestionIndex] = -1; // -1 означает, что время вышло
        this.handleAnswer();
    }

    /**
     * Использует подсказку для текущего вопроса
     * @returns {void}
     */
    useHint() {
        if (this.hintsUsed >= this.maxHints) return;

        const question = this.questions[this.currentQuestionIndex];
        const answerOptions = document.querySelectorAll('.answer-option');
        const wrongAnswers = [];

        // Находим индексы неправильных ответов
        question.answers.forEach((_, index) => {
            if (index !== question.correctAnswer) {
                wrongAnswers.push(index);
            }
        });

        // Удаляем два случайных неправильных ответа
        const answersToRemove = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 2);

        answersToRemove.forEach(index => {
            answerOptions[index].style.opacity = '0.3';
            answerOptions[index].style.pointerEvents = 'none';
        });

        this.hintsUsed++;
        document.getElementById('hint-btn').disabled = this.hintsUsed >= this.maxHints;
        document.getElementById('hint-btn').textContent =
            `💡 Подсказка (${this.maxHints - this.hintsUsed} осталось)`;
    }

    /**
     * Обрабатывает ответ пользователя на текущий вопрос
     * @returns {void}
     */
    handleAnswer() {
        clearInterval(this.timer);

        const question = this.questions[this.currentQuestionIndex];
        const userAnswer = this.userAnswers[this.currentQuestionIndex];
        const answerOptions = document.querySelectorAll('.answer-option');
        const nextBtn = document.getElementById('next-btn');

        // Показываем правильный ответ
        answerOptions.forEach((option, index) => {
            if (index === question.correctAnswer) {
                option.classList.add('correct');
            } else if (index === userAnswer && userAnswer !== question.correctAnswer) {
                option.classList.add('incorrect');
            }
            option.style.pointerEvents = 'none';
        });

        // Начисляем очки
        if (userAnswer === question.correctAnswer) {
            let points = 0;
            switch (question.difficulty) {
                case 'easy': points = 10; break;
                case 'medium': points = 20; break;
                case 'hard': points = 30; break;
            }

            // Бонус за оставшееся время
            const timeBonus = Math.floor((this.timeLeft / question.time) * (points * 0.5));
            points += timeBonus;

            this.score += points;
        }

        // Меняем текст кнопки
        if (this.currentQuestionIndex === this.questions.length - 1) {
            nextBtn.textContent = 'Завершить квиз';
        }

        // Убираем disabled с кнопки
        nextBtn.disabled = false;

        // Обновляем обработчик кнопки
        nextBtn.onclick = () => {
            if (this.currentQuestionIndex < this.questions.length - 1) {
                this.currentQuestionIndex++;
                this.showQuestion();
            } else {
                this.finishQuiz();
            }
        };
    }

    /**
     * Завершает квиз и показывает результаты
     * @returns {void}
     */
    finishQuiz() {
        this.quizStarted = false;

        // Скрываем вопросы и показываем результаты
        document.getElementById('quiz-questions').style.display = 'none';
        document.getElementById('quiz-results').style.display = 'block';

        this.showResults();

        // Сохраняем результат на сервер
        this.saveToServer();
    }

    /**
     * Показывает результаты квиза
     * @returns {void}
     */
    showResults() {
        const resultsContainer = document.getElementById('quiz-results');
        const correctAnswers = this.userAnswers.filter((answer, index) =>
            answer === this.questions[index].correctAnswer
        ).length;

        const percentage = Math.round((correctAnswers / this.questions.length) * 100);

        let message = '';
        let emoji = '';

        if (percentage >= 90) {
            message = 'Потрясающе! Вы настоящий киноман! 🎬';
            emoji = '🏆';
        } else if (percentage >= 70) {
            message = 'Отличный результат! Вы хорошо разбираетесь в кино! 👍';
            emoji = '⭐';
        } else if (percentage >= 50) {
            message = 'Хороший результат! Продолжайте изучать мир кино! 📚';
            emoji = '✅';
        } else {
            message = 'Есть куда расти! Посещайте больше просмотров в киноклубе! 🎞️';
            emoji = '🌱';
        }

        resultsContainer.innerHTML = `
            <div class="results-content">
                <h2>Квиз завершен! ${emoji}</h2>
                <div class="final-score">${this.score} очков</div>
                
                <div class="score-breakdown">
                    <div class="score-item">
                        <div class="score-value">${correctAnswers}/${this.questions.length}</div>
                        <div class="score-label">Правильных ответов</div>
                    </div>
                    <div class="score-item">
                        <div class="score-value">${percentage}%</div>
                        <div class="score-label">Успешность</div>
                    </div>
                    <div class="score-item">
                        <div class="score-value">${this.hintsUsed}</div>
                        <div class="score-label">Использовано подсказок</div>
                    </div>
                </div>

                <div class="results-message">
                    ${message}
                </div>

                <div class="results-actions">
                    <button class="btn btn--primary" id="restart-quiz">Пройти еще раз</button>
                    <button class="btn btn--outline" id="view-answers">Посмотреть ответы</button>
                    <button class="btn btn--outline" id="share-results">Поделиться результатом</button>
                </div>
            </div>
        `;

        // Добавляем обработчики для кнопок результатов
        document.getElementById('restart-quiz').addEventListener('click', () => {
            this.startQuiz();
        });

        document.getElementById('view-answers').addEventListener('click', () => {
            this.showAnswersReview();
        });

        document.getElementById('share-results').addEventListener('click', () => {
            this.shareResults();
        });

        // Сохраняем результат в localStorage для таблицы лидеров
        this.saveToLeaderboard();
    }

    /**
     * Показывает детальный разбор всех ответов
     * @returns {void}
     */
    showAnswersReview() {
        const resultsContainer = document.getElementById('quiz-results');

        let reviewHTML = `
            <div class="results-content">
                <h2>Разбор ответов</h2>
                <div class="answers-review">
        `;

        this.questions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;

            reviewHTML += `
                <div class="review-item ${isCorrect ? 'correct' : 'incorrect'}">
                    <h4>Вопрос ${index + 1}: ${question.question}</h4>
                    <p><strong>Ваш ответ:</strong> ${userAnswer !== -1 ? question.answers[userAnswer] : 'Время вышло'}</p>
                    <p><strong>Правильный ответ:</strong> ${question.answers[question.correctAnswer]}</p>
                    ${!isCorrect ? `<p class="explanation">${this.getQuestionExplanation(question.id)}</p>` : ''}
                </div>
            `;
        });

        reviewHTML += `
                </div>
                <div class="results-actions">
                    <button class="btn btn--primary" id="back-to-results">Назад к результатам</button>
                </div>
            </div>
        `;

        resultsContainer.innerHTML = reviewHTML;

        document.getElementById('back-to-results').addEventListener('click', () => {
            this.showResults();
        });
    }

    /**
     * Возвращает объяснение для вопроса по его ID
     * @param {number} questionId - ID вопроса
     * @returns {string} Объяснение ответа
     */
    getQuestionExplanation(questionId) {
        const question = this.questions.find(q => q.id === questionId);
        return question?.explanation || "Этот вопрос был посвящен одному из фильмов, которые мы обсуждали в киноклубе.";
    }

    /**
     * Позволяет поделиться результатами квиза
     * @returns {void}
     */
    shareResults() {
        const correctAnswers = this.userAnswers.filter((answer, index) =>
            answer === this.questions[index].correctAnswer
        ).length;

        const shareText = `Я набрал ${this.score} очков в квизе "Odissea"! Правильных ответов: ${correctAnswers}/${this.questions.length}. Попробуй и ты!`;

        if (navigator.share) {
            navigator.share({
                title: 'Мой результат в квизе Odissea',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback для копирования в буфер обмена
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Результат скопирован в буфер обмена!');
            });
        }
    }

    /**
     * Сохраняет результат в таблицу лидеров localStorage
     * @returns {void}
     */
    saveToLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('odyssey_leaderboard') || '[]');

        // Используем сохраненное имя или запрашиваем его
        const username = localStorage.getItem('quizPlayerName') || 'Аноним';

        leaderboard.push({
            name: username,
            score: this.score,
            correctAnswers: this.userAnswers.filter((answer, index) =>
                answer === this.questions[index].correctAnswer
            ).length,
            totalQuestions: this.questions.length,
            date: new Date().toISOString(),
            hintsUsed: this.hintsUsed
        });

        // Сортируем по убыванию очков и оставляем топ-10
        leaderboard.sort((a, b) => b.score - a.score);
        const topLeaderboard = leaderboard.slice(0, 10);

        localStorage.setItem('odyssey_leaderboard', JSON.stringify(topLeaderboard));
    }

    /**
     * Показывает таблицу лидеров в модальном окне
     * @returns {void}
     */
    showLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('odyssey_leaderboard') || '[]');

        let leaderboardHTML = `
            <div class="leaderboard-modal">
                <div class="leaderboard-content">
                    <h2>🏆 Таблица лидеров</h2>
                    <div class="leaderboard-list">
        `;

        if (leaderboard.length === 0) {
            leaderboardHTML += `<p class="no-results">Пока нет результатов. Будьте первым!</p>`;
        } else {
            leaderboard.forEach((entry, index) => {
                leaderboardHTML += `
                    <div class="leaderboard-item ${index < 3 ? 'top-' + (index + 1) : ''}">
                        <div class="rank">${index + 1}</div>
                        <div class="name">${entry.name}</div>
                        <div class="score">${entry.score} очков</div>
                        <div class="details">${entry.correctAnswers}/${entry.totalQuestions}</div>
                    </div>
                `;
            });
        }

        leaderboardHTML += `
                    </div>
                    <button class="btn btn--primary" id="close-leaderboard">Закрыть</button>
                </div>
            </div>
        `;

        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.id = 'leaderboard-modal';
        modal.innerHTML = leaderboardHTML;
        document.body.appendChild(modal);

        // Стили для модального окна
        const style = document.createElement('style');
        style.textContent = `
            .leaderboard-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .leaderboard-content {
                background: var(--dark);
                padding: var(--space-xxl);
                border-radius: var(--radius-lg);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }
            .leaderboard-list {
                margin: var(--space-xl) 0;
            }
            .leaderboard-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-md);
                margin-bottom: var(--space-sm);
                background: rgba(255, 255, 255, 0.05);
                border-radius: var(--radius-md);
            }
            .leaderboard-item.top-1 { background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), transparent); }
            .leaderboard-item.top-2 { background: linear-gradient(135deg, rgba(192, 192, 192, 0.2), transparent); }
            .leaderboard-item.top-3 { background: linear-gradient(135deg, rgba(205, 127, 50, 0.2), transparent); }
            .rank { font-weight: bold; width: 30px; }
            .name { flex: 1; margin: 0 var(--space-md); }
            .score { font-weight: bold; color: var(--secondary); }
            .details { font-size: var(--text-sm); color: var(--gray); margin-left: var(--space-md); }
            .no-results { text-align: center; color: var(--gray); padding: var(--space-xl); }
        `;
        document.head.appendChild(style);

        document.getElementById('close-leaderboard').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });

        // Закрытие по клику вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                document.head.removeChild(style);
            }
        });
    }

    /**
     * Сохраняет результаты квиза на сервер
     * @async
     * @returns {Promise<void>}
     */
    async saveToServer() {
        const correctAnswers = this.userAnswers.filter((answer, index) =>
            answer === this.questions[index].correctAnswer
        ).length;

        const resultData = {
            name: localStorage.getItem('quizPlayerName') || 'Аноним',
            score: this.score,
            correctAnswers: correctAnswers,
            totalQuestions: this.questions.length,
            date: new Date().toISOString(),
            hintsUsed: this.hintsUsed,
            percentage: Math.round((correctAnswers / this.questions.length) * 100)
        };

        try {
            // Сохраняем в localStorage (существующая логика)
            this.saveToLeaderboard();

            // Отправляем на сервер через GET-запрос
            await this.sendResultToServer(resultData);
        } catch (error) {
            console.error('Ошибка сохранения результата:', error);
        }
    }

    /**
     * Отправляет результат на сервер через GET-запрос
     * @async
     * @param {Object} resultData - Данные результата для отправки
     * @returns {Promise<void>}
     */
    async sendResultToServer(resultData) {
        // Формируем параметры для GET-запросa
        const params = new URLSearchParams({
            name: encodeURIComponent(resultData.name),
            score: resultData.score,
            correctAnswers: resultData.correctAnswers,
            totalQuestions: resultData.totalQuestions,
            date: resultData.date,
            hintsUsed: resultData.hintsUsed,
            percentage: resultData.percentage,
            source: 'quiz'
        });

        const baseUrl = window.location.origin.includes('github.io')
            ? 'https://ulysses-club.github.io/odissea/'
            : window.location.origin;

        try {
            // Пробуем отправить через специальный endpoint для сохранения результатов
            const response = await fetch(`${baseUrl}api/save-result?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                console.log('Результат успешно отправлен на сервер');
            }
        } catch (error) {
            console.warn('Не удалось отправить результат на сервер:', error);

            // Fallback: пробуем отправить через другой endpoint
            try {
                await fetch(`${baseUrl}data/quiz-winners.json?${params}`, {
                    method: 'GET'
                });
            } catch (fallbackError) {
                console.warn('Fallback отправка также не удалась:', fallbackError);
            }
        }
    }

    /**
     * Запрашивает имя игрока для таблицы лидеров
     * @async
     * @returns {Promise<string>} Имя игрока
     */
    async requestPlayerName() {
        const savedName = localStorage.getItem('quizPlayerName');
        if (savedName) return savedName;

        return new Promise((resolve) => {
            const name = prompt('Введите ваше имя для таблицы лидеров:') || 'Аноним';
            localStorage.setItem('quizPlayerName', name);
            resolve(name);
        });
    }

    /**
     * Сохраняет результаты в GitHub (заглушка для будущей реализации)
     * @async
     * @param {Object} resultData - Данные результата
     * @returns {Promise<void>}
     */
    async saveToGitHub(resultData) {
        try {
            // Этот метод требует GitHub Token и более сложной настройки
            // Для простоты используем GET-параметры как основное решение
            console.log('Результат для GitHub:', resultData);

            // Можно добавить интеграцию с GitHub API здесь при необходимости
        } catch (error) {
            console.warn('GitHub сохранение недоступно:', error);
        }
    }
}

// Инициализация квиза когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    new Quiz();
});

// Добавляем CSS для review
const reviewStyles = `
    .answers-review {
        margin: var(--space-xl) 0;
    }
    .review-item {
        background: rgba(255, 255, 255, 0.05);
        padding: var(--space-lg);
        margin-bottom: var(--space-md);
        border-radius: var(--radius-md);
        border-left: 4px solid transparent;
    }
    .review-item.correct {
        border-left-color: #4CAF50;
    }
    .review-item.incorrect {
        border-left-color: var(--accent);
    }
    .review-item h4 {
        margin-bottom: var(--space-md);
        color: var(--light);
    }
    .review-item p {
        margin-bottom: var(--space-sm);
        color: var(--gray);
    }
    .explanation {
        font-style: italic;
        color: var(--primary-light) !important;
        margin-top: var(--space-md);
        padding: var(--space-md);
        background: rgba(106, 17, 203, 0.1);
        border-radius: var(--radius-sm);
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = reviewStyles;
document.head.appendChild(styleSheet);
