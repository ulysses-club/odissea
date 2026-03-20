/**
 * Панель управления квизом для режима трансляции
 * Открывается в отдельном окне браузера (можно перетаскивать за пределы)
 */

(function() {
    // Переменные
    let controlWindow = null;
    let quizInstance = null;
    let timeReport = [];
    let messageQueue = [];
    let isConnected = false;
    
    // ID для связи между окнами
    const CHANNEL_ID = 'quiz_control_' + Date.now();
    
    // Функция добавления записи в отчет
    function addTimeReport(event, details = '') {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const ms = now.getMilliseconds();
        
        const reportEntry = {
            timestamp: now.getTime(),
            time: `${timeStr}.${ms.toString().padStart(3, '0')}`,
            event: event,
            details: details
        };
        
        timeReport.unshift(reportEntry);
        if (timeReport.length > 100) timeReport.pop();
        
        // Отправляем обновление в окно управления
        sendToControlWindow({ type: 'updateReport', data: timeReport });
    }
    
    // Отправка сообщения в окно управления
    function sendToControlWindow(message) {
        if (controlWindow && !controlWindow.closed) {
            controlWindow.postMessage({ ...message, channelId: CHANNEL_ID }, '*');
        }
    }
    
    // Получение экземпляра Quiz
    function getQuizInstance() {
        if (quizInstance) return quizInstance;
        if (window.quiz) {
            quizInstance = window.quiz;
        }
        return quizInstance;
    }
    
    // Проверка готовности квиза к управлению
    function isQuizReady() {
        const quiz = getQuizInstance();
        return quiz && quiz.quizStarted === true;
    }
    
    // Обновление таймера на экране
    function updateTimerDisplay(seconds) {
        const timerElement = document.getElementById('time-left');
        if (timerElement) {
            timerElement.textContent = seconds;
            const parent = timerElement.parentElement;
            if (parent) {
                if (seconds <= 10) {
                    parent.classList.add('timer-critical');
                } else {
                    parent.classList.remove('timer-critical');
                }
            }
        }
        // Отправляем обновление в окно управления
        sendToControlWindow({ type: 'timerUpdate', timeLeft: seconds });
    }
    
    // Управление таймером
    function addTimeToTimer(seconds) {
        const quiz = getQuizInstance();
        if (quiz && quiz.timer && quiz.timeLeft !== undefined) {
            const newTime = Math.max(1, Math.min(999, quiz.timeLeft + seconds));
            quiz.timeLeft = newTime;
            updateTimerDisplay(quiz.timeLeft);
            addTimeReport('⏱️ Корректировка таймера', `${seconds > 0 ? '+' : ''}${seconds} сек, сейчас ${quiz.timeLeft} сек`);
        } else {
            addTimeReport('⚠️ Ошибка', 'Нет активного таймера');
        }
    }
    
    function skipTimer() {
        const quiz = getQuizInstance();
        if (quiz && quiz.timer) {
            clearInterval(quiz.timer);
            quiz.timer = null;
            addTimeReport('⏭️ Таймер пропущен', '');
            
            const questions = quiz.isRetryMode ? quiz.retryQuestions : quiz.questions.filter(q => q.round === quiz.currentRound);
            if (quiz.currentQuestionIndex < questions.length - 1) {
                quiz.currentQuestionIndex++;
                quiz.showQuestion();
            } else {
                if (quiz.isRetryMode) {
                    quiz.showRoundAnswers();
                } else {
                    quiz.startRetryRound();
                }
            }
        } else {
            addTimeReport('⚠️ Ошибка', 'Нет активного таймера');
        }
    }
    
    function startRetryMode() {
        const quiz = getQuizInstance();
        if (quiz && isQuizReady() && !quiz.isRetryMode && !quiz.showingAnswers) {
            addTimeReport('🔄 Принудительный повтор', `Тур ${quiz.currentRound}`);
            quiz.startRetryRound();
        } else {
            addTimeReport('⚠️ Ошибка', 'Невозможно начать повтор');
        }
    }
    
    function showAnswers() {
        const quiz = getQuizInstance();
        if (quiz && isQuizReady() && !quiz.showingAnswers) {
            addTimeReport('🔍 Принудительный показ ответов', `Тур ${quiz.currentRound}`);
            quiz.showRoundAnswers();
        } else {
            addTimeReport('⚠️ Ошибка', 'Невозможно показать ответы');
        }
    }
    
    function nextRound() {
        const quiz = getQuizInstance();
        if (quiz && isQuizReady() && quiz.showingAnswers) {
            addTimeReport('➡️ Принудительный переход', `К туру ${quiz.currentRound + 1}`);
            quiz.finishRound();
        } else {
            addTimeReport('⚠️ Ошибка', 'Невозможно перейти к следующему туру');
        }
    }
    
    function prevQuestion() {
        const quiz = getQuizInstance();
        if (quiz && isQuizReady() && !quiz.showingAnswers && quiz.currentQuestionIndex > 0) {
            if (quiz.timer) clearInterval(quiz.timer);
            quiz.currentQuestionIndex--;
            quiz.showQuestion();
            addTimeReport('⬅️ Предыдущий вопрос', `Вопрос ${quiz.currentQuestionIndex + 1}`);
        } else {
            addTimeReport('⚠️ Ошибка', 'Невозможно вернуться');
        }
    }
    
    function nextQuestion() {
        const quiz = getQuizInstance();
        if (quiz && isQuizReady() && !quiz.showingAnswers) {
            const questions = quiz.isRetryMode ? quiz.retryQuestions : quiz.questions.filter(q => q.round === quiz.currentRound);
            if (quiz.currentQuestionIndex < questions.length - 1) {
                if (quiz.timer) clearInterval(quiz.timer);
                quiz.currentQuestionIndex++;
                quiz.showQuestion();
                addTimeReport('➡️ Следующий вопрос', `Вопрос ${quiz.currentQuestionIndex + 1}`);
            } else {
                if (quiz.timer) clearInterval(quiz.timer);
                if (quiz.isRetryMode) {
                    quiz.showRoundAnswers();
                } else {
                    quiz.startRetryRound();
                }
                addTimeReport('➡️ Завершен тур', `Последний вопрос тура ${quiz.currentRound}`);
            }
        } else {
            addTimeReport('⚠️ Ошибка', 'Невозможно перейти вперед');
        }
    }
    
    function clearReport() {
        timeReport = [];
        sendToControlWindow({ type: 'updateReport', data: timeReport });
        addTimeReport('🗑️ Журнал очищен', '');
    }
    
    // Открытие отдельного окна управления
    function openControlWindow() {
        if (controlWindow && !controlWindow.closed) {
            controlWindow.focus();
            return;
        }
        
        // Создаем HTML для окна управления
        const controlHtml = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Управление квизом</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', system-ui, sans-serif;
                    background: linear-gradient(135deg, #1a1a2e, #0a0a14);
                    color: #fff;
                    min-height: 100vh;
                    padding: 16px;
                }
                
                .control-container {
                    max-width: 500px;
                    margin: 0 auto;
                }
                
                .control-header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                
                .control-header h1 {
                    font-size: 1.3rem;
                    background: linear-gradient(to right, #6a11cb, #2575fc);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                
                .control-header p {
                    font-size: 0.7rem;
                    color: #6c757d;
                    margin-top: 6px;
                }
                
                .control-section {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 14px;
                    margin-bottom: 14px;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                
                .control-section h3 {
                    font-size: 0.85rem;
                    color: #2575fc;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .control-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .control-btn {
                    padding: 6px 12px;
                    border-radius: 30px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }
                
                .control-btn:hover {
                    transform: translateY(-2px);
                }
                
                .control-btn.primary {
                    background: linear-gradient(to right, #6a11cb, #2575fc);
                }
                
                .control-btn.danger {
                    background: linear-gradient(to right, #ff4d4d, #ff6b6b);
                }
                
                .control-btn.warning {
                    background: linear-gradient(to right, #ff9800, #ffb74d);
                }
                
                .time-report {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 12px;
                    border-left: 3px solid #2575fc;
                }
                
                .time-report h4 {
                    margin: 0 0 8px 0;
                    font-size: 0.75rem;
                    color: #2575fc;
                }
                
                .time-report-list {
                    max-height: 250px;
                    overflow-y: auto;
                    font-size: 0.7rem;
                    font-family: monospace;
                }
                
                .time-report-item {
                    padding: 4px 6px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    gap: 8px;
                }
                
                .time-report-item .time {
                    color: #ff9800;
                    font-weight: 600;
                    min-width: 70px;
                }
                
                .time-report-item .event {
                    flex: 1;
                    color: #ccc;
                    word-break: break-word;
                }
                
                .clear-report-btn {
                    margin-top: 10px;
                    padding: 4px 10px;
                    font-size: 0.65rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 20px;
                    color: #ff4d4d;
                    cursor: pointer;
                    width: 100%;
                }
                
                .status-indicator {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #4caf50;
                    margin-right: 6px;
                    animation: pulse 1.5s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .status-text {
                    font-size: 0.7rem;
                    color: #6c757d;
                    text-align: center;
                    margin-top: 12px;
                }
                
                hr {
                    border-color: rgba(255,255,255,0.1);
                    margin: 12px 0;
                }
            </style>
        </head>
        <body>
            <div class="control-container">
                <div class="control-header">
                    <h1>🎮 Управление квизом</h1>
                    <p>Отдельное окно управления</p>
                </div>
                
                <div class="control-section">
                    <h3>📋 Навигация</h3>
                    <div class="control-buttons">
                        <button class="control-btn" id="prev-question">◀ Предыдущий</button>
                        <button class="control-btn" id="next-question">Следующий ▶</button>
                    </div>
                </div>
                
                <div class="control-section">
                    <h3>⏱️ Таймеры</h3>
                    <div class="control-buttons">
                        <button class="control-btn warning" id="add-time">+10 сек</button>
                        <button class="control-btn warning" id="sub-time">-10 сек</button>
                        <button class="control-btn danger" id="skip-timer">⏭️ Пропустить</button>
                    </div>
                    <div id="timer-display" style="margin-top: 10px; text-align: center; font-size: 0.8rem; color: #2575fc;">Таймер: --</div>
                </div>
                
                <div class="control-section">
                    <h3>🔄 Режимы</h3>
                    <div class="control-buttons">
                        <button class="control-btn" id="start-retry">🔄 Повтор тура</button>
                        <button class="control-btn" id="show-answers">✅ Показать ответы</button>
                        <button class="control-btn primary" id="next-round">➡️ Следующий тур</button>
                    </div>
                </div>
                
                <div class="control-section">
                    <h3>📊 Отчет времени</h3>
                    <div class="time-report">
                        <h4>📝 Журнал событий</h4>
                        <div class="time-report-list" id="report-list">
                            <div class="time-report-item"><span class="time">—</span><span class="event">Ожидание подключения</span></div>
                        </div>
                        <button class="clear-report-btn" id="clear-report">🗑️ Очистить журнал</button>
                    </div>
                </div>
                
                <div class="status-text">
                    <span class="status-indicator"></span> Соединение установлено
                </div>
            </div>
            
            <script>
                const channelId = '${CHANNEL_ID}';
                let parentWindow = null;
                
                // Находим родительское окно
                if (window.opener) {
                    parentWindow = window.opener;
                }
                
                // Отправка команды в родительское окно
                function sendCommand(action, data = null) {
                    if (parentWindow && !parentWindow.closed) {
                        parentWindow.postMessage({ type: 'command', action: action, data: data, channelId: channelId }, '*');
                    } else {
                        console.error('Соединение с основным окном потеряно');
                        document.querySelector('.status-text').innerHTML = '<span style="color:#ff4d4d">⚠️ Соединение потеряно. Закройте и откройте заново.</span>';
                    }
                }
                
                // Получение сообщений от родительского окна
                window.addEventListener('message', (event) => {
                    if (event.data.channelId !== channelId) return;
                    
                    if (event.data.type === 'updateReport') {
                        const reportList = document.getElementById('report-list');
                        if (event.data.data && event.data.data.length > 0) {
                            reportList.innerHTML = event.data.data.map(entry => 
                                '<div class="time-report-item"><span class="time">' + entry.time + '</span><span class="event">' + entry.event + (entry.details ? ' <span style="color:#888">' + entry.details + '</span>' : '') + '</span></div>'
                            ).join('');
                        } else {
                            reportList.innerHTML = '<div class="time-report-item"><span class="time">—</span><span class="event">Нет записей</span></div>';
                        }
                    } else if (event.data.type === 'timerUpdate') {
                        document.getElementById('timer-display').innerHTML = '⏱️ Таймер: ' + event.data.timeLeft + ' сек';
                    }
                });
                
                // Назначаем обработчики кнопок
                document.getElementById('prev-question').onclick = () => sendCommand('prevQuestion');
                document.getElementById('next-question').onclick = () => sendCommand('nextQuestion');
                document.getElementById('add-time').onclick = () => sendCommand('addTime', 10);
                document.getElementById('sub-time').onclick = () => sendCommand('subTime', -10);
                document.getElementById('skip-timer').onclick = () => sendCommand('skipTimer');
                document.getElementById('start-retry').onclick = () => sendCommand('startRetry');
                document.getElementById('show-answers').onclick = () => sendCommand('showAnswers');
                document.getElementById('next-round').onclick = () => sendCommand('nextRound');
                document.getElementById('clear-report').onclick = () => sendCommand('clearReport');
                
                // Уведомляем о готовности
                sendCommand('ready');
            </script>
        </body>
        </html>`;
        
        // Создаем Blob и открываем окно
        const blob = new Blob([controlHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        controlWindow = window.open(url, 'quiz_control', 'width=550,height=700,left=100,top=100,resizable=yes,scrollbars=yes');
        URL.revokeObjectURL(url);
        
        // Обработка закрытия окна
        const checkClosed = setInterval(() => {
            if (controlWindow && controlWindow.closed) {
                clearInterval(checkClosed);
                controlWindow = null;
                addTimeReport('🚪 Окно управления закрыто', '');
            }
        }, 1000);
    }
    
    // Обработка сообщений от окна управления
    function handleControlMessages(event) {
        if (event.data.channelId !== CHANNEL_ID) return;
        
        if (event.data.type === 'command') {
            switch (event.data.action) {
                case 'ready':
                    addTimeReport('🔌 Окно управления подключено', '');
                    sendToControlWindow({ type: 'updateReport', data: timeReport });
                    const quiz = getQuizInstance();
                    if (quiz && quiz.timeLeft !== undefined) {
                        sendToControlWindow({ type: 'timerUpdate', timeLeft: quiz.timeLeft });
                    }
                    break;
                case 'prevQuestion':
                    prevQuestion();
                    break;
                case 'nextQuestion':
                    nextQuestion();
                    break;
                case 'addTime':
                    addTimeToTimer(event.data.data);
                    break;
                case 'subTime':
                    addTimeToTimer(event.data.data);
                    break;
                case 'skipTimer':
                    skipTimer();
                    break;
                case 'startRetry':
                    startRetryMode();
                    break;
                case 'showAnswers':
                    showAnswers();
                    break;
                case 'nextRound':
                    nextRound();
                    break;
                case 'clearReport':
                    clearReport();
                    break;
            }
        }
    }
    
    // Добавляем кнопку открытия отдельного окна
    function addControlButton() {
        const btn = document.createElement('button');
        btn.className = 'control-window-btn';
        btn.id = 'control-window-btn';
        btn.title = 'Открыть управление квизом в отдельном окне';
        btn.innerHTML = '🎮';
        btn.onclick = openControlWindow;
        document.body.appendChild(btn);
    }
    
    // Добавляем запись о начале квиза
    function addStartQuizReport() {
        const startBtn = document.getElementById('start-quiz-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                setTimeout(() => {
                    addTimeReport('🚀 Квиз запущен', '');
                }, 100);
            });
        }
    }
    
    // Отслеживаем завершение квиза
    function setupQuizCompletionObserver() {
        const observer = new MutationObserver(() => {
            const results = document.getElementById('quiz-results');
            if (results && results.style.display !== 'none') {
                addTimeReport('🏆 Квиз завершен', 'Все туры пройдены');
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // Перехватываем оригинальные методы для логирования
    function setupMethodInterception() {
        const checkInterval = setInterval(() => {
            const quiz = getQuizInstance();
            if (quiz && !quiz._controlIntercepted) {
                // Сохраняем оригинальные методы
                const originalShowQuestion = quiz.showQuestion;
                const originalStartRetryRound = quiz.startRetryRound;
                const originalShowRoundAnswers = quiz.showRoundAnswers;
                const originalFinishRound = quiz.finishRound;
                
                // Перехватываем для логирования
                quiz.showQuestion = function() {
                    const questions = this.isRetryMode ? this.retryQuestions : this.questions.filter(q => q.round === this.currentRound);
                    const currentQ = questions[this.currentQuestionIndex];
                    addTimeReport('📄 Показан вопрос', `Тур ${this.currentRound}, Вопрос ${this.currentQuestionIndex + 1}`);
                    originalShowQuestion.apply(this, arguments);
                };
                
                quiz.startRetryRound = function() {
                    addTimeReport('🔄 Начат повтор тура', `Тур ${this.currentRound}`);
                    originalStartRetryRound.apply(this, arguments);
                };
                
                quiz.showRoundAnswers = function() {
                    addTimeReport('✅ Показаны правильные ответы', `Тур ${this.currentRound}`);
                    originalShowRoundAnswers.apply(this, arguments);
                };
                
                quiz.finishRound = function() {
                    addTimeReport('🏁 Завершен тур', `Тур ${this.currentRound}`);
                    originalFinishRound.apply(this, arguments);
                };
                
                quiz._controlIntercepted = true;
                clearInterval(checkInterval);
            }
        }, 500);
    }
    
    // Инициализация
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Инициализация панели управления...');
        addControlButton();
        addStartQuizReport();
        setupQuizCompletionObserver();
        setupMethodInterception();
        window.addEventListener('message', handleControlMessages);
    });
})();
