/**
 * Админ-модуль для управления контентом киноклуба
 * Версия 3.1 - упрощенное выставление оценок
 */

class AdminModule {
    constructor() {
        this.isAuthenticated = false;
        this.currentScores = [];
        this.currentAnnounce = null;
        this.filmsList = [];

        this.init();
    }

    init() {
        this.createAdminTrigger();
        this.createModal();
        this.loadCurrentAnnounce();
        this.loadFilmsList();
    }

    createAdminTrigger() {
        const trigger = document.createElement('button');
        trigger.className = 'admin-trigger';
        trigger.innerHTML = '🎬';
        trigger.setAttribute('aria-label', 'Админ-панель');
        trigger.addEventListener('click', () => this.showPasswordModal());
        document.body.appendChild(trigger);

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.showPasswordModal();
            }
        });
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.id = 'adminModal';
        modal.innerHTML = `
            <div class="admin-modal-overlay"></div>
            <div class="admin-modal-container">
                <div class="admin-modal-header">
                    <h2>🎬 Админ-панель</h2>
                    <button class="admin-modal-close">&times;</button>
                </div>
                <div class="admin-tabs">
                    <button class="admin-tab" data-tab="announce">Новый анонс</button>
                    <button class="admin-tab" data-tab="rating">Выставить оценку</button>
                </div>
                <div class="admin-content">
                    <div class="admin-tab-content" data-content="announce">
                        ${this.getAnnounceFormHTML()}
                    </div>
                    <div class="admin-tab-content" data-content="rating">
                        ${this.getRatingFormHTML()}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        this.modal = modal;
        this.modalOverlay = modal.querySelector('.admin-modal-overlay');
        this.closeBtn = modal.querySelector('.admin-modal-close');

        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', () => this.closeModal());

        modal.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    getAnnounceFormHTML() {
        return `
            <form id="announceForm">
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label>Фильм *</label>
                        <input type="text" name="film" id="announceFilm" required placeholder="Название фильма">
                    </div>
                    <div class="admin-form-group">
                        <label>Год</label>
                        <input type="number" name="year" id="announceYear" placeholder="2024">
                    </div>
                </div>
                
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label>Дата встречи *</label>
                        <input type="text" name="date" id="announceDate" required placeholder="DD.MM.YYYY">
                    </div>
                    <div class="admin-form-group">
                        <label>Время *</label>
                        <input type="text" name="time" id="announceTime" required placeholder="19:00">
                    </div>
                </div>
                
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label>Место встречи</label>
                        <input type="text" name="place" id="announcePlace" placeholder="Кофейня &quot;Том Сойер&quot;">
                    </div>
                    <div class="admin-form-group">
                        <label>Номер обсуждения</label>
                        <input type="number" name="discussionNumber" id="announceDiscussionNumber" placeholder="Авто">
                    </div>
                </div>
                
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label>Режиссер</label>
                        <input type="text" name="director" id="announceDirector" placeholder="Имя режиссера">
                    </div>
                    <div class="admin-form-group">
                        <label>Жанр</label>
                        <input type="text" name="genre" id="announceGenre" placeholder="драма, комедия">
                    </div>
                </div>
                
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label>Страна</label>
                        <input type="text" name="country" id="announceCountry" placeholder="США, Великобритания">
                    </div>
                    <div class="admin-form-group">
                        <label>Постер URL</label>
                        <input type="url" name="poster" id="announcePoster" placeholder="https://...">
                    </div>
                </div>
                
                <div class="admin-form-group" id="posterPreview" style="display: none;">
                    <div class="image-preview">
                        <img id="posterPreviewImg" alt="Предпросмотр постера">
                    </div>
                </div>
                
                <div class="admin-form-group">
                    <label>В главных ролях</label>
                    <textarea name="cast" id="announceCast" placeholder="Список актеров"></textarea>
                </div>
                
                <div class="admin-form-group">
                    <label>Важная информация</label>
                    <textarea name="requirements" id="announceRequirements" placeholder="Дополнительные требования или примечания"></textarea>
                </div>
                
                <div class="admin-form-actions">
                    <button type="submit" class="admin-btn admin-btn-primary">💾 Сохранить анонс</button>
                </div>
            </form>
        `;
    }

    getRatingFormHTML() {
        return `
            <div id="ratingForm">
                <div class="admin-form-group">
                    <label>Текущий анонс</label>
                    <div id="currentAnnounceInfo" class="admin-form-group" style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px;">
                        Загрузка...
                    </div>
                </div>
                
                <div class="admin-form-group">
                    <label>Оценки участников:</label>
                    <div class="rating-buttons" id="ratingButtons">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `
                            <button type="button" class="rating-btn" data-score="${n}">${n}</button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="scores-list" id="scoresList">
                    <div style="color: gray; text-align: center; padding: 20px;">
                        Нет добавленных оценок
                    </div>
                </div>
                
                <div class="average-score" id="averageScore" style="display: none;">
                    <div>Средняя оценка</div>
                    <div class="average-score-value" id="averageValue">0.0</div>
                    <div>Оценок: <span id="scoresCount">0</span></div>
                </div>
                
                <div class="admin-form-actions">
                    <button type="button" id="saveFilmBtn" class="admin-btn admin-btn-primary">✅ Сохранить в историю</button>
                </div>
            </div>
        `;
    }

    showPasswordModal() {
        const password = prompt('Введите пароль администратора:');
        if (password === 'admin498152') {
            this.isAuthenticated = true;
            this.showModal();
        } else if (password !== null) {
            alert('Неверный пароль!');
        }
    }

    showModal() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.switchTab('announce');
    }

    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentScores = [];
    }

    switchTab(tabId) {
        this.modal.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        this.modal.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.content === tabId);
        });

        if (tabId === 'rating') {
            this.initRatingTab();
        } else if (tabId === 'announce') {
            this.initAnnounceTab();
        }
    }

    initAnnounceTab() {
        this.loadCurrentAnnounce();
        this.setupAnnounceForm();
    }

    initRatingTab() {
        this.currentScores = [];
        this.loadCurrentAnnounce();
        this.setupRatingForm();
        this.updateScoresList();
    }

    loadCurrentAnnounce() {
        try {
            const saved = localStorage.getItem('odissea_next_meeting');
            if (saved) {
                this.currentAnnounce = JSON.parse(saved);
            } else {
                this.currentAnnounce = {
                    film: '',
                    year: new Date().getFullYear(),
                    date: '',
                    time: '',
                    place: 'Кофейня "Том Сойер"',
                    director: '',
                    genre: '',
                    country: '',
                    poster: '',
                    cast: '',
                    requirements: '',
                    discussionNumber: 0
                };
            }

            if (document.getElementById('announceForm')) {
                this.fillAnnounceForm();
            }
            this.updateAnnounceInfo();
        } catch (error) {
            console.error('Ошибка загрузки анонса:', error);
            this.currentAnnounce = null;
        }
    }

    fillAnnounceForm() {
        if (!this.currentAnnounce) return;

        const fields = {
            film: 'announceFilm',
            year: 'announceYear',
            date: 'announceDate',
            time: 'announceTime',
            place: 'announcePlace',
            director: 'announceDirector',
            genre: 'announceGenre',
            country: 'announceCountry',
            poster: 'announcePoster',
            cast: 'announceCast',
            requirements: 'announceRequirements',
            discussionNumber: 'announceDiscussionNumber'
        };

        for (const [field, id] of Object.entries(fields)) {
            const input = document.getElementById(id);
            if (input && this.currentAnnounce[field] !== undefined && this.currentAnnounce[field] !== null) {
                input.value = this.currentAnnounce[field];
            }
        }

        const posterUrl = this.currentAnnounce.poster;
        if (posterUrl && posterUrl.trim()) {
            const previewDiv = document.getElementById('posterPreview');
            const previewImg = document.getElementById('posterPreviewImg');
            if (previewDiv && previewImg) {
                previewImg.src = posterUrl;
                previewDiv.style.display = 'block';
            }
        }
    }

    updateAnnounceInfo() {
        const container = document.getElementById('currentAnnounceInfo');
        if (!container) return;

        if (this.currentAnnounce && this.currentAnnounce.film && this.currentAnnounce.film.trim() !== '') {
            container.innerHTML = `
                <strong>🎬 ${this.escapeHtml(this.currentAnnounce.film)}</strong><br>
                📅 ${this.currentAnnounce.date || 'Дата не указана'} | 🕒 ${this.currentAnnounce.time || 'Время не указано'}<br>
                🎭 ${this.currentAnnounce.genre || 'Жанр не указан'}<br>
                🎬 ${this.currentAnnounce.director || 'Режиссер не указан'}<br>
                📍 ${this.currentAnnounce.place || 'Место не указано'}
            `;
        } else {
            container.innerHTML = '⚠️ Нет активного анонса. Создайте анонс на вкладке "Новый анонс"';
        }
    }

    setupAnnounceForm() {
        const form = document.getElementById('announceForm');
        if (!form) return;

        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            this.saveAnnounce(newForm);
        });

        const posterInput = document.getElementById('announcePoster');
        if (posterInput) {
            posterInput.addEventListener('input', (e) => {
                const url = e.target.value;
                const previewDiv = document.getElementById('posterPreview');
                const previewImg = document.getElementById('posterPreviewImg');
                if (url && (url.startsWith('http') || url.startsWith('/'))) {
                    previewImg.src = url;
                    previewDiv.style.display = 'block';
                } else {
                    previewDiv.style.display = 'none';
                }
            });
        }
    }

    saveAnnounce(form) {
        const formData = new FormData(form);

        const data = {
            film: formData.get('film'),
            year: parseInt(formData.get('year')) || new Date().getFullYear(),
            date: formData.get('date'),
            time: formData.get('time'),
            place: formData.get('place') || 'Кофейня "Том Сойер"',
            director: formData.get('director') || '',
            genre: formData.get('genre') || '',
            country: formData.get('country') || '',
            poster: formData.get('poster') || '',
            cast: formData.get('cast') || '',
            requirements: formData.get('requirements') || '',
            discussionNumber: parseInt(formData.get('discussionNumber')) || 0
        };

        if (!data.film) {
            alert('Введите название фильма!');
            return;
        }

        if (!data.date) {
            alert('Введите дату встречи!');
            return;
        }

        if (!data.time) {
            alert('Введите время встречи!');
            return;
        }

        localStorage.setItem('odissea_next_meeting', JSON.stringify(data));
        this.currentAnnounce = data;

        this.showNotification('✅ Анонс сохранен!');

        setTimeout(() => {
            location.reload();
        }, 1500);
    }

    loadFilmsList() {
        try {
            const saved = localStorage.getItem('odissea_films');
            if (saved) {
                this.filmsList = JSON.parse(saved);
            } else {
                this.filmsList = [];
            }
        } catch (error) {
            console.error('Ошибка загрузки фильмов:', error);
            this.filmsList = [];
        }
    }

    setupRatingForm() {
        const ratingBtns = document.querySelectorAll('.rating-btn');
        ratingBtns.forEach(btn => {
            btn.removeEventListener('click', this.handleRatingClick);
            btn.addEventListener('click', this.handleRatingClick.bind(this));
        });

        const saveBtn = document.getElementById('saveFilmBtn');
        if (saveBtn) {
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.addEventListener('click', () => this.saveFilmWithRating());
        }

        this.updateAnnounceInfo();
        this.currentScores = [];
        this.updateScoresList();
    }

    handleRatingClick(e) {
        const score = parseInt(e.currentTarget.dataset.score);

        this.currentScores.push(score);
        this.updateScoresList();

        this.showNotification(`Добавлена оценка ${score}`);
    }

    updateScoresList() {
        const container = document.getElementById('scoresList');
        const averageDiv = document.getElementById('averageScore');

        if (this.currentScores.length === 0) {
            container.innerHTML = '<div style="color: gray; text-align: center; padding: 20px;">Нет добавленных оценок</div>';
            averageDiv.style.display = 'none';
            return;
        }

        const total = this.currentScores.reduce((sum, score) => sum + score, 0);
        const average = total / this.currentScores.length;

        container.innerHTML = this.currentScores.map((score, index) => `
            <div class="score-item">
                <span class="score-name">Оценка ${index + 1}</span>
                <div>
                    <span class="score-value">${score}</span>
                    <button class="remove-score" data-index="${index}">✖</button>
                </div>
            </div>
        `).join('');

        document.getElementById('averageValue').textContent = average.toFixed(1);
        document.getElementById('scoresCount').textContent = this.currentScores.length;
        averageDiv.style.display = 'block';

        container.querySelectorAll('.remove-score').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                this.currentScores.splice(index, 1);
                this.updateScoresList();
            });
        });
    }

    saveFilmWithRating() {
        if (!this.currentAnnounce || !this.currentAnnounce.film || this.currentAnnounce.film.trim() === '') {
            alert('Нет активного анонса! Сначала создайте анонс');
            return;
        }

        if (this.currentScores.length === 0) {
            alert('Добавьте хотя бы одну оценку!');
            return;
        }

        const total = this.currentScores.reduce((sum, score) => sum + score, 0);
        const average = total / this.currentScores.length;

        let nextNumber = this.currentAnnounce.discussionNumber || 1;
        if (this.filmsList && this.filmsList.length > 0) {
            const lastFilm = this.filmsList[this.filmsList.length - 1];
            const lastNumber = lastFilm['Номер обсуждения'] || 0;
            nextNumber = Math.max(nextNumber, lastNumber + 1);
        }

        const filmData = {
            "Фильм": this.currentAnnounce.film,
            "Режиссер": this.currentAnnounce.director || '',
            "Жанр": this.currentAnnounce.genre || '',
            "Страна": this.currentAnnounce.country || '',
            "Год": this.currentAnnounce.year || new Date().getFullYear(),
            "Оценка": average.toFixed(1),
            "Номер обсуждения": nextNumber,
            "Дата": this.currentAnnounce.date || '',
            "Постер URL": this.currentAnnounce.poster || '',
            "В главных ролях": this.currentAnnounce.cast || '',
            "Участников": this.currentScores.length
        };

        this.filmsList.push(filmData);
        localStorage.setItem('odissea_films', JSON.stringify(this.filmsList));

        const emptyAnnounce = {
            film: '',
            year: new Date().getFullYear(),
            date: '',
            time: '',
            place: 'Кофейня "Том Сойер"',
            director: '',
            genre: '',
            country: '',
            poster: '',
            cast: '',
            requirements: '',
            discussionNumber: 0
        };

        localStorage.setItem('odissea_next_meeting', JSON.stringify(emptyAnnounce));

        this.showNotification('✅ Фильм добавлен в историю! Анонс очищен.');

        setTimeout(() => {
            location.reload();
        }, 1500);
    }

    showNotification(message, type = 'success') {
        const oldNotifications = document.querySelectorAll('.admin-notification');
        oldNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.adminModule = new AdminModule();
    });
} else {
    window.adminModule = new AdminModule();
}
