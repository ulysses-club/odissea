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
    }

    /**
     * Инициализирует DOM-элементы
     */
    initializeElements() {
        this.authSection = document.getElementById('auth');
        this.dashboardSection = document.getElementById('dashboard');
        this.chatIdInput = document.getElementById('chatId-input');
        this.authBtn = document.getElementById('auth-btn');

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
     * Настраивает обработчики событий
     */
    setupEventListeners() {
        this.authBtn.addEventListener('click', () => this.authenticate());
        this.chatIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.authenticate();
        });

        // Кнопка выхода
        document.addEventListener('click', (e) => {
            if (e.target.closest('#logout-btn')) {
                this.logout();
            }
        });

        // Валидация ввода - только цифры
        this.chatIdInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^\d]/g, '');
        });
    }

    /**
     * Проверяет существующую сессию
     */
    checkExistingSession() {
        const savedChatId = localStorage.getItem('santa_chatId');
        if (savedChatId) {
            this.chatIdInput.value = savedChatId;
            this.authenticate();
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
            // Загружаем реальные данные комнат
            const roomsData = await this.loadRoomsData();
            const userData = this.findUserInRooms(chatId, roomsData);

            if (!userData) {
                throw new Error('Участник с таким кодом не найден. Проверьте правильность кода или обратитесь к организатору.');
            }

            this.currentUser = userData;
            this.roomData = userData.room;
            this.userAssignment = userData.assignment;

            // Сохраняем сессию
            localStorage.setItem('santa_chatId', chatId);

            this.showDashboard();

        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Загружает реальные данные комнат из JSON файла
     */
    async loadRoomsData() {
        try {
            const response = await fetch('../data/rooms.json');
            if (!response.ok) {
                throw new Error('Не удалось загрузить данные комнат');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            throw new Error('Не удалось подключиться к серверу. Попробуйте позже.');
        }
    }

    /**
     * Ищет пользователя в комнатах
     */
    findUserInRooms(chatId, roomsData) {
        for (const roomCode in roomsData) {
            const room = roomsData[roomCode];
            const participants = room.participants;

            if (participants[chatId]) {
                const user = participants[chatId];
                const assignment = this.findUserAssignment(chatId, room);

                return {
                    user: user,
                    room: {
                        name: room.name,
                        code: room.code,
                        participants: Object.values(participants).map(p => ({
                            name: p.name,
                            chatId: p.chatId
                        })),
                        drawCompleted: room.drawCompleted,
                        isActive: room.isActive
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
        if (!room.drawResults || !room.drawCompleted) {
            return {
                receiver: null,
                wishes: 'Жеребьёвка еще не проведена',
                address: 'Ожидайте проведения жеребьёвки организатором'
            };
        }

        const assignment = room.drawResults.find(result =>
            result.giver.chatId.toString() === chatId
        );

        if (!assignment) {
            return {
                receiver: null,
                wishes: 'Вы не участвуете в текущей жеребьёвке',
                address: 'Обратитесь к организатору'
            };
        }

        return {
            receiver: assignment.receiver.name,
            wishes: assignment.receiver.wishes || 'Пожелания не указаны',
            address: assignment.receiver.address || 'Контакты не указаны'
        };
    }

    /**
     * Показывает личный кабинет
     */
    showDashboard() {
        this.authSection.classList.add('hidden');
        this.dashboardSection.classList.remove('hidden');

        this.updateDashboard();
    }

    /**
     * Обновляет данные в личном кабинете
     */
    updateDashboard() {
        if (!this.currentUser || !this.roomData) return;

        // Основная информация
        this.userNameElement.textContent = this.currentUser.user.name;
        this.roomNameElement.textContent = this.roomData.name;
        this.roomCodeElement.textContent = this.roomData.code;
        this.participantsCountElement.textContent = this.roomData.participants.length;

        // Статус жеребьёвки
        if (this.roomData.drawCompleted) {
            this.drawStatusElement.textContent = 'Завершена';
            this.drawStatusElement.className = 'detail-value status-completed';
        } else {
            this.drawStatusElement.textContent = 'Ожидается';
            this.drawStatusElement.className = 'detail-value status-pending';
        }

        // Информация о подарке
        if (this.userAssignment && this.userAssignment.receiver) {
            this.receiverNameElement.textContent = this.userAssignment.receiver;
            this.receiverWishesElement.textContent = this.userAssignment.wishes;
            this.receiverAddressElement.textContent = this.userAssignment.address;
        } else {
            this.receiverNameElement.textContent = 'Информация появится после жеребьёвки';
            this.receiverWishesElement.textContent = this.userAssignment?.wishes || 'Ожидайте проведения жеребьёвки организатором';
            this.receiverAddressElement.textContent = this.userAssignment?.address || 'Контакты появятся после жеребьёвки';
        }

        // Список участников
        this.updateParticipantsList();
    }

    /**
     * Обновляет список участников
     */
    updateParticipantsList() {
        if (!this.roomData || !this.participantsListElement) return;

        this.participantsListElement.innerHTML = this.roomData.participants
            .map(participant => {
                const isCurrentUser = participant.chatId.toString() === this.currentUser.user.chatId.toString();
                const avatarText = participant.name.charAt(0).toUpperCase();

                return `
                    <div class="participant-card ${isCurrentUser ? 'current-user' : ''}">
                        <div class="participant-avatar">${avatarText}</div>
                        <div class="participant-name">${participant.name}</div>
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
        this.authBtn.disabled = true;
        this.authBtn.innerHTML = '<span class="btn-icon">⏳</span>Загрузка...';
    }

    /**
     * Скрывает индикатор загрузки
     */
    hideLoading() {
        this.authBtn.disabled = false;
        this.authBtn.innerHTML = '<span class="btn-icon">🎁</span>Узнать своего Санту';
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

    /**
     * Выход из системы
     */
    logout() {
        localStorage.removeItem('santa_chatId');
        this.currentUser = null;
        this.roomData = null;
        this.userAssignment = null;

        this.dashboardSection.classList.add('hidden');
        this.authSection.classList.remove('hidden');
        this.chatIdInput.value = '';
    }
}

/**
 * Инициализирует игру Тайный Санта после загрузки DOM
 */
function initSantaGame() {
    window.santaGame = new SantaGame();
    console.log('Тайный Санта инициализирован');
}

// Запускаем инициализацию когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSantaGame);
} else {
    initSantaGame();
}
