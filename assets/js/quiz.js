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

        // Сохраняем результат локально
        this.saveToLocalStorage();
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
        const topTen = leaderboard.slice(0, 10);

        localStorage.setItem('odyssey_leaderboard', JSON.stringify(topTen));
    }

    /**
     * Сохраняет текущий прогресс в localStorage
     * @returns {void}
     */
    saveToLocalStorage() {
        const quizState = {
            currentQuestionIndex: this.currentQuestionIndex,
            score: this.score,
            hintsUsed: this.hintsUsed,
            userAnswers: this.userAnswers,
            quizStarted: this.quizStarted,
            timestamp: Date.now()
        };

        localStorage.setItem('odyssey_quiz_progress', JSON.stringify(quizState));
    }

    /**
     * Загружает сохраненный прогресс из localStorage
     * @returns {boolean} Успешность загрузки
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('odyssey_quiz_progress');
            if (!saved) return false;

            const quizState = JSON.parse(saved);

            // Проверяем, не устарели ли данные (больше 1 часа)
            if (Date.now() - quizState.timestamp > 60 * 60 * 1000) {
                localStorage.removeItem('odyssey_quiz_progress');
                return false;
            }

            this.currentQuestionIndex = quizState.currentQuestionIndex;
            this.score = quizState.score;
            this.hintsUsed = quizState.hintsUsed;
            this.userAnswers = quizState.userAnswers;
            this.quizStarted = quizState.quizStarted;

            return true;
        } catch (error) {
            console.error('Ошибка загрузки прогресса:', error);
            return false;
        }
    }

    /**
     * Показывает таблицу лидеров
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
            leaderboardHTML += `
                <div class="no-leaders">
                    <p>Пока нет результатов. Будьте первым!</p>
                </div>
            `;
        } else {
            leaderboard.forEach((entry, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                const date = new Date(entry.date).toLocaleDateString('ru-RU');

                leaderboardHTML += `
                    <div class="leaderboard-item ${index < 3 ? 'top-three' : ''}">
                        <div class="leaderboard-rank">${medal}</div>
                        <div class="leaderboard-name">${entry.name}</div>
                        <div class="leaderboard-score">${entry.score} очков</div>
                        <div class="leaderboard-details">
                            ${entry.correctAnswers}/${entry.totalQuestions} • ${date}
                        </div>
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

        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = leaderboardHTML;

        document.body.appendChild(modal);

        // Обработчик закрытия
        document.getElementById('close-leaderboard').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Закрытие по клику вне контента
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
}

// Инициализация квиза при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Ждем загрузки всех скриптов
    setTimeout(() => {
        window.quiz = new Quiz();
    }, 100);
});
