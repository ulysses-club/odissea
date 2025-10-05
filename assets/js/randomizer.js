/**
 * Модуль рандомайзера для киноклуба Одиссея
 */
class Randomizer {
    constructor() {
        this.currentMode = 'numbers';
        this.numberHistory = this.loadFromStorage('numberHistory') || [];
        this.nameHistory = this.loadFromStorage('nameHistory') || [];
        this.confettiCount = 50;
        
        this.init();
    }

    /**
     * Инициализация рандомайзера
     */
    init() {
        this.bindEvents();
        this.updateHistoryDisplays();
        this.updateNamesList();
    }

    /**
     * Привязка обработчиков событий
     */
    bindEvents() {
        // Переключение режимов
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });

        // Генерация чисел
        document.getElementById('generate-number').addEventListener('click', () => this.generateNumber());
        document.getElementById('generate-multiple').addEventListener('click', () => this.generateMultipleNumbers());

        // Генерация имен
        document.getElementById('generate-name').addEventListener('click', () => this.generateName());
        document.getElementById('shuffle-names').addEventListener('click', () => this.shuffleNames());

        // Очистка истории
        document.getElementById('clear-number-history').addEventListener('click', () => this.clearHistory('numbers'));
        document.getElementById('clear-name-history').addEventListener('click', () => this.clearHistory('names'));

        // Валидация ввода
        document.getElementById('min-number').addEventListener('change', (e) => this.validateNumberRange(e.target));
        document.getElementById('max-number').addEventListener('change', (e) => this.validateNumberRange(e.target));
        document.getElementById('names-input').addEventListener('input', () => this.updateNamesList());

        // Автоматическая генерация при изменении количества победителей
        document.getElementById('winners-count').addEventListener('change', () => {
            if (this.getNamesList().length > 0) {
                this.generateName();
            }
        });
    }

    /**
     * Переключение между режимами
     */
    switchMode(mode) {
        this.currentMode = mode;
        
        // Обновление активных кнопок
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Переключение видимости секций
        document.querySelectorAll('.randomizer-mode').forEach(section => {
            section.classList.toggle('active', section.id === `${mode}-mode`);
        });

        // Анимация переключения
        this.animateModeSwitch();
    }

    /**
     * Анимация переключения режимов
     */
    animateModeSwitch() {
        const activeSection = document.querySelector('.randomizer-mode.active');
        activeSection.style.opacity = '0';
        activeSection.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            activeSection.style.opacity = '1';
            activeSection.style.transform = 'translateY(0)';
            activeSection.style.transition = 'all 0.5s ease';
        }, 50);
    }

    /**
     * Генерация случайного числа
     */
    generateNumber() {
        const min = parseInt(document.getElementById('min-number').value) || 0;
        const max = parseInt(document.getElementById('max-number').value) || 100;
        
        if (min >= max) {
            this.showError('Минимальное число должно быть меньше максимального');
            return;
        }

        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        this.displayNumberResult(randomNumber);
        this.addToHistory('numbers', randomNumber);
        this.animateResult('number-result');
    }

    /**
     * Генерация нескольких чисел
     */
    generateMultipleNumbers() {
        const min = parseInt(document.getElementById('min-number').value) || 0;
        const max = parseInt(document.getElementById('max-number').value) || 100;
        const count = 5; // Фиксированное количество чисел
        
        if (min >= max) {
            this.showError('Минимальное число должно быть меньше максимального');
            return;
        }

        const numbers = [];
        for (let i = 0; i < count; i++) {
            numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }

        this.displayMultipleNumbers(numbers);
        numbers.forEach(number => this.addToHistory('numbers', number));
    }

    /**
     * Отображение результата числа
     */
    displayNumberResult(number) {
        const resultElement = document.getElementById('number-result');
        resultElement.textContent = number;
        resultElement.classList.add('pulse');
        
        setTimeout(() => {
            resultElement.classList.remove('pulse');
        }, 500);
    }

    /**
     * Отображение нескольких чисел
     */
    displayMultipleNumbers(numbers) {
        const resultsList = document.getElementById('results-list');
        resultsList.innerHTML = numbers.map(number => 
            `<span class="result-item">${number}</span>`
        ).join('');
        
        document.getElementById('multiple-results').style.display = 'block';
    }

    /**
     * Генерация случайного имени
     */
    generateName() {
        const names = this.getNamesList();
        if (names.length === 0) {
            this.showError('Введите хотя бы одно имя');
            return;
        }

        const winnersCount = parseInt(document.getElementById('winners-count').value) || 1;
        const uniqueWinners = document.getElementById('unique-winners').checked;
        
        if (uniqueWinners && winnersCount > names.length) {
            this.showError('Количество победителей не может превышать количество имен');
            return;
        }

        const winners = this.selectWinners(names, winnersCount, uniqueWinners);
        this.displayNameResult(winners);
        this.addToHistory('names', winners.join(', '));
        this.highlightWinners(winners);
        this.createConfetti();
    }

    /**
     * Выбор победителей
     */
    selectWinners(names, count, unique) {
        const availableNames = [...names];
        const winners = [];
        
        for (let i = 0; i < count; i++) {
            if (availableNames.length === 0) break;
            
            const randomIndex = Math.floor(Math.random() * availableNames.length);
            winners.push(availableNames[randomIndex]);
            
            if (unique) {
                availableNames.splice(randomIndex, 1);
            }
        }
        
        return winners;
    }

    /**
     * Отображение результата имен
     */
    displayNameResult(winners) {
        const resultElement = document.getElementById('name-result');
        resultElement.innerHTML = winners.map(winner => 
            `<div class="winner-name">${winner.trim()}</div>`
        ).join('');
        
        resultElement.classList.add('pulse');
        
        setTimeout(() => {
            resultElement.classList.remove('pulse');
        }, 500);
    }

    /**
     * Подсветка победителей в списке
     */
    highlightWinners(winners) {
        const nameItems = document.querySelectorAll('.name-item');
        nameItems.forEach(item => {
            item.classList.remove('winner');
            if (winners.includes(item.textContent.trim())) {
                item.classList.add('winner');
            }
        });
    }

    /**
     * Перемешивание списка имен
     */
    shuffleNames() {
        const names = this.getNamesList();
        if (names.length === 0) {
            this.showError('Введите хотя бы одно имя');
            return;
        }

        // Алгоритм Фишера-Йетса для перемешивания
        for (let i = names.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [names[i], names[j]] = [names[j], names[i]];
        }

        // Обновление текстового поля
        document.getElementById('names-input').value = names.join(', ');
        this.updateNamesList();
        
        // Анимация перемешивания
        this.animateShuffle();
    }

    /**
     * Анимация перемешивания
     */
    animateShuffle() {
        const namesList = document.getElementById('names-list');
        namesList.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            namesList.style.transform = 'scale(1)';
            namesList.style.transition = 'transform 0.3s ease';
        }, 300);
    }

    /**
     * Получение списка имен из текстового поля
     */
    getNamesList() {
        const input = document.getElementById('names-input').value;
        return input.split(',')
            .map(name => name.trim())
            .filter(name => name.length > 0);
    }

    /**
     * Обновление отображения списка имен
     */
    updateNamesList() {
        const names = this.getNamesList();
        const namesList = document.getElementById('names-list');
        
        if (names.length === 0) {
            namesList.innerHTML = '<div class="empty-names">Список имен пуст</div>';
            return;
        }

        namesList.innerHTML = names.map(name => 
            `<div class="name-item">${name}</div>`
        ).join('');
    }

    /**
     * Валидация диапазона чисел
     */
    validateNumberRange(input) {
        const value = parseInt(input.value) || 0;
        const min = input.id === 'min-number' ? 0 : 1;
        const max = input.id === 'min-number' ? 9998 : 10000;
        
        if (value < min) input.value = min;
        if (value > max) input.value = max;
        
        // Проверка корректности диапазона
        const minInput = document.getElementById('min-number');
        const maxInput = document.getElementById('max-number');
        
        if (parseInt(minInput.value) >= parseInt(maxInput.value)) {
            if (input.id === 'min-number') {
                maxInput.value = parseInt(minInput.value) + 1;
            } else {
                minInput.value = parseInt(maxInput.value) - 1;
            }
        }
    }

    /**
     * Добавление в историю
     */
    addToHistory(type, value) {
        const history = type === 'numbers' ? this.numberHistory : this.nameHistory;
        const timestamp = new Date().toLocaleTimeString();
        
        history.unshift({
            value: value,
            timestamp: timestamp,
            mode: this.currentMode
        });
        
        // Ограничение истории 50 записями
        if (history.length > 50) {
            history.pop();
        }
        
        this.saveToStorage(type === 'numbers' ? 'numberHistory' : 'nameHistory', history);
        this.updateHistoryDisplays();
    }

    /**
     * Обновление отображения истории
     */
    updateHistoryDisplays() {
        this.updateHistoryList('numberHistory', this.numberHistory);
        this.updateHistoryList('nameHistory', this.nameHistory);
    }

    /**
     * Обновление конкретного списка истории
     */
    updateHistoryList(containerId, history) {
        const container = document.getElementById(containerId.replace('History', '-history'));
        const type = containerId.replace('History', '');
        
        if (history.length === 0) {
            container.innerHTML = '<div class="empty-history">Результаты появятся здесь</div>';
            return;
        }

        container.innerHTML = history.map(item => `
            <div class="history-item">
                <span class="history-value">${item.value}</span>
                <span class="history-timestamp">${item.timestamp}</span>
            </div>
        `).join('');
    }

    /**
     * Очистка истории
     */
    clearHistory(type) {
        if (!confirm('Вы уверены, что хотите очистить историю?')) return;
        
        if (type === 'numbers') {
            this.numberHistory = [];
            this.saveToStorage('numberHistory', []);
        } else {
            this.nameHistory = [];
            this.saveToStorage('nameHistory', []);
        }
        
        this.updateHistoryDisplays();
    }

    /**
     * Анимация результата
     */
    animateResult(elementId) {
        const element = document.getElementById(elementId);
        element.classList.add('pulse');
        
        setTimeout(() => {
            element.classList.remove('pulse');
        }, 500);
    }

    /**
     * Создание конфетти
     */
    createConfetti() {
        for (let i = 0; i < this.confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.background = this.getRandomColor();
                confetti.style.animationDelay = Math.random() * 2 + 's';
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 2000);
            }, i * 10);
        }
    }

    /**
     * Получение случайного цвета для конфетти
     */
    getRandomColor() {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
            '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Показать ошибку
     */
    showError(message) {
        // Создаем временное уведомление об ошибке
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    /**
     * Сохранение в localStorage
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(`randomizer_${key}`, JSON.stringify(data));
        } catch (e) {
            console.warn('Не удалось сохранить данные:', e);
        }
    }

    /**
     * Загрузка из localStorage
     */
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(`randomizer_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('Не удалось загрузить данные:', e);
            return null;
        }
    }
}

// Инициализация рандомайзера при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new Randomizer();
    
    // Добавляем CSS для анимации ошибки
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});
