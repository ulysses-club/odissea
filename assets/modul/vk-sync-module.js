/**
 * Модуль для синхронизации постов ВК с GitHub
 */
class VKSyncModule {
    constructor() {
        this.config = {
            vk: {
                accessToken: 'vk1.a.oEkiefTspAQeHMzHWmVpjbv8X7K3tNjm3wgd1Id_2b9UVFLSm1Nzr5aoxo-thkeZ245sBhbBr2wuiRgecayEre6T5-l2Z-HConP970llDH5YXy_Vf2W_62Sllbd3EHkCWsPHqle_pGNEa8B6olU0HgqjmmHbdpJ0UshdbW3rdFUtjNzNmAgWBNfHgH6G2wT94tQ0u8mkeKsgDIjllcl5fw',
                groupId: -232406584,
                apiVersion: '5.131'
            },
            github: {
                token: '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',
                owner: 'ulysses-club',
                repo: 'odissea',
                path: 'assets/data/next-meeting.json'
            }
        };

        this.state = {
            lastProcessedPostId: null,
            isSyncing: false,
            isConfigured: false,
            lastSyncTime: null
        };
    }

    /**
     * Инициализация с безопасными токенами
     */
    init(vkToken, githubToken) {
        if (vkToken) {
            this.config.vk.accessToken = vkToken;
        }
        if (githubToken) {
            this.config.github.token = githubToken;
        }

        this.state.isConfigured = !!(this.config.vk.accessToken && this.config.github.token);

        if (this.state.isConfigured) {
            console.log('VK Sync Module: Конфигурация загружена');
            this.updateSyncStatus('ready', 'Готов к работе');
            this.startAutoSync(60);
        } else {
            console.warn('VK Sync Module: Токены не настроены. Используется локальный режим.');
            this.updateSyncStatus('warning', 'Токены не настроены');
        }
    }

    /**
     * Получить последний пост из группы ВК
     */
    async getLatestVKPost() {
        if (!this.state.isConfigured) {
            console.warn('VK Sync: Токен ВК не настроен');
            return null;
        }

        try {
            const url = 'https://api.vk.com/method/wall.get';
            const params = {
                owner_id: this.config.vk.groupId,
                count: 1,
                filter: 'owner',
                access_token: this.config.vk.accessToken,
                v: this.config.vk.apiVersion
            };

            const response = await fetch(url + '?' + new URLSearchParams(params));
            const data = await response.json();

            if (data.error) {
                throw new Error(`VK API Error: ${data.error.error_msg}`);
            }

            return data.response?.items?.[0] || null;
        } catch (error) {
            console.error('Ошибка получения поста из ВК:', error);
            this.updateSyncStatus('error', 'Ошибка ВК API');
            return null;
        }
    }

    /**
     * Парсинг текста поста для извлечения данных о встрече
     */
    parsePostData(postText) {
        const data = {
            date: "Дата встречи не указана",
            time: "Время не указано",
            place: "Онлайн (https://telemost.yandex.ru/)",
            film: "Фильм ещё не выбран",
            director: "Режиссёр не указан",
            genre: "Жанр уточняется",
            country: "Страна производства не указана",
            year: "Год выхода неизвестен",
            poster: "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bXk0dDYwamltMmg4aGNsZGo1NDkwN3FmdnI5a3RjaGZ1aG54bHl2MyZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/YAlhwn67KT76E/giphy.gif",
            discussionNumber: "Следующий номер после последнего в истории",
            cast: "Актерский состав не указан",
            requirements: "Рекомендуем посмотреть фильм заранее"
        };

        if (!postText) return data;

        console.log('Парсим пост ВК:', postText.substring(0, 200) + '...');

        // Улучшенные паттерны для парсинга
        const patterns = {
            date: /дата[:\s]*([^\n\r]+?)(?=\n|$)/i,
            time: /время[:\s]*([^\n\r]+?)(?=\n|$)/i,
            place: /место[:\s]*([^\n\r]+?)(?=\n|$)/i,
            film: /фильм[:\s]*([^\n\r]+?)(?=\n|$)|["«]([^"»]+)["»]/i,
            director: /режисс[ёе]р[:\s]*([^\n\r]+?)(?=\n|$)/i,
            genre: /жанр[:\s]*([^\n\r]+?)(?=\n|$)/i,
            country: /страна[:\s]*([^\n\r]+?)(?=\n|$)/i,
            year: /год[:\s]*(\d{4})/i,
            cast: /в ролях[:\s]*([^\n\r]+?)(?=\n|$)/i,
            requirements: /рекомендации[:\s]*([^\n\r]+?)(?=\n|$)/i
        };

        Object.keys(patterns).forEach(key => {
            const match = postText.match(patterns[key]);
            if (match) {
                // Для фильма может быть два варианта - с кавычками или без
                if (key === 'film' && match[2]) {
                    data[key] = match[2].trim();
                } else if (match[1]) {
                    data[key] = match[1].trim();
                }
            }
        });

        // Дополнительный парсинг для даты в разных форматах
        if (data.date === "Дата встречи не указана") {
            const dateMatch = postText.match(/(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{2,4})/);
            if (dateMatch) {
                data.date = this.formatDate(dateMatch[1]);
            }
        }

        // Дополнительный парсинг времени
        if (data.time === "Время не указано") {
            const timeMatch = postText.match(/(\d{1,2}:\d{2})/);
            if (timeMatch) {
                data.time = timeMatch[1];
            }
        }

        // Извлечение номера обсуждения
        const discussionMatch = postText.match(/обсуждение\s*#?(\d+)/i);
        if (discussionMatch) {
            data.discussionNumber = discussionMatch[1];
        }

        // Извлечение постера (ссылка на изображение)
        const posterMatch = postText.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/i);
        if (posterMatch) {
            data.poster = posterMatch[1];
        }

        // Валидация данных
        this.validateMeetingData(data);

        console.log('Результат парсинга:', data);
        return data;
    }

    formatDate(dateString) {
        // Приводим дату к формату DD.MM.YYYY
        const match = dateString.match(/(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{2,4})/);
        if (match) {
            let day = match[1].padStart(2, '0');
            let month = match[2].padStart(2, '0');
            let year = match[3];

            // Если год двухзначный, добавляем 20
            if (year.length === 2) {
                year = '20' + year;
            }

            return `${day}.${month}.${year}`;
        }
        return dateString;
    }

    validateMeetingData(data) {
        const required = ['film', 'date'];
        const missing = required.filter(field =>
            !data[field] ||
            data[field].includes('не указан') ||
            data[field].includes('не выбран')
        );

        if (missing.length > 0) {
            console.warn('Отсутствуют обязательные поля:', missing);
            return false;
        }
        return true;
    }

    /**
     * Обновление файла на GitHub
     */
    async updateGitHubFile(meetingData) {
        try {
            // Сначала получаем текущий файл чтобы получить SHA
            const getUrl = `https://api.github.com/repos/${this.config.github.owner}/${this.config.github.repo}/contents/${this.config.github.path}`;

            const getResponse = await fetch(getUrl, {
                headers: {
                    'Authorization': `token ${this.config.github.token}`,
                    'User-Agent': 'VK-Sync-Module',
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            let currentSha = '';

            if (getResponse.ok) {
                const fileData = await getResponse.json();
                currentSha = fileData.sha;
            } else if (getResponse.status !== 404) {
                throw new Error(`GitHub API error: ${getResponse.status}`);
            }

            // Подготавливаем данные для обновления
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(meetingData, null, 2))));

            const updateData = {
                message: 'Auto-update: Обновление данных о следующей встрече из ВК',
                content: content,
                sha: currentSha || undefined
            };

            // Обновляем файл
            const updateResponse = await fetch(getUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.config.github.token}`,
                    'User-Agent': 'VK-Sync-Module',
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(updateData)
            });

            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                throw new Error(`GitHub API error: ${updateResponse.status} - ${errorData.message}`);
            }

            console.log('Файл успешно обновлен на GitHub');
            return true;

        } catch (error) {
            console.error('Ошибка обновления файла на GitHub:', error);
            this.updateSyncStatus('error', 'Ошибка GitHub API');
            return false;
        }
    }

    /**
     * Основная функция синхронизации
     */
    async syncVKToGitHub() {
        if (this.state.isSyncing) {
            console.log('Синхронизация уже выполняется...');
            return false;
        }

        this.state.isSyncing = true;
        this.updateSyncStatus('syncing', 'Синхронизация...');

        try {
            console.log('Начинаем синхронизацию ВК -> GitHub...');

            // Получаем последний пост
            const post = await this.getLatestVKPost();
            if (!post) {
                console.log('Посты не найдены');
                this.updateSyncStatus('warning', 'Посты не найдены');
                return false;
            }

            // Проверяем, не обрабатывали ли мы уже этот пост
            if (this.state.lastProcessedPostId === post.id) {
                console.log('Пост уже обработан ранее');
                this.updateSyncStatus('ready', 'Данные актуальны');
                return false;
            }

            console.log('Найден пост:', {
                id: post.id,
                date: new Date(post.date * 1000).toISOString(),
                text: post.text.substring(0, 100) + '...'
            });

            // Парсим данные из поста
            const meetingData = this.parsePostData(post.text);
            console.log('Извлеченные данные:', meetingData);

            // Обновляем файл на GitHub
            const success = await this.updateGitHubFile(meetingData);

            if (success) {
                this.state.lastProcessedPostId = post.id;
                this.state.lastSyncTime = new Date();
                this.updateSyncStatus('success', 'Синхронизация завершена');
                console.log('Синхронизация завершена успешно!');

                // Обновляем отображение на странице
                if (window.nextMeetingModule) {
                    window.nextMeetingModule.updateMeetingData(meetingData);
                }

                return true;
            }

            return false;

        } catch (error) {
            console.error('Ошибка синхронизации:', error);
            this.updateSyncStatus('error', 'Ошибка синхронизации');
            return false;
        } finally {
            this.state.isSyncing = false;
        }
    }

    /**
     * Обновление статуса в панели синхронизации
     */
    updateSyncStatus(status, message) {
        const statusElement = document.getElementById('sync-status');
        const statusTextElement = document.getElementById('sync-status-text');
        const lastSyncElement = document.getElementById('last-sync-time');

        if (statusElement && statusTextElement) {
            statusElement.className = `status-indicator ${status}`;
            statusTextElement.textContent = message;
        }

        if (lastSyncElement && this.state.lastSyncTime) {
            lastSyncElement.textContent = `Последняя синхронизация: ${this.state.lastSyncTime.toLocaleString()}`;
        }
    }

    /**
     * Запуск периодической синхронизации
     */
    startAutoSync(intervalMinutes = 60) {
        console.log(`Запуск автосинхронизации каждые ${intervalMinutes} минут`);

        // Первая синхронизация сразу
        setTimeout(() => this.syncVKToGitHub(), 2000);

        // Периодическая синхронизация
        setInterval(() => {
            this.syncVKToGitHub();
        }, intervalMinutes * 60 * 1000);
    }
}

/**
 * Функция инициализации модуля синхронизации
 */
function initVKSyncModule() {
    // Создаем экземпляр модуля только если мы на главной странице
    if (window.location.pathname.includes('index.html') ||
        window.location.pathname === '/' ||
        window.location.pathname.endsWith('pages/')) {

        console.log('Инициализация модуля синхронизации ВК...');
        window.vkSyncModule = new VKSyncModule();

        // Показываем панель синхронизации в разработке
        const syncPanel = document.getElementById('vk-sync-panel');
        if (syncPanel && window.DEV_CONFIG) {
            syncPanel.style.display = 'block';
        }

        // Запускаем автосинхронизацию (каждые 60 минут)
        window.vkSyncModule.startAutoSync(60);
    }
}

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVKSyncModule);
} else {
    initVKSyncModule();
}
