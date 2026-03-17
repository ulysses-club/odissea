/**
 * Основной класс для игры Тайный Санта
 * @class
 */
class SantaGame {
    constructor() {
        this.currentUser = null;
        this.roomData = null;
        this.userAssignment = null;

        this.initializeElements();
        this.setupEventListeners();
        this.checkExistingSession();
        
        // Добавляем пример данных для демонстрации
        this.loadSampleData();
    }

    /**
     * Инициализирует DOM-элементы
     */
    initializeElements() {
        this.authSection = document.getElementById('auth');
        this.dashboardSection = document.getElementById('dashboard');
        this.chatIdInput = document.getElementById('chatId-input');
        this.authBtn = document.getElementById('auth-btn');
        this.logoutBtn = document.getElementById('logout-btn');

        // Элементы дашборда
        this.userNameElement = document.getElementById('user-name');
        this.roomNameElement = document.getElementById('room-name');
        this.roomCodeElement = document.getElementById('room-code');
        this.participantsCountElement = document.getElementById('participants-count');
        this.drawStatusElement = document.getElementById('draw-status');
        this.receiverNameElement = document.getElementById('receiver-name');
        this.receiverWishesElement = document.getElementById('receiver-wishes');
        this.receiverAddressElement = document.getElementById('receiver-address');
        this.participantsListElement = document.getElementById('participants-list');
    }

    /**
     * Загружает пример данных для демонстрации
     */
    loadSampleData() {
        // Сохраняем пример данных в localStorage для демо
        const sampleRooms = {
            'odin': {
                name: 'Новогодний обмен 2026',
                code: 'ODIN',
                participants: {
                    '1111111111': {
                        chatId: '1111111111',
                        name: 'Анна',
                        wishes: 'Люблю книги по фэнтези и сладости',
                        address: 'г. Москва, ул. Тверская, д.1'
                    },
                    '2222222222': {
                        chatId: '2222222222',
                        name: 'Михаил',
                        wishes: 'Интересует настольная игра',
                        address: 'г. Москва, ул. Арбат, д.10'
                    },
                    '3333333333': {
                        chatId: '3333333333',
                        name: 'Елена',
                        wishes: 'Теплые варежки или шарф',
                        address: 'г. Москва, ул. Новый Арбат, д.24'
                    }
                },
                drawCompleted: true,
                isActive: true,
                drawResults: [
                    {
                        giver: { chatId: '1111111111', name: 'Анна' },
                        receiver: { 
                            name: 'Михаил',
                            wishes: 'Интересует настольная игра',
                            address: 'г. Москва, ул. Арбат, д.10'
                        }
                    },
                    {
                        giver: { chatId: '2222222222', name: 'Михаил' },
                        receiver: { 
                            name: 'Елена',
                            wishes: 'Теплые варежки или шарф',
                            address: 'г. Москва, ул. Новый Арбат, д.24'
                        }
                    },
                    {
                        giver: { chatId: '3333333333', name: 'Елена' },
                        receiver: { 
                            name: 'Анна',
                            wishes: 'Люблю книги по фэнтези и сладости',
                            address: 'г. Москва, ул. Тверская, д.1'
                        }
                    }
                ]
            },
            'dvina': {
                name: 'Корпоратив Отдел Разработки',
                code: 'DVINA',
                participants: {
                    '4444444444': {
                        chatId: '4444444444',
                        name: 'Дмитрий',
                        wishes: 'Кофе в подарок',
                        address: 'г. Москва, ул. Ленина, д.5'
                    },
                    '5555555555': {
                        chatId: '5555555555',
                        name: 'Ольга',
                        wishes: 'Кружка с принтом',
                        address: 'г. Москва, ул. Советская, д.12'
                    }
                },
                drawCompleted: false,
                isActive: true,
                drawResults: []
            }
        };

        // Сохраняем в localStorage для демо
        if (!localStorage.getItem('santa_rooms')) {
            localStorage.setItem('santa_rooms', JSON.stringify(sampleRooms));
        }
    }

    /**
     * Настраивает обработчики событий
     */
    setupEventListeners() {
        // Защита от всплытия событий
        const stopPropagation = (e) => e.stopPropagation();
        
        if (this.authBtn) {
            this.authBtn.addEventListener('click', (e) => {
                stopPropagation(e);
                this.authenticate();
            });
        }
        
        if (this.chatIdInput) {
            this.chatIdInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    stopPropagation(e);
                    this.authenticate();
                }
            });
        }

        // Кнопка выхода
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', (e) => {
                stopPropagation(e);
                this.logout();
            });
        }

        // Валидация ввода - только цифры
        if (this.chatIdInput) {
            this.chatIdInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^\d]/g, '');
            });
        }
    }

    /**
     * Проверяет существующую сессию
     */
    checkExistingSession() {
        const savedChatId = localStorage.getItem('santa_chatId');
        if (savedChatId) {
            this.chatIdInput.value = savedChatId;
            // Автоматическая аутентификация с небольшой задержкой
            setTimeout(() => this.authenticate(), 500);
        }
    }

    /**
     * Аутентифицирует пользователя
     */
    async authenticate() {
        const chatId = this.chatIdInput.value.trim();

        if (!chatId) {
            this.showError('Пожалуйста, введите ваш код участника');
            return;
        }

        if (!/^\d+$/.test(chatId)) {
            this.showError('Код участника должен содержать только цифры');
            return;
        }

        this.showLoading();

        try {
            // Загружаем данные комнат из localStorage или создаем тестовые
            let roomsData = this.loadRoomsData();
            
            // Для демонстрации добавляем тестового пользователя, если его нет
            if (!this.findUserInRooms(chatId, roomsData) && chatId.length >= 5) {
                roomsData = this.createTestUser(chatId, roomsData);
            }
            
            const userData = this.findUserInRooms(chatId, roomsData);

            if (!userData) {
                throw new Error('Участник с таким кодом не найден. Попробуйте код 1111111111 или 2222222222 для демо.');
            }

            this.currentUser = userData;
            this.roomData = userData.room;
            this.userAssignment = userData.assignment;

            // Сохраняем сессию
            localStorage.setItem('santa_chatId', chatId);

            this.showDashboard();

        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }

    /**
     * Загружает данные комнат
     */
    loadRoomsData() {
        try {
            const savedRooms = localStorage.getItem('santa_rooms');
            if (savedRooms) {
                return JSON.parse(savedRooms);
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
        
        // Возвращаем пустой объект, если ничего не найдено
        return {};
    }

    /**
     * Создает тестового пользователя для демонстрации
     */
    createTestUser(chatId, roomsData) {
        // Если комнат нет, создаем тестовую
        if (Object.keys(roomsData).length === 0) {
            roomsData = {
                'demo': {
                    name: 'Демо-комната',
                    code: 'DEMO',
                    participants: {},
                    drawCompleted: true,
                    isActive: true,
                    drawResults: []
                }
            };
        }
        
        // Берем первую комнату
        const roomCode = Object.keys(roomsData)[0];
        const room = roomsData[roomCode];
        
        // Добавляем пользователя
        room.participants[chatId] = {
            chatId: chatId,
            name: `Участник ${chatId.slice(-4)}`,
            wishes: 'Люблю сюрпризы',
            address: 'г. Москва, ул. Примерная, д.1'
        };
        
        // Если есть жеребьевка, добавляем для него назначение
        if (room.drawCompleted && room.participants) {
            const receiverIds = Object.keys(room.participants).filter(id => id !== chatId);
            if (receiverIds.length > 0) {
                const randomReceiverId = receiverIds[Math.floor(Math.random() * receiverIds.length)];
                const receiver = room.participants[randomReceiverId];
                
                room.drawResults.push({
                    giver: { chatId: chatId, name: room.participants[chatId].name },
                    receiver: {
                        name: receiver.name,
                        wishes: receiver.wishes,
                        address: receiver.address
                    }
                });
            }
        }
        
        // Сохраняем обновленные данные
        localStorage.setItem('santa_rooms', JSON.stringify(roomsData));
        
        return roomsData;
    }

    /**
     * Ищет пользователя в комнатах
     */
    findUserInRooms(chatId, roomsData) {
        for (const roomCode in roomsData) {
            const room = roomsData[roomCode];
            const participants = room.participants || {};

            if (participants[chatId]) {
                const user = participants[chatId];
                const assignment = this.findUserAssignment(chatId, room);

                return {
                    user: user,
                    room: {
                        name: room.name || 'Комната',
                        code: room.code || roomCode,
                        participants: Object.values(participants).map(p => ({
                            name: p.name || 'Участник',
                            chatId: p.chatId
                        })),
                        drawCompleted: room.drawCompleted || false,
                        isActive: room.isActive !== false
                    },
                    assignment: assignment
                };
            }
        }
        return null;
    }

    /**
     * Находит назначение пользователя в жеребьёвке
     */
    findUserAssignment(chatId, room) {
        if (!room.drawResults || !room.drawCompleted || room.drawResults.length === 0) {
            return {
                receiver: null,
                wishes: 'Жеребьёвка еще не проведена',
                address: 'Ожидайте проведения жеребьёвки организатором'
            };
        }

        const assignment = room.drawResults.find(result =>
            result.giver && result.giver.chatId.toString() === chatId
        );

        if (!assignment) {
            return {
                receiver: null,
                wishes: 'Информация о получателе временно недоступна',
                address: 'Обратитесь к организатору'
            };
        }

        return {
            receiver: assignment.receiver.name || 'Получатель',
            wishes: assignment.receiver.wishes || 'Пожелания не указаны',
            address: assignment.receiver.address || 'Контакты не указаны'
        };
    }

    /**
     * Показывает личный кабинет
     */
    showDashboard() {
        this.hideLoading();
        
        if (this.authSection) {
            this.authSection.classList.add('hidden');
        }
        
        if (this.dashboardSection) {
            this.dashboardSection.classList.remove('hidden');
        }

        this.updateDashboard();
    }

    /**
     * Обновляет данные в личном кабинете
     */
    updateDashboard() {
        if (!this.currentUser || !this.roomData) return;

        // Основная информация
        if (this.userNameElement) {
            this.userNameElement.textContent = this.currentUser.user.name || 'Участник';
        }
        
        if (this.roomNameElement) {
            this.roomNameElement.textContent = this.roomData.name || 'Комната';
        }
        
        if (this.roomCodeElement) {
            this.roomCodeElement.textContent = this.roomData.code || '---';
        }
        
        if (this.participantsCountElement) {
            this.participantsCountElement.textContent = this.roomData.participants?.length || 0;
        }

        // Статус жеребьёвки
        if (this.drawStatusElement) {
            if (this.roomData.drawCompleted) {
                this.drawStatusElement.textContent = 'Завершена';
                this.drawStatusElement.className = 'detail-value status-completed';
            } else {
                this.drawStatusElement.textContent = 'Ожидается';
                this.drawStatusElement.className = 'detail-value status-pending';
            }
        }

        // Информация о подарке
        if (this.receiverNameElement) {
            if (this.userAssignment && this.userAssignment.receiver) {
                this.receiverNameElement.textContent = this.userAssignment.receiver;
            } else {
                this.receiverNameElement.textContent = 'Информация появится после жеребьёвки';
            }
        }
        
        if (this.receiverWishesElement) {
            this.receiverWishesElement.textContent = this.userAssignment?.wishes || 
                'Ожидайте проведения жеребьёвки организатором';
        }
        
        if (this.receiverAddressElement) {
            this.receiverAddressElement.textContent = this.userAssignment?.address || 
                'Контакты появятся после жеребьёвки';
        }

        // Список участников
        this.updateParticipantsList();
    }

    /**
     * Обновляет список участников
     */
    updateParticipantsList() {
        if (!this.roomData || !this.participantsListElement) return;

        if (!this.roomData.participants || this.roomData.participants.length === 0) {
            this.participantsListElement.innerHTML = '<div class="empty-history">Нет участников</div>';
            return;
        }

        this.participantsListElement.innerHTML = this.roomData.participants
            .map(participant => {
                const isCurrentUser = participant.chatId?.toString() === this.currentUser?.user?.chatId?.toString();
                const avatarText = participant.name ? participant.name.charAt(0).toUpperCase() : '?';

                return `
                    <div class="participant-card ${isCurrentUser ? 'current-user' : ''}">
                        <div class="participant-avatar">${avatarText}</div>
                        <div class="participant-name">${participant.name || 'Участник'}</div>
                        <div class="participant-status">${isCurrentUser ? 'Это вы! 🎅' : 'Участник'}</div>
                    </div>
                `;
            })
            .join('');
    }

    /**
     * Показывает индикатор загрузки
     */
    showLoading() {
        if (this.authBtn) {
            this.authBtn.disabled = true;
            this.authBtn.innerHTML = '<span class="btn-icon">⏳</span>Загрузка...';
        }
    }

    /**
     * Скрывает индикатор загрузки
     */
    hideLoading() {
        if (this.authBtn) {
            this.authBtn.disabled = false;
            this.authBtn.innerHTML = '<span class="btn-icon">🎁</span>Узнать своего Санту';
        }
    }

    /**
     * Показывает сообщение об ошибке
     */
    showError(message) {
        this.hideLoading();

        // Создаем временное уведомление об ошибке
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        errorDiv.textContent = message;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);

        // Добавляем анимацию исчезновения
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Выход из системы
     */
    logout() {
        localStorage.removeItem('santa_chatId');
        this.currentUser = null;
        this.roomData = null;
        this.userAssignment = null;

        if (this.dashboardSection) {
            this.dashboardSection.classList.add('hidden');
        }
        
        if (this.authSection) {
            this.authSection.classList.remove('hidden');
        }
        
        if (this.chatIdInput) {
            this.chatIdInput.value = '';
        }
        
        this.hideLoading();
        
        // Показываем сообщение о выходе
        this.showSuccess('Вы успешно вышли из системы');
    }

    /**
     * Показывает сообщение об успехе
     */
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: #00b894;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        successDiv.textContent = message;

        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => successDiv.remove(), 300);
        }, 3000);
    }
}

/**
 * Инициализирует игру Тайный Санта после загрузки DOM
 */
function initSantaGame() {
    // Небольшая задержка для других модулей
    setTimeout(() => {
        if (document.getElementById('auth-btn')) {
            window.santaGame = new SantaGame();
            console.log('Тайный Санта инициализирован');
        }
    }, 200);
}

// Запускаем инициализацию когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSantaGame);
} else {
    initSantaGame();
}
