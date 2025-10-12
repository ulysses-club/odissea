/**
 * Модуль для синхронизации постов ВК с GitHub
 */
class VKSyncModule {
    constructor() {
        this.config = {
            vk: {
                accessToken: '',
                groupId: -232406584,
                apiVersion: '5.131'
            },
            github: {
                token: '',
                owner: 'ulysses-club',
                repo: 'odissea',
                path: 'assets/data/next-meeting.json'
            }
        };

        this.state = {
            lastProcessedPostId: null,
            isSyncing: false,
            isConfigured: false
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
            this.startAutoSync(60);
        } else {
            console.warn('VK Sync Module: Токены не настроены. Используется локальный режим.');
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

        // Парсинг различных форматов данных
        const patterns = {
            date: /дата[:\s]*([^\n\r]+)/i,
            time: /время[:\s]*([^\n\r]+)/i,
            place: /место[:\s]*([^\n\r]+)/i,
            film: /фильм[:\s]*([^\n\r]+)/i,
            director: /режисс[ёе]р[:\s]*([^\n\r]+)/i,
            genre: /жанр[:\s]*([^\n\r]+)/i,
            country: /страна[:\s]*([^\n\r]+)/i,
            year: /год[:\s]*(\d{4})/i,
            cast: /в ролях[:\s]*([^\n\r]+)/i,
            requirements: /рекомендации[:\s]*([^\n\r]+)/i
        };

        Object.keys(patterns).forEach(key => {
            const match = postText.match(patterns[key]);
            if (match && match[1]) {
                data[key] = match[1].trim();
            }
        });

        // Извлечение номера обсуждения
        const discussionMatch = postText.match(/обсуждение\s*#?(\d+)/i);
        if (discussionMatch) {
            data.discussionNumber = discussionMatch[1];
        }

        // Извлечение постера (ссылка на изображение)
        const posterMatch = postText.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif))/i);
        if (posterMatch) {
            data.poster = posterMatch[1];
        }

        return data;
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
                    'User-Agent': 'VK-Sync-Module'
                }
            });

            let currentSha = '';

            if (getResponse.ok) {
                const fileData = await getResponse.json();
                currentSha = fileData.sha;
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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!updateResponse.ok) {
                throw new Error(`GitHub API error: ${updateResponse.status}`);
            }

            console.log('Файл успешно обновлен на GitHub');
            return true;

        } catch (error) {
            console.error('Ошибка обновления файла на GitHub:', error);
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

        try {
            console.log('Начинаем синхронизацию ВК -> GitHub...');

            // Получаем последний пост
            const post = await this.getLatestVKPost();
            if (!post) {
                console.log('Посты не найдены');
                return false;
            }

            // Проверяем, не обрабатывали ли мы уже этот пост
            if (this.state.lastProcessedPostId === post.id) {
                console.log('Пост уже обработан ранее');
                return false;
            }

            console.log('Найден пост:', post.text.substring(0, 100) + '...');

            // Парсим данные из поста
            const meetingData = this.parsePostData(post.text);
            console.log('Извлеченные данные:', meetingData);

            // Обновляем файл на GitHub
            const success = await this.updateGitHubFile(meetingData);

            if (success) {
                this.state.lastProcessedPostId = post.id;
                console.log('Синхронизация завершена успешно!');
                return true;
            }

            return false;

        } catch (error) {
            console.error('Ошибка синхронизации:', error);
            return false;
        } finally {
            this.state.isSyncing = false;
        }
    }

    /**
     * Запуск периодической синхронизации
     */
    startAutoSync(intervalMinutes = 60) {
        console.log(`Запуск автосинхронизации каждые ${intervalMinutes} минут`);

        // Первая синхронизация сразу
        this.syncVKToGitHub();

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