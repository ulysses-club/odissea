const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const nodeSchedule = require('node-schedule');

// Константы
const TOKEN = '7585006393:AAFttPbydsMRVtm6V7g4SixfvjS8pnNY3CU';
const ADMIN_IDS = ['1147849296', '863909091'];
const DEFAULT_MEETING = {
  date: 'Дата встречи не указана',
  time: 'Время не указано',
  place: 'Онлайн (https://telemost.yandex.ru/) / Кофейня "КиноМан" (ул. Пушкинская, 42)',
  film: 'Фильм ещё не выбран',
  director: 'Режиссёр не указан',
  genre: 'Жанр уточняется',
  country: 'Страна производства не указана',
  year: 'Год выхода неизвестен',
  poster: 'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif', // Заглушка для постера
  discussionNumber: 'Следующий номер после последнего в истории',
  description: 'После просмотра будет обсуждение с чаем/кофе и печеньками!',
  requirements: 'Рекомендуем посмотреть фильм заранее'
};

// Пути к файлам
const FILE_PATHS = {
  log: path.join(__dirname, 'bot.log'),
  subscriptions: path.join(__dirname, 'subscriptions.json'),
  voting: path.join(__dirname, 'voting.json'),
  history: path.join(__dirname, 'history.json'),
  nextMeeting: path.join(__dirname, 'next_meeting.json')
};

// Анимации
const ANIMATIONS = {
  welcome: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
  movie: 'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif',
  success: 'https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif',
  error: 'https://media.giphy.com/media/TqiwHbFBaZ4ti/giphy.gif'
};

// Инициализация бота
const bot = new TelegramBot(TOKEN, {
  polling: true,
  filepath: false,
  baseApiUrl: 'https://api.telegram.org'
});

// Логирование
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(FILE_PATHS.log, logMessage);
  console.log(logMessage);
}

// Функции работы с файлами
function loadData(fileKey, defaultValue) {
  try {
    if (!fs.existsSync(FILE_PATHS[fileKey])) {
      return defaultValue;
    }
    return JSON.parse(fs.readFileSync(FILE_PATHS[fileKey], 'utf8'));
  } catch (err) {
    log(`Ошибка загрузки ${fileKey}: ${err}`);
    return defaultValue;
  }
}

function saveData(fileKey, data) {
  try {
    fs.writeFileSync(FILE_PATHS[fileKey], JSON.stringify(data));
  } catch (err) {
    log(`Ошибка сохранения ${fileKey}: ${err}`);
  }
}

const loadSubscriptions = () => new Set(loadData('subscriptions', []));
const saveSubscriptions = (subscriptions) => saveData('subscriptions', [...subscriptions]);

const loadVoting = () => loadData('voting', {
  ratings: {},
  average: null,
  film: null,
  director: null,
  genre: null,
  year: null,
  poster: null,
  discussionNumber: null,
  date: null
});

const saveVoting = (voting) => saveData('voting', voting);
const loadHistory = () => loadData('history', []);
const saveHistory = (history) => saveData('history', history);
const loadNextMeeting = () => loadData('nextMeeting', null);
const saveNextMeeting = (meeting) => saveData('nextMeeting', meeting);

// Расчет среднего рейтинга
function calculateAverage(voting) {
  const ratings = Object.values(voting.ratings);
  if (ratings.length === 0) return null;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}

// Информация о встрече
function getMeetingInfo() {
  const nextMeeting = loadNextMeeting();
  return nextMeeting ? { ...DEFAULT_MEETING, ...nextMeeting } : DEFAULT_MEETING;
}

/**
 * 〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️
 * 🎬  КИНОКЛУБ "ОДИССЕЯ"  🎬
 * 〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️
 *
 * Форматирует информацию о фильме в привлекательное
 * объявление с иконками и HTML-разметкой
 */
function formatMovieInfo(meeting, voting) {
  const filmInfo = voting.film ? { ...meeting, ...voting } : meeting;

  const ratingBlock = voting.average
    ? `│ ⭐ <b>Рейтинг:</b> ${voting.average.toFixed(1)}/10\n` +
      `│ 👥 <b>Оценок:</b> ${Object.keys(voting.ratings).length}\n` +
      `├───────────────────────\n`
    : '';

  return `
🎬 <b>${filmInfo.film.toUpperCase()}</b>

📝 <b>О фильме:</b>
├───────────────────────
│ 🎥 <b>Режиссер:</b> ${filmInfo.director}
│ 🎭 <b>Жанр:</b> ${filmInfo.genre}
│ 🌎 <b>Страна:</b> ${filmInfo.country}
│ 📅 <b>Год:</b> ${filmInfo.year}
${ratingBlock}
🗓 <b>Дата встречи:</b> ${filmInfo.date}
⏰ <b>Время:</b> ${filmInfo.time}
📍 <b>Место:</b> ${filmInfo.place}

🔢 <b>Обсуждение №${filmInfo.discussionNumber}</b>
  `.trim();
}

// Меню
function createMenu(isAdmin) {
  const baseMenu = {
    reply_markup: JSON.stringify({
      resize_keyboard: true,
      keyboard: [
        [{ text: '🍿 Ближайшая встреча' }, { text: '📅 Моя подписка' }],
        [{ text: 'ℹ️ О клубе' }, { text: '📢 Контакты' }],
        [{ text: '📜 История оценок' }]
      ]
    })
  };

  if (isAdmin) {
    baseMenu.reply_markup = JSON.stringify({
      resize_keyboard: true,
      keyboard: [
        ...JSON.parse(baseMenu.reply_markup).keyboard,
        [{ text: '👑 Админ-панель' }]
      ]
    });
  }

  return baseMenu;
}

// Админ-панель
function createAdminPanel() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⭐ Поставить оценку фильму', callback_data: 'admin_rate_movie' }],
        [{ text: '🧹 Очистить оценки', callback_data: 'admin_clear_votes' }],
        [{ text: '📨 Разослать результаты', callback_data: 'admin_send_results' }],
        [{ text: '💾 Сохранить в историю', callback_data: 'admin_save_to_history' }],
        [{ text: '🎬 Добавить следующий фильм', callback_data: 'admin_add_next_movie' }],
        [{ text: '🔙 Назад', callback_data: 'back_to_main' }]
      ]
    }
  };
}

// Отправка информации о встрече
async function sendMeetingInfo(chatId) {
  const meeting = getMeetingInfo();
  const voting = loadVoting();
  const isAdmin = ADMIN_IDS.includes(chatId.toString());

  try {
    await bot.sendAnimation(chatId, ANIMATIONS.movie, {
      caption: '🎬 Загружаю информацию о встрече...'
    });

    const message = formatMovieInfo(meeting, voting);
    const posterUrl = voting.poster || meeting.poster;

    await bot.sendPhoto(chatId, posterUrl, {
      caption: message,
      parse_mode: 'HTML',
      ...createMenu(isAdmin)
    });
  } catch (err) {
    log(`Ошибка отправки сообщения ${chatId}: ${err}`);
    await bot.sendAnimation(chatId, ANIMATIONS.error, {
      caption: 'Ой, что-то пошло не так! Попробуйте позже.'
    });
  }
}

// Рассылка по расписанию
const weeklySchedule = nodeSchedule.scheduleJob('0 14 * * 5', async () => {
  log('Запуск еженедельной рассылки');
  const subscriptions = loadSubscriptions();

  for (const chatId of subscriptions) {
    try {
      await bot.sendChatAction(chatId, 'upload_photo');
      await sendMeetingInfo(chatId);
    } catch (err) {
      log(`Ошибка рассылки ${chatId}: ${err}`);
    }
  }
});

// Команда /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const isAdmin = ADMIN_IDS.includes(chatId.toString());

  // Рандомные гифки для приветствия
  const welcomeGifs = [
    'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', // Киноаппарат
    'https://media.giphy.com/media/l0HU20BZ6LbSEITza/giphy.gif', // Попкорн
    'https://media.giphy.com/media/xT5LMGupUKCHm7DdFu/giphy.gif', // Кинолента
    'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif'  // Фильм
  ];

  const randomGif = welcomeGifs[Math.floor(Math.random() * welcomeGifs.length)];

  try {
    await bot.sendAnimation(chatId, randomGif, {
      caption: `🎬 <b>Привет, ${msg.from.first_name}!</b> 👋\n` +
               `Я — бот кино-клуба "Одиссея", твой проводник в мир кинематографа!`,
      parse_mode: 'HTML'
    });

    await bot.sendMessage(
      chatId,
      '🍿 <b>Что я умею:</b>\n\n' +
      '🎥 <i>Рассказывать</i> о ближайших кинопоказах\n' +
      '📅 <i>Напоминать</i> о встречах (чтобы ты точно не проспал)\n' +
      '⭐ <i>Принимать</i> оценки фильмов как у настоящих кинокритиков\n' +
      '📊 <i>Показывать</i> историю наших обсуждений\n\n' +

      '✨ <b>Особенности нашего клуба:</b>\n' +
      '│ • Никаких спойлеров до обсуждения\n' +
      '│ • Можно любить даже "Самого пьяного округа в мире"\n' +
      '└ • После 3-х встреч — звание "Кино-Одиссей"\n\n' +

      '<i>"Мы не просто смотрим кино — мы его проживаем. \n' +
      'А потом спорим, стоило ли режиссеру так заканчивать фильм."</i>',
      {
        parse_mode: 'HTML',
        ...createMenu(isAdmin)
      }
    );
  } catch (err) {
    log(`Ошибка отправки /start ${chatId}: ${err}`);
  }
});

// Обработка сообщений
bot.on('message', async (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const chatId = msg.chat.id;
    const isAdmin = ADMIN_IDS.includes(chatId.toString());

    const handlers = {
      '🍿 Ближайшая встреча': () => sendMeetingInfo(chatId),
      '📅 Моя подписка': () => showSubscriptionMenu(chatId),
      'ℹ️ О клубе': () => sendAboutInfo(chatId),
      '📢 Контакты': () => sendContacts(chatId),
      '📜 История оценок': () => showHistory(chatId),
      '👑 Админ-панель': async () => {
        if (isAdmin) {
          await bot.sendMessage(chatId, 'Админ-панель:', createAdminPanel());
        } else {
          await bot.sendMessage(chatId, 'Эта функция доступна только администраторам', createMenu(isAdmin));
        }
      }
    };

    if (handlers[msg.text]) {
      await handlers[msg.text]();
    } else {
      await bot.sendMessage(
        chatId,
        'Используй меню для навигации 😉',
        createMenu(isAdmin)
      );
    }
  }
});

// Показать историю оценок (последние 3 по количеству участников)
async function showHistory(chatId) {
  try {
    let history = loadHistory();
    const isAdmin = ADMIN_IDS.includes(chatId.toString());

    if (!history || history.length === 0) {
      return await bot.sendMessage(
        chatId,
        'История оценок пока пуста.',
        createMenu(isAdmin)
      );
    }

    // Сортируем по убыванию количества участников
    const sortedHistory = [...history].sort((a, b) => b.participants - a.participants);
    const topHistory = sortedHistory.slice(0, 3);

    // Отправляем топ-3 фильма
    for (const item of topHistory) {
      const message = `📜 <b>История оценок:</b>\n\n` +
        `🎥 <b>${escapeHtml(item.film)}</b>\n` +
        `👥 <b>Участников:</b> ${item.participants}\n` +
        `⭐ <b>Средняя оценка:</b> ${item.average?.toFixed(1) || 'N/A'}/10\n` +
        `📅 ${item.date ? new Date(item.date).toLocaleDateString() : 'дата неизвестна'}\n` +
        `🎭 ${item.genre || 'жанр не указан'}`;

      try {
        if (item.poster) {
          await bot.sendPhoto(chatId, item.poster, {
            caption: message,
            parse_mode: 'HTML'
          });
        } else {
          await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        }
      } catch (err) {
        log(`Ошибка отправки постера ${item.film}: ${err}`);
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
      }
    }

    // Добавляем информацию о количестве записей
    await bot.sendMessage(
      chatId,
      `Показаны топ-3 обсуждения из ${history.length}.\n` +
      `${isAdmin ? 'Вы можете просмотреть полную историю совсем скоро.' : 'Функционал в разработке.'}`,
      createMenu(isAdmin)
    );

  } catch (error) {
    log(`Ошибка в showHistory: ${error}`);
    await bot.sendMessage(chatId, 'Произошла ошибка при загрузке истории оценок.');
  }
}

// Вспомогательная функция для экранирования HTML
function escapeHtml(text) {
  return text.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Показать меню подписки
async function showSubscriptionMenu(chatId) {
  const subscriptions = loadSubscriptions();
  const isSubscribed = subscriptions.has(chatId.toString());

  await bot.sendMessage(
    chatId,
    isSubscribed
      ? 'Ты подписан на рассылку о встречах клуба! 🎉'
      : 'Ты не подписан на уведомления о встречах 😔',
    {
      reply_markup: {
        inline_keyboard: [
          [{
            text: isSubscribed ? '❌ Отписаться' : '✅ Подписаться',
            callback_data: isSubscribed ? 'unsubscribe' : 'subscribe'
          }],
          [{ text: '🔙 Назад', callback_data: 'back_to_main' }]
        ]
      }
    }
  );
}

// Обработка callback-запросов
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const isAdmin = ADMIN_IDS.includes(chatId.toString());

  try {
    if (query.data.startsWith('admin_')) {
      if (!isAdmin) {
        return await bot.answerCallbackQuery(query.id, { text: 'Эта функция только для администратора' });
      }

      const meeting = getMeetingInfo();
      const voting = loadVoting();

      const adminHandlers = {
        'admin_rate_movie': async () => {
          if (!voting.film) {
            voting.film = meeting.film;
            voting.director = meeting.director;
            voting.genre = meeting.genre;
            voting.year = meeting.year;
            voting.poster = meeting.poster;
            voting.discussionNumber = meeting.discussionNumber;
            voting.date = meeting.date;
            saveVoting(voting);
          }

          const keyboard = {
            reply_markup: {
              inline_keyboard: [
                [{ text: '1', callback_data: 'admin_rate_1' }, { text: '2', callback_data: 'admin_rate_2' }, { text: '3', callback_data: 'admin_rate_3' }],
                [{ text: '4', callback_data: 'admin_rate_4' }, { text: '5', callback_data: 'admin_rate_5' }, { text: '6', callback_data: 'admin_rate_6' }],
                [{ text: '7', callback_data: 'admin_rate_7' }, { text: '8', callback_data: 'admin_rate_8' }, { text: '9', callback_data: 'admin_rate_9' }],
                [{ text: '10', callback_data: 'admin_rate_10' }],
                [{ text: '✅ Завершить ввод оценок', callback_data: 'admin_finish_rating' }],
                [{ text: '🔙 Назад', callback_data: 'back_to_admin' }]
              ]
            }
          };

          let message = 'Выберите оценку для текущего фильма:';
          if (voting.average) {
            message += `\n\nТекущий средний рейтинг: ${voting.average.toFixed(1)}/10`;
            message += `\nКоличество оценок: ${Object.keys(voting.ratings).length}`;
          }

          await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: keyboard.reply_markup
          });
        },
        'admin_finish_rating': async () => {
          if (Object.keys(voting.ratings).length === 0) {
            await bot.answerCallbackQuery(query.id, { text: 'Вы не поставили ни одной оценки!' });
            return;
          }

          await bot.editMessageText(`✅ Ввод оценок завершен!\n\n${formatMovieInfo(meeting, voting)}`, {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '⭐ Продолжить ввод оценок', callback_data: 'admin_rate_movie' }],
                [{ text: '🔙 Назад в админ-панель', callback_data: 'back_to_admin' }]
              ]
            }
          });
        },
        'back_to_admin': async () => {
          await bot.editMessageText('Админ-панель:', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: createAdminPanel().reply_markup
          });
        },
        'admin_clear_votes': async () => {
          voting.ratings = {};
          voting.average = null;
          saveVoting(voting);

          await bot.answerCallbackQuery(query.id, { text: 'Результаты очищены!' });
          await bot.editMessageText('🧹 Все результаты голосования очищены.', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: createAdminPanel().reply_markup
          });
        },
        'admin_send_results': async () => {
          if (!voting.ratings || Object.keys(voting.ratings).length === 0) {
            return await bot.answerCallbackQuery(query.id, { text: 'Нет результатов для рассылки' });
          }

          const currentRatings = Object.values(voting.ratings);
          const average = currentRatings.reduce((a, b) => a + b, 0) / currentRatings.length;
          const subscriptions = loadSubscriptions();
          let sentCount = 0;

          for (const subChatId of subscriptions) {
            try {
              await bot.sendMessage(
                subChatId,
                `⭐ <b>Результаты голосования:</b>\n\n` +
                `Фильм: ${voting.film}\n` +
                `Средняя оценка: ${average.toFixed(1)}/10\n` +
                `Количество участников: ${currentRatings.length}\n\n` +
                `Спасибо за участие!`,
                { parse_mode: 'HTML' }
              );
              sentCount++;
            } catch (err) {
              log(`Ошибка рассылки результатов ${subChatId}: ${err}`);
            }
          }

          await bot.answerCallbackQuery(query.id, { text: `Результаты отправлены ${sentCount} подписчикам` });
          await bot.editMessageText(`✅ Результаты голосования разосланы ${sentCount} подписчикам`, {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: createAdminPanel().reply_markup
          });
        },
        'admin_save_to_history': async () => {
          if (!voting.average || !voting.film) {
            return await bot.answerCallbackQuery(query.id, { text: 'Нет данных для сохранения' });
          }

          const history = loadHistory();
          history.push({
            film: voting.film,
            genre: voting.genre,
            average: voting.average,
            participants: Object.keys(voting.ratings).length,
            date: new Date().toISOString(),
            poster: voting.poster
          });
          saveHistory(history);

          await bot.answerCallbackQuery(query.id, { text: 'Результаты сохранены в историю!' });
          await bot.editMessageText('✅ Результаты голосования сохранены в историю.', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: createAdminPanel().reply_markup
          });
        },
        'admin_add_next_movie': async () => {
          await bot.answerCallbackQuery(query.id);
          await bot.editMessageText('Введите информацию о следующем фильме в формате:\n\n' +
            '<b>Дата|Время|Место|Название фильма|Режиссер|Жанр|Страна|Год|URL постера|Номер обсуждения</b>\n\n' +
            'Пример:\n' +
            '20.07.2025|15:00|Кофейня "Том Сойер"|"Интерстеллар"|"Кристофер Нолан"|"фантастика, драма"|"США"|"2014"|"https://example.com/poster.jpg"|"16"', {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: 'HTML'
          });

          bot.once('message', async (msg) => {
            if (msg.from.id.toString() === chatId.toString()) {
              const parts = msg.text.split('|').map(part => part.trim());
              if (parts.length === 10) {
                const [date, time, place, film, director, genre, country, year, poster, discussionNumber] = parts;
                saveNextMeeting({
                  date,
                  time,
                  place,
                  film,
                  director,
                  genre,
                  country,
                  year,
                  poster,
                  discussionNumber
                });
                await bot.sendMessage(chatId, '✅ Информация о следующем фильме сохранена!', createMenu(isAdmin));
              } else {
                await bot.sendMessage(chatId, '❌ Неверный формат. Попробуйте снова.', createMenu(isAdmin));
              }
            }
          });
        }
      };

      if (query.data.startsWith('admin_rate_') && query.data !== 'admin_rate_movie') {
        const rating = parseInt(query.data.split('_')[2]);
        const participantId = `user_${Object.keys(voting.ratings).length + 1}`;

        voting.ratings[participantId] = rating;
        voting.average = calculateAverage(voting);
        saveVoting(voting);

        await bot.answerCallbackQuery(query.id, { text: `Оценка ${rating} сохранена!` });

        let message = `✅ Оценка ${rating} добавлена!\n\n`;
        message += `Текущий средний рейтинг: ${voting.average.toFixed(1)}/10\n`;
        message += `Количество оценок: ${Object.keys(voting.ratings).length}\n\n`;
        message += 'Выберите следующую оценку или завершите ввод:';

        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: '1', callback_data: 'admin_rate_1' }, { text: '2', callback_data: 'admin_rate_2' }, { text: '3', callback_data: 'admin_rate_3' }],
              [{ text: '4', callback_data: 'admin_rate_4' }, { text: '5', callback_data: 'admin_rate_5' }, { text: '6', callback_data: 'admin_rate_6' }],
              [{ text: '7', callback_data: 'admin_rate_7' }, { text: '8', callback_data: 'admin_rate_8' }, { text: '9', callback_data: 'admin_rate_9' }],
              [{ text: '10', callback_data: 'admin_rate_10' }],
              [{ text: '✅ Завершить ввод оценок', callback_data: 'admin_finish_rating' }],
              [{ text: '🔙 Назад', callback_data: 'back_to_admin' }]
            ]
          }
        });
      } else if (adminHandlers[query.data]) {
        await adminHandlers[query.data]();
      }
    } else {
      const userHandlers = {
        'subscribe': async () => {
          const subscriptions = loadSubscriptions();
          subscriptions.add(chatId.toString());
          saveSubscriptions(subscriptions);
          await bot.answerCallbackQuery(query.id, { text: '✅ Вы подписались!' });
          await bot.editMessageText('🎉 Теперь ты будешь получать уведомления о встречах!', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Назад', callback_data: 'back_to_main' }]
              ]
            }
          });
        },
        'unsubscribe': async () => {
          const subscriptions = loadSubscriptions();
          subscriptions.delete(chatId.toString());
          saveSubscriptions(subscriptions);
          await bot.answerCallbackQuery(query.id, { text: '❌ Вы отписались' });
          await bot.editMessageText('Теперь ты не будешь получать уведомления 😢', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Назад', callback_data: 'back_to_main' }]
              ]
            }
          });
        },
        'back_to_main': async () => {
          await bot.deleteMessage(chatId, query.message.message_id);
          await bot.sendMessage(
            chatId,
            'Выбери действие:',
            createMenu(isAdmin)
          );
        }
      };

      if (userHandlers[query.data]) {
        await userHandlers[query.data]();
      }
    }
  } catch (err) {
    log(`Ошибка обработки callback ${chatId}: ${err}`);
    await bot.sendAnimation(chatId, ANIMATIONS.error, {
      caption: 'Произошла ошибка, попробуйте снова'
    });
  }
});

// Команды админа
bot.onText(/\/notify (.+)/, async (msg, match) => {
  if (!ADMIN_IDS.includes(msg.from.id.toString())) {
    return bot.sendMessage(msg.chat.id, '🚫 Эта команда только для администраторов');
  }

  const message = match[1];
  const subscriptions = loadSubscriptions();
  let sentCount = 0;

  await bot.sendChatAction(msg.chat.id, 'typing');

  for (const chatId of subscriptions) {
    try {
      await bot.sendMessage(chatId, `📢 <b>Важное объявление:</b>\n\n${message}\n\n<i>С любовью, ваш кино-клуб</i>`, {
        parse_mode: 'HTML'
      });
      sentCount++;
    } catch (err) {
      log(`Ошибка рассылки ${chatId}: ${err}`);
    }
  }

  await bot.sendAnimation(msg.chat.id, ANIMATIONS.success, {
    caption: `✅ Сообщение отправлено ${sentCount} подписчикам`
  });
});

bot.onText(/\/subscribers/, (msg) => {
  if (!ADMIN_IDS.includes(msg.from.id.toString())) {
    return bot.sendMessage(msg.chat.id, '🚫 Только для администратора');
  }

  const subscriptions = loadSubscriptions();
  bot.sendMessage(
    msg.chat.id,
    `📊 Всего подписчиков: ${subscriptions.size}\n` +
    `👥 Список: ${[...subscriptions].join(', ')}`,
    { parse_mode: 'HTML' }
  );
});

// Вспомогательные функции
async function sendAboutInfo(chatId) {
  await bot.sendMessage(
    chatId,
    '🎬 <b>Кино-клуб "Одиссея" — где попкорн менее важен, чем мнение</b>\n\n' +
    'Мы — это стая киноголиков, которые:\n' +
    '🍿 Каждую неделю устраивают кибер-посиделки с обсуждением одной картины\n' +
    '🤔 Серьезно спорят, был ли "Человек ластик" лучше "Интерстеллара"\n' +
    '😭 Плачут над "Амели", а через минуту ржут над "Боратом"\n\n' +

    '🔍 <b>Наш формат:</b>\n' +
    '│ Каждые выходные встречаемся в кафе\n' +
    '│ Сначала смотрим фильм дома\n' +
    '│ Потом встречаемся в уютной кофейне, за частую "Том Сойер"\n' +
    '│ Разбираем фильм на молекулы (но не как Терминатор)\n' +
    '└ Ставим оценки как настоящие кинокритики\n\n' +

    '🎯 <b>Почему мы?</b>\n' +
    '• Никаких спойлеров до обсуждения (нарушителей кормим попкорном без масла)\n' +
    '• Можно ненавидеть "Титаник" и обожать "Дом, который построил Джек"\n' +
    '• После третьей встречи получаешь пожизненный титул "Кино-Одиссей"\n\n' +

    '📌 <b>Философия в двух кадрах:</b>\n' +
    '"Мы не просто смотрим кино — мы проживаем его. \n' +
    'А потом ругаем режиссера за плохую концовку."\n\n' +

    'P.S. Первое правило клуба — всегда говорить о клубе!',
    {
      parse_mode: 'HTML',
      ...createMenu(ADMIN_IDS.includes(chatId.toString()))
    }
  );

  // Добавляем гифку для настроения
  await bot.sendAnimation(chatId, 'https://media.giphy.com/media/l0HU7JI1QOdX2FO2Q/giphy.gif', {
    caption: 'Так выглядит наш клуб после третьего часа обсуждения "Начала" Нолана'
  });
}

async function sendContacts(chatId) {
  await bot.sendMessage(
    chatId,
    '📬 <b>Контакты организаторов:</b>\n\n' +
    `• <b>Админ бота:</b>  @GeekLS\n` +
    `• <b>Босс:</b>  <a href="https://vk.com/id8771550">Настенька</a>\n` +
    `• <b>Телефон:</b>  +7 (978)73 63 212\n` +
    `• <b>Наш сайт:</b> <a href="https://stas18.github.io/ulysses_club/">КИНОКЛУБ ОДИССЕЯ</a>\n` +
    'Пишите по любым вопросам!',
    {
      parse_mode: 'HTML',
      ...createMenu(ADMIN_IDS.includes(chatId.toString()))
    }
  );
}

log('🎬 Бот запущен и готов к киномании!');