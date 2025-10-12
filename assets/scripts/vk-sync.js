/**
 * Скрипт для синхронизации ВК с GitHub через GitHub Actions
 */
const fs = require('fs');
const path = require('path');

class VKSyncAction {
    constructor() {
        this.config = {
            vk: {
                accessToken: process.env.VK_ACCESS_TOKEN,
                groupId: process.env.VK_GROUP_ID || -232406584,
                apiVersion: '5.131'
            },
            dataPath: path.join(__dirname, '../assets/data/next-meeting.json')
        };
    }

    async getLatestVKPost() {
        const url = 'https://api.vk.com/method/wall.get';
        const params = new URLSearchParams({
            owner_id: this.config.vk.groupId,
            count: 1,
            filter: 'owner',
            access_token: this.config.vk.accessToken,
            v: this.config.vk.apiVersion
        });

        const response = await fetch(url + '?' + params);
        const data = await response.json();

        if (data.error) {
            throw new Error(`VK API Error: ${data.error.error_msg}`);
        }

        return data.response?.items?.[0] || null;
    }

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

        console.log('Парсим пост:', postText.substring(0, 200) + '...');

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

        // Валидация обязательных полей
        if (!this.validateMeetingData(data)) {
            console.warn('В данных отсутствуют обязательные поля');
        }

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

    async sync() {
        try {
            console.log('Starting VK to GitHub sync...');

            const post = await this.getLatestVKPost();
            if (!post) {
                console.log('No posts found');
                return false;
            }

            console.log('Found post:', {
                id: post.id,
                date: new Date(post.date * 1000).toISOString(),
                text: post.text.substring(0, 100) + '...'
            });

            const meetingData = this.parsePostData(post.text);
            console.log('Parsed meeting data:', meetingData);

            // Проверяем, есть ли существенные изменения
            if (fs.existsSync(this.config.dataPath)) {
                const existingData = JSON.parse(fs.readFileSync(this.config.dataPath, 'utf8'));
                if (JSON.stringify(existingData) === JSON.stringify(meetingData)) {
                    console.log('No changes detected, skipping update');
                    return true;
                }
            }

            // Сохраняем в файл
            fs.writeFileSync(
                this.config.dataPath,
                JSON.stringify(meetingData, null, 2)
            );

            console.log('Data saved successfully');
            return true;

        } catch (error) {
            console.error('Sync failed:', error);
            return false;
        }
    }
}

// Запуск синхронизации
if (require.main === module) {
    const sync = new VKSyncAction();
    sync.sync().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = VKSyncAction;
