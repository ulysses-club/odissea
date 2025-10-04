// crocodile-game.js

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

        this.initializeElements();
        this.loadWords();
        this.setupEventListeners();
    }

    /**
     * Инициализирует DOM-элементы игры
     * @private
     */
    initializeElements() {
        // Кнопки тематики
        this.themeButtons = document.querySelectorAll('.theme-btn');
        
        // Элементы управления игрой
        this.startBtn = document.getElementById('start-game');
        this.nextBtn = document.getElementById('next-word');
        this.resetBtn = document.getElementById('reset-game');
        
        // Элементы таймера
        this.startTimerBtn = document.getElementById('start-timer');
        this.stopTimerBtn = document.getElementById('stop-timer');
        this.timerDisplay = document.getElementById('timer');
        this.timerCircle = document.querySelector('.timer-circle');
        
        // Элементы отображения
        this.wordCategory = document.querySelector('.word-category');
        this.theWord = document.querySelector('.the-word');
        this.wordHint = document.querySelector('.word-hint');
        
        // Статистика
        this.wordsLeft = document.getElementById('words-left');
        this.wordsGuessedElement = document.getElementById('words-guessed');
        this.totalWordsElement = document.getElementById('total-words');
        this.usedWordsList = document.getElementById('used-words');
    }

    /**
     * Загружает слова для игры из JSON файла с fallback на встроенные слова
     * @async
     * @private
     */
    async loadWords() {
        try {
            console.log('Загрузка слов для игры...');
            
            // Используем встроенные слова как fallback
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

            // Пытаемся загрузить из JSON файла
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
            this.showError('Не удалось загрузить слова для игры. Пожалуйста, обновите страницу.');
        }
    }

    /**
     * Инициализирует игровое состояние после загрузки слов
     * @private
     */
    initializeGame() {
        this.updateStats();
        this.updateUsedWordsList();
        console.log('Игра инициализирована. Слова загружены:', this.words);
    }

    /**
     * Настраивает обработчики событий для элементов управления
     * @private
     */
    setupEventListeners() {
        // Обработчики для кнопок тематики
        this.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.themeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTheme = btn.dataset.theme;
                console.log('Выбрана тематика:', this.currentTheme);
                
                // Если игра уже начата, перезапускаем с новой тематикой
                if (this.isGameStarted) {
                    this.resetGame();
                    this.startGame();
                }
            });
        });

        // Кнопка начала игры
        this.startBtn.addEventListener('click', () => {
            this.startGame();
        });

        // Кнопка следующего слова
        this.nextBtn.addEventListener('click', () => {
            this.nextWord();
        });

        // Кнопка сброса игры
        this.resetBtn.addEventListener('click', () => {
            this.resetGame();
        });

        // Таймер
        this.startTimerBtn.addEventListener('click', () => {
            this.startTimer();
        });

        this.stopTimerBtn.addEventListener('click', () => {
            this.stopTimer();
        });

        // Горячие клавиши
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
        
        console.log('Игра начата! Доступно слов:', this.availableWords.length);
    }

    /**
     * Подготавливает список слов для текущей игры на основе выбранной тематики
     * @private
     */
    prepareWordList() {
        this.availableWords = [];
        
        if (this.currentTheme === 'all') {
            // Собираем слова из всех категорий
            Object.values(this.words).forEach(category => {
                this.availableWords.push(...category);
            });
        } else {
            // Берем слова только из выбранной категории
            this.availableWords = [...(this.words[this.currentTheme] || [])];
        }
        
        // Перемешиваем слова
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
        this.usedWords.push(wordData);
        this.wordsGuessed++;

        this.displayWord(wordData);
        this.updateStats();
        this.updateUsedWordsList();

        // Автоматически запускаем таймер при показе нового слова
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
        // Определяем категорию для отображения
        let category = 'Разное';
        Object.entries(this.words).forEach(([cat, words]) => {
            if (words.includes(wordData)) {
                category = this.getCategoryName(cat);
            }
        });

        this.wordCategory.textContent = category;
        this.theWord.textContent = wordData.word;
        this.wordHint.textContent = wordData.hint;

        // Анимация появления
        this.theWord.classList.remove('word-reveal');
        void this.theWord.offsetWidth; // Trigger reflow
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
                // Автоматически переходим к следующему слову при окончании времени
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
        
        console.log('Игра сброшена');
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
        
        console.log('Игра завершена. Все слова показаны.');
    }

    /**
     * Обновляет статистику игры на экране
     * @private
     */
    updateStats() {
        const wordsLeft = this.isGameStarted ? this.availableWords.length : 0;
        
        this.wordsLeft.textContent = wordsLeft;
        this.wordsGuessedElement.textContent = this.wordsGuessed;
        this.totalWordsElement.textContent = this.isGameStarted ? this.totalWords : 0;
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
            .slice(-10) // Показываем только последние 10 слов
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
     * Показывает временное сообщение об ошибке
     * @param {string} message - Текст сообщения об ошибке
     * @private
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

/**
 * Инициализирует игру Крокодил после загрузки DOM
 * @function
 */
function initCrocodileGame() {
    window.crocodileGame = new CrocodileGame();
    console.log('Крокодил игра инициализирована');
}

// Запускаем инициализацию когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCrocodileGame);
} else {
    initCrocodileGame();
}
