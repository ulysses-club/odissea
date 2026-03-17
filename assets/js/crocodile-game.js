/**
 * Основной класс игры "Крокодил" для показа и угадывания слов
 * @class
 */
class CrocodileGame {
    /**
     * Создает экземпляр игры Крокодил
     * @constructor
     */
    constructor() {
        this.words = {
            movies: [],
            games: [],
            mixed: []
        };
        this.currentTheme = 'all';
        this.usedWords = [];
        this.availableWords = [];
        this.isGameStarted = false;
        this.timer = null;
        this.timeLeft = 60;
        this.wordsGuessed = 0;
        this.totalWords = 0;

        if (!this.initializeElements()) {
            return;
        }

        this.loadWords();
        this.setupEventListeners();
        this.applyStyles();
    }

    /**
     * Применяет классы для стилизации как на главной
     * @private
     */
    applyStyles() {
        document.body.classList.add('crocodile-game-page');
        
        // Добавляем классы для градиентных текстов
        const titles = document.querySelectorAll('.section__title, .game-history h3, .tip-card h3');
        titles.forEach(title => {
            title.style.background = 'linear-gradient(to right, var(--primary), var(--secondary))';
            title.style.webkitBackgroundClip = 'text';
            title.style.backgroundClip = 'text';
            title.style.color = 'transparent';
        });
    }

    /**
     * Инициализирует DOM-элементы игры
     * @private
     */
    initializeElements() {
        this.themeButtons = document.querySelectorAll('.theme-btn');
        this.startBtn = document.getElementById('start-game');
        this.nextBtn = document.getElementById('next-word');
        this.resetBtn = document.getElementById('reset-game');
        this.startTimerBtn = document.getElementById('start-timer');
        this.stopTimerBtn = document.getElementById('stop-timer');
        this.timerDisplay = document.getElementById('timer');
        this.timerCircle = document.querySelector('.timer-circle');
        this.wordCategory = document.querySelector('.word-category');
        this.theWord = document.querySelector('.the-word');
        this.wordHint = document.querySelector('.word-hint');
        this.wordsLeft = document.getElementById('words-left');
        this.wordsGuessedElement = document.getElementById('words-guessed');
        this.totalWordsElement = document.getElementById('total-words');
        this.usedWordsList = document.getElementById('used-words');

        const requiredElements = [
            this.startBtn, this.nextBtn, this.resetBtn,
            this.startTimerBtn, this.stopTimerBtn, this.timerDisplay,
            this.wordCategory, this.theWord, this.wordHint,
            this.wordsLeft, this.wordsGuessedElement, this.totalWordsElement
        ];

        const missingElements = requiredElements.filter(el => !el);
        if (missingElements.length > 0) {
            console.error('Не найдены необходимые элементы:', missingElements);
            return false;
        }

        return true;
    }

    /**
     * Загружает слова для игры из JSON файла с fallback на встроенные слова
     * @async
     * @private
     */
    async loadWords() {
        try {
            console.log('Загрузка слов для игры...');

            const fallbackWords = {
                movies: [
                    { word: "ТИТАНИК", hint: "Корабль и фильм о любви" },
                    { word: "ГАРРИ ПОТТЕР", hint: "Юный волшебник" },
                    { word: "ЗВЁЗДНЫЕ ВОЙНЫ", hint: "Космическая сага" },
                    { word: "АВАТАР", hint: "Синие существа на Пандоре" },
                    { word: "КРЕПКИЙ ОРЕШЕК", hint: "Брюс Уиллис против террористов" },
                    { word: "ФОРРЕСТ ГАМП", hint: "Беги, Форрест, беги!" },
                    { word: "МАТРИЦА", hint: "Красная или синяя таблетка?" },
                    { word: "ПИРАТЫ КАРИБСКОГО МОРЯ", hint: "Капитан Джек Воробей" }
                ],
                games: [
                    { word: "MINECRAFT", hint: "Игра с кубиками и криперами" },
                    { word: "SUPER MARIO", hint: "Итальянский водопроводчик" },
                    { word: "THE LEGEND OF ZELDA", hint: "Линк и принцесса Зельда" },
                    { word: "GRAND THEFT AUTO", hint: "Преступный мир" },
                    { word: "CALL OF DUTY", hint: "Военный шутер" },
                    { word: "FIFA", hint: "Футбольный симулятор" },
                    { word: "WORLD OF WARCRAFT", hint: "MMORPG с орками и людьми" },
                    { word: "ANGRY BIRDS", hint: "Птицы против свиней" }
                ],
                mixed: [
                    { word: "ИНТЕРНЕТ", hint: "Всемирная паутина" },
                    { word: "СМАРТФОН", hint: "Умный телефон" },
                    { word: "КОСМОНАВТ", hint: "Покоритель космоса" },
                    { word: "СУПЕРМЕН", hint: "Человек из стали" },
                    { word: "ПИЦЦА", hint: "Итальянское блюдо" },
                    { word: "СНЕЖНЫЙ БАРС", hint: "Горный хищник" },
                    { word: "СКАЙП", hint: "Видеозвонки" },
                    { word: "БИТКОИН", hint: "Криптовалюта" }
                ]
            };

            try {
                const response = await fetch('../data/crocodile-game-mystery.json');
                if (response.ok) {
                    const data = await response.json();
                    this.words = data.words;
                    console.log('Слова успешно загружены из JSON файла');
                } else {
                    throw new Error('Файл не найден, используем встроенные слова');
                }
            } catch (error) {
                console.warn('Не удалось загрузить JSON файл, используем встроенные слова:', error.message);
                this.words = fallbackWords;
            }

            this.initializeGame();

        } catch (error) {
            console.error('Ошибка при загрузке слов:', error);
        }
    }

    /**
     * Инициализирует игровое состояние после загрузки слов
     * @private
     */
    initializeGame() {
        this.updateStats();
        this.updateUsedWordsList();
        console.log('Игра инициализирована. Слов загружено:', this.getTotalWordsCount());
    }

    /**
     * Настраивает обработчики событий для элементов управления
     * @private
     */
    setupEventListeners() {
        this.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.themeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTheme = btn.dataset.theme;
                
                if (this.isGameStarted) {
                    this.resetGame();
                }
                this.updateStats();
            });
        });

        this.startBtn.addEventListener('click', () => {
            this.startGame();
        });

        this.nextBtn.addEventListener('click', () => {
            this.nextWord();
        });

        this.resetBtn.addEventListener('click', () => {
            this.resetGame();
        });

        this.startTimerBtn.addEventListener('click', () => {
            this.startTimer();
        });

        this.stopTimerBtn.addEventListener('click', () => {
            this.stopTimer();
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isGameStarted) {
                e.preventDefault();
                this.nextWord();
            }
            if (e.code === 'Escape') {
                this.resetGame();
            }
        });
    }

    /**
     * Начинает новую игру с выбранной тематикой
     * @public
     */
    startGame() {
        if (this.isGameStarted) return;

        this.isGameStarted = true;
        this.usedWords = [];
        this.wordsGuessed = 0;

        this.prepareWordList();
        this.updateStats();
        this.updateUsedWordsList();

        this.startBtn.disabled = true;
        this.nextBtn.disabled = false;

        this.nextWord();
    }

    /**
     * Подготавливает список слов для текущей игры на основе выбранной тематики
     * @private
     */
    prepareWordList() {
        this.availableWords = [];

        if (this.currentTheme === 'all') {
            Object.values(this.words).forEach(category => {
                this.availableWords.push(...category);
            });
        } else {
            this.availableWords = [...(this.words[this.currentTheme] || [])];
        }

        this.shuffleArray(this.availableWords);
        this.totalWords = this.availableWords.length;
    }

    /**
     * Показывает следующее слово из доступных
     * @public
     */
    nextWord() {
        if (this.availableWords.length === 0) {
            this.endGame();
            return;
        }

        const wordData = this.availableWords.pop();

        if (!wordData) {
            this.nextWord();
            return;
        }

        this.usedWords.push(wordData);
        this.wordsGuessed++;

        this.displayWord(wordData);
        this.updateStats();
        this.updateUsedWordsList();

        if (!this.timer) {
            this.startTimer();
        }
    }

    /**
     * Отображает слово и подсказку на экране
     * @param {Object} wordData - Объект с данными слова {word: string, hint: string}
     * @private
     */
    displayWord(wordData) {
        let category = 'Разное';
        Object.entries(this.words).forEach(([cat, words]) => {
            if (words.some(w => w.word === wordData.word)) {
                category = this.getCategoryName(cat);
            }
        });

        this.wordCategory.textContent = category;
        this.theWord.textContent = wordData.word;
        this.wordHint.textContent = wordData.hint;

        // Добавляем градиент для слова
        this.theWord.style.background = 'linear-gradient(135deg, var(--light), #ffffff)';
        this.theWord.style.webkitBackgroundClip = 'text';
        this.theWord.style.backgroundClip = 'text';
        this.theWord.style.color = 'transparent';

        this.theWord.classList.remove('word-reveal');
        void this.theWord.offsetWidth;
        this.theWord.classList.add('word-reveal');
    }

    /**
     * Возвращает читаемое название категории
     * @param {string} category - Ключ категории
     * @returns {string} - Читаемое название категории
     * @private
     */
    getCategoryName(category) {
        const names = {
            'movies': '🎬 Кино',
            'games': '🎮 Игры',
            'mixed': '🌈 Микс'
        };
        return names[category] || '🎲 Разное';
    }

    /**
     * Запускает таймер обратного отсчета
     * @public
     */
    startTimer() {
        if (this.timer) return;

        this.timeLeft = 60;
        this.timerDisplay.textContent = this.timeLeft;
        this.timerCircle.classList.add('running');
        this.startTimerBtn.disabled = true;
        this.stopTimerBtn.disabled = false;

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.timerDisplay.textContent = this.timeLeft;

            if (this.timeLeft <= 10) {
                this.timerCircle.classList.add('warning');
            }

            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.nextWord();
            }
        }, 1000);
    }

    /**
     * Останавливает таймер
     * @public
     */
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.timerCircle.classList.remove('running', 'warning');
        this.startTimerBtn.disabled = false;
        this.stopTimerBtn.disabled = true;
    }

    /**
     * Сбрасывает игровое состояние к начальному
     * @public
     */
    resetGame() {
        this.stopTimer();
        this.isGameStarted = false;
        this.usedWords = [];
        this.wordsGuessed = 0;
        this.timeLeft = 60;

        this.timerDisplay.textContent = this.timeLeft;
        this.wordCategory.textContent = 'Тематика';
        this.theWord.textContent = 'Нажми "Играть!" чтобы начать';
        this.wordHint.textContent = 'Здесь появится подсказка';

        this.startBtn.disabled = false;
        this.nextBtn.disabled = true;
        this.startTimerBtn.disabled = false;
        this.stopTimerBtn.disabled = true;

        this.timerCircle.classList.remove('running', 'warning');
        this.updateStats();
        this.updateUsedWordsList();
    }

    /**
     * Завершает игру когда все слова показаны
     * @private
     */
    endGame() {
        this.stopTimer();
        this.isGameStarted = false;

        this.wordCategory.textContent = 'Игра завершена!';
        this.theWord.textContent = '🎉 Поздравляем!';
        this.wordHint.textContent = `Вы показали ${this.wordsGuessed} слов`;

        this.startBtn.disabled = false;
        this.nextBtn.disabled = true;
    }

    /**
     * Обновляет статистику игры на экране
     * @private
     */
    updateStats() {
        const wordsLeft = this.isGameStarted ? this.availableWords.length : this.getTotalWordsCount();
        const totalWords = this.isGameStarted ? this.totalWords : this.getTotalWordsCount();

        this.wordsLeft.textContent = wordsLeft;
        this.wordsGuessedElement.textContent = this.wordsGuessed;
        this.totalWordsElement.textContent = totalWords;

        // Добавляем градиент для значений статистики
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach(stat => {
            stat.style.background = 'linear-gradient(to right, var(--primary), var(--secondary))';
            stat.style.webkitBackgroundClip = 'text';
            stat.style.backgroundClip = 'text';
            stat.style.color = 'transparent';
        });
    }

    /**
     * Обновляет список использованных слов
     * @private
     */
    updateUsedWordsList() {
        if (!this.usedWordsList) return;

        if (this.usedWords.length === 0) {
            this.usedWordsList.innerHTML = '<div class="empty-history">Слова появятся здесь после показа</div>';
            return;
        }

        this.usedWordsList.innerHTML = this.usedWords
            .slice(-10)
            .map(wordData =>
                `<div class="used-word" title="${wordData.hint}">${wordData.word}</div>`
            )
            .join('');
    }

    /**
     * Перемешивает массив в случайном порядке (алгоритм Фишера-Йетса)
     * @param {Array} array - Массив для перемешивания
     * @returns {Array} - Перемешанный массив
     * @private
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Возвращает общее количество слов для текущей тематики
     * @returns {number} - Количество слов
     * @private
     */
    getTotalWordsCount() {
        if (this.currentTheme === 'all') {
            return Object.values(this.words).reduce((sum, category) => sum + category.length, 0);
        }
        return this.words[this.currentTheme]?.length || 0;
    }
}

/**
 * Инициализирует игру Крокодил после загрузки DOM
 * @function
 */
function initCrocodileGame() {
    if (document.querySelector('.theme-btn')) {
        window.crocodileGame = new CrocodileGame();
        console.log('Крокодил игра инициализирована');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCrocodileGame);
} else {
    initCrocodileGame();
}
