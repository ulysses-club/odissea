const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const nodeSchedule = require('node-schedule');

// Настройка логов
const logFile = path.join(__dirname, 'bot.log');
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(logMessage);
}

// Конфигурация
const TOKEN = '7585006393:AAFttPbydsMRVtm6V7g4SixfvjS8pnNY3CU';
const ADMIN_IDS = ['1147849296', '7644957461']; // Добавлен второй админ
const SUBSCRIPTIONS_FILE = path.join(__dirname, 'subscriptions.json');
const VOTING_FILE = path.join(__dirname, 'voting.json');
const HISTORY_FILE = path.join(__dirname, 'history.json');
const NEXT_MEETING_FILE = path.join(__dirname, 'next_meeting.json'); // Файл для следующей встречи

// Инициализация бота с опциями
const bot = new TelegramBot(TOKEN, {
  polling: true,
  filepath: false,
  baseApiUrl: 'https://api.telegram.org'
});

// Анимации
const animations = {
  welcome: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
  movie: 'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif',
  success: 'https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif',
  error: 'https://media.giphy.com/media/TqiwHbFBaZ4ti/giphy.gif',
  voting: 'https://media.giphy.com/media/l0HU7JI1nzKC7kUaI/giphy.gif'
};

// Загрузка/сохранение данных
function loadSubscriptions() {
  try {
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
      return new Set();
    }
    const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8');
    return new Set(JSON.parse(data));
  } catch (err) {
    log(`Ошибка загрузки подписок: ${err}`);
    return new Set();
  }
}

function saveSubscriptions(subscriptions) {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify([...subscriptions]));
  } catch (err) {
    log(`Ошибка сохранения подписок: ${err}`);
  }
}

function loadVoting() {
  try {
    if (!fs.existsSync(VOTING_FILE)) {
      return {
        active: false,
        startTime: null,
        endTime: null,
        ratings: {},
        average: null,
        film: null,
        genre: null,
        poster: null
      };
    }
    return JSON.parse(fs.readFileSync(VOTING_FILE, 'utf8'));
  } catch (err) {
    log(`Ошибка загрузки голосования: ${err}`);
    return {
      active: false,
      startTime: null,
      endTime: null,
      ratings: {},
      average: null,
      film: null,
      genre: null,
      poster: null
    };
  }
}

function saveVoting(voting) {
  try {
    fs.writeFileSync(VOTING_FILE, JSON.stringify(voting));
  } catch (err) {
    log(`Ошибка сохранения голосования: ${err}`);
  }
}

function loadHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch (err) {
    log(`Ошибка загрузки истории: ${err}`);
    return [];
  }
}

function saveHistory(history) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history));
  } catch (err) {
    log(`Ошибка сохранения истории: ${err}`);
  }
}

function loadNextMeeting() {
  try {
    if (!fs.existsSync(NEXT_MEETING_FILE)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(NEXT_MEETING_FILE, 'utf8'));
  } catch (err) {
    log(`Ошибка загрузки следующей встречи: ${err}`);
    return null;
  }
}

function saveNextMeeting(meeting) {
  try {
    fs.writeFileSync(NEXT_MEETING_FILE, JSON.stringify(meeting));
  } catch (err) {
    log(`Ошибка сохранения следующей встречи: ${err}`);
  }
}

// Информация о встрече
function getMeetingInfo() {
  const nextMeeting = loadNextMeeting();

  if (nextMeeting) {
    return {
      date: nextMeeting.date || '13.07.2025',
      time: nextMeeting.time || '15:00',
      place: nextMeeting.place || 'Кофейня "Том Сойер", ул. Шмидта, 12',
      film: nextMeeting.film || 'Amores perros',
      director: nextMeeting.director || 'Алехандро Гонсалес Иньярриту',
      genre: nextMeeting.genre || 'триллер, драма, криминал',
      country: nextMeeting.country || 'Мексика',
      year: nextMeeting.year || '2000',
      poster: nextMeeting.poster || 'https://sun9-77.userapi.com/s/v1/ig2/Q91kMgxR5t6YrRGSs3bx2uFJjj98U4Gl0JYTY-DWHmJe7gKzIQLw842yglmdJlLcqyWlE_TmHxDCwB8ER5HZPW5G.jpg?quality=95&as=32x44,48x66,72x99,108x148,160x219,240x329,360x494,480x658,540x741,640x878,720x988,729x1000&from=bu&cs=729x0',
      discussionNumber: nextMeeting.discussionNumber || '15'
    };
  }

  return {
    date: '13.07.2025',
    time: '15:00',
    place: 'Кофейня "Том Сойер", ул. Шмидта, 12',
    film: 'Amores perros',
    director: 'Алехандро Гонсалес Иньярриту',
    genre: 'триллер, драма, криминал',
    country: 'Мексика',
    year: '2000',
    poster: 'https://sun9-77.userapi.com/s/v1/ig2/Q91kMgxR5t6YrRGSs3bx2uFJjj98U4Gl0JYTY-DWHmJe7gKzIQLw842yglmdJlLcqyWlE_TmHxDCwB8ER5HZPW5G.jpg?quality=95&as=32x44,48x66,72x99,108x148,160x219,240x329,360x494,480x658,540x741,640x878,720x988,729x1000&from=bu&cs=729x0',
    discussionNumber: '15'
  };
}

// Меню
function createMainMenu() {
  return {
    reply_markup: JSON.stringify({
      resize_keyboard: true,
      keyboard: [
        [{ text: '🍿 Ближайшая встреча' }, { text: '📅 Моя подписка' }],
        [{ text: 'ℹ️ О клубе' }, { text: '📢 Контакты' }],
        [{ text: '⭐ Оценить фильм' }, { text: '📜 История оценок' }]
      ]
    })
  };
}

function createAdminMenu() {
  return {
    reply_markup: JSON.stringify({
      resize_keyboard: true,
      keyboard: [
        [{ text: '🍿 Ближайшая встреча' }, { text: '📅 Моя подписка' }],
        [{ text: 'ℹ️ О клубе' }, { text: '📢 Контакты' }],
        [{ text: '⭐ Оценить фильм' }, { text: '📜 История оценок' }],
        [{ text: '👑 Админ-панель' }]
      ]
    })
  };
}

// Админ-панель
function createAdminPanel() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Начать голосование', callback_data: 'admin_start_vote' }],
        [{ text: '🛑 Остановить голосование', callback_data: 'admin_stop_vote' }],
        [{ text: '🧹 Очистить результаты', callback_data: 'admin_clear_votes' }],
        [{ text: '📊 Результаты голосования', callback_data: 'admin_vote_results' }],
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

  try {
    await bot.sendAnimation(chatId, animations.movie, {
      caption: '🎬 Загружаю информацию о встрече...'
    });

    let message = `🎬 <b>Ближайшая встреча кино-клуба:</b>\n\n` +
      `📅 <b>Дата и время:</b> ${meeting.date} в ${meeting.time}\n` +
      `📍 <b>Место:</b> <a href="https://maps.google.com/?q=${encodeURIComponent(meeting.place)}">${meeting.place}</a>\n` +
      `🎥 <b>Фильм:</b> ${meeting.film}\n` +
      `🎬 <b>Режиссер:</b> ${meeting.director}\n` +
      `🎭 <b>Жанр:</b> ${meeting.genre}\n` +
      `🌍 <b>Страна:</b> ${meeting.country}\n` +
      `📅 <b>Год:</b> ${meeting.year}\n` +
      `🔢 <b>Обсуждение №:</b> ${meeting.discussionNumber}\n\n` +
      `Не забудьте посмотреть фильм заранее!`;

    if (voting.active) {
      message += `\n\n⭐ <b>Идет голосование!</b> Вы можете оценить фильм от 1 до 10 баллов.`;
      if (voting.endTime) {
        const endDate = new Date(voting.endTime);
        message += `\nГолосование завершится ${endDate.toLocaleString()}`;
      }
    } else if (voting.average) {
      message += `\n\n⭐ <b>Средняя оценка фильма:</b> ${voting.average.toFixed(1)}/10`;
    }

    await bot.sendPhoto(chatId, meeting.poster, {
      caption: message,
      parse_mode: 'HTML',
      ...(ADMIN_IDS.includes(chatId.toString()) ? createAdminMenu() : createMainMenu())
    });
  } catch (err) {
    log(`Ошибка отправки сообщения ${chatId}: ${err}`);
    await bot.sendAnimation(chatId, animations.error, {
      caption: 'Ой, что-то пошло не так! Попробуйте позже.'
    });
  }
}

// Рассылка по расписанию (каждую пятницу в 14:00)
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

  try {
    await bot.sendAnimation(chatId, animations.welcome, {
      caption: `Привет, ${msg.from.first_name}! 👋\nЯ бот кино-клуба 'Одиссея'!`
    });

    await bot.sendMessage(
      chatId,
      '🎥 Я помогу тебе:\n' +
      '• Узнать о ближайших встречах\n' +
      '• Подписаться на уведомления\n' +
      '• Получать напоминания о фильмах\n' +
      '• Оценивать просмотренные фильмы\n\n' +
      'Выбери действие:',
      ADMIN_IDS.includes(chatId.toString()) ? createAdminMenu() : createMainMenu()
    );
  } catch (err) {
    log(`Ошибка отправки /start ${chatId}: ${err}`);
  }
});

// Обработка сообщений
bot.on('message', async (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const chatId = msg.chat.id;

    switch(msg.text) {
      case '🍿 Ближайшая встреча':
        await sendMeetingInfo(chatId);
        break;
      case '📅 Моя подписка':
        await showSubscriptionMenu(chatId);
        break;
      case 'ℹ️ О клубе':
        await sendAboutInfo(chatId);
        break;
      case '📢 Контакты':
        await sendContacts(chatId);
        break;
      case '⭐ Оценить фильм':
        await showRatingMenu(chatId);
        break;
      case '📜 История оценок':
        await showHistory(chatId);
        break;
      case '👑 Админ-панель':
        if (ADMIN_IDS.includes(chatId.toString())) {
          await bot.sendMessage(chatId, 'Админ-панель:', createAdminPanel());
        } else {
          await bot.sendMessage(chatId, 'Эта функция доступна только администраторам', createMainMenu());
        }
        break;
      default:
        await bot.sendMessage(
          chatId,
          'Используй меню для навигации 😉',
          ADMIN_IDS.includes(chatId.toString()) ? createAdminMenu() : createMainMenu()
        );
    }
  }
});

// Показать историю оценок
async function showHistory(chatId) {
  const history = loadHistory();

  if (history.length === 0) {
    return await bot.sendMessage(
      chatId,
      'История оценок пока пуста.',
      ADMIN_IDS.includes(chatId.toString()) ? createAdminMenu() : createMainMenu()
    );
  }

  let message = '📜 <b>История оценок фильмов:</b>\n\n';
  for (const item of history) {
    message += `🎥 <b>${item.film}</b>\n` +
               `📅 ${new Date(item.date).toLocaleDateString()}\n` +
               `⭐ Средняя оценка: ${item.average.toFixed(1)}/10\n` +
               `👥 Участников: ${item.participants}\n` +
               `🎭 ${item.genre}\n\n`;

    try {
      await bot.sendPhoto(chatId, item.poster, {
        caption: message,
        parse_mode: 'HTML'
      });
      message = ''; // Сбрасываем сообщение после отправки
    } catch (err) {
      log(`Ошибка отправки постера ${item.film}: ${err}`);
      // Если не удалось отправить постер, отправляем просто текст
      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
      message = '';
    }
  }

  await bot.sendMessage(
    chatId,
    'Выберите действие:',
    ADMIN_IDS.includes(chatId.toString()) ? createAdminMenu() : createMainMenu()
  );
}

// Показать меню оценки
async function showRatingMenu(chatId) {
  const voting = loadVoting();
  const meeting = getMeetingInfo();
  const userRating = voting.ratings[chatId];

  if (!voting.active) {
    return await bot.sendMessage(
      chatId,
      voting.average
        ? `Голосование завершено. Средняя оценка фильма "${meeting.film}": ${voting.average.toFixed(1)}/10`
        : 'Голосование еще не начато. Администратор должен запустить оценку фильма.',
      ADMIN_IDS.includes(chatId.toString()) ? createAdminMenu() : createMainMenu()
    );
  }

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '1', callback_data: 'rate_1' }, { text: '2', callback_data: 'rate_2' }, { text: '3', callback_data: 'rate_3' }],
        [{ text: '4', callback_data: 'rate_4' }, { text: '5', callback_data: 'rate_5' }, { text: '6', callback_data: 'rate_6' }],
        [{ text: '7', callback_data: 'rate_7' }, { text: '8', callback_data: 'rate_8' }, { text: '9', callback_data: 'rate_9' }],
        [{ text: '10', callback_data: 'rate_10' }],
        [{ text: '🔙 Назад', callback_data: 'back_to_main' }]
      ]
    }
  };

  await bot.sendMessage(
    chatId,
    userRating
      ? `Вы уже оценили фильм "${meeting.film}" на ${userRating} баллов. Хотите изменить оценку?`
      : `Оцените фильм "${meeting.film}" по шкале от 1 до 10 баллов:`,
    keyboard
  );
}

// Показать меню подписки
async function showSubscriptionMenu(chatId) {
  const subscriptions = loadSubscriptions();
  const isSubscribed = subscriptions.has(chatId.toString());

  const keyboard = {
    inline_keyboard: [
      [{
        text: isSubscribed ? '❌ Отписаться' : '✅ Подписаться',
        callback_data: isSubscribed ? 'unsubscribe' : 'subscribe'
      }],
      [{ text: '🔙 Назад', callback_data: 'back_to_main' }]
    ]
  };

  await bot.sendMessage(
    chatId,
    isSubscribed
      ? 'Ты подписан на рассылку о встречах клуба! 🎉'
      : 'Ты не подписан на уведомления о встречах 😔',
    { reply_markup: keyboard }
  );
}

// Обработка callback-запросов
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const subscriptions = loadSubscriptions();
  const voting = loadVoting();

  try {
    if (query.data.startsWith('rate_')) {
      if (!voting.active) {
        return await bot.answerCallbackQuery(query.id, { text: 'Голосование завершено!' });
      }

      const rating = parseInt(query.data.split('_')[1]);
      voting.ratings[chatId] = rating;
      saveVoting(voting);

      await bot.answerCallbackQuery(query.id, { text: `Вы поставили оценку ${rating} баллов!` });
      await bot.editMessageText(`Спасибо за вашу оценку! Вы поставили ${rating} баллов фильму.`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад', callback_data: 'back_to_main' }]
          ]
        }
      });
    } else if (query.data.startsWith('admin_')) {
      if (!ADMIN_IDS.includes(chatId.toString())) {
        return await bot.answerCallbackQuery(query.id, { text: 'Эта функция только для администратора' });
      }

      const meeting = getMeetingInfo();

      switch(query.data) {
        case 'admin_start_vote':
          voting.active = true;
          voting.startTime = new Date().toISOString();
          voting.endTime = null;
          voting.ratings = {};
          voting.average = null;
          voting.film = meeting.film;
          voting.genre = meeting.genre;
          voting.poster = meeting.poster;
          saveVoting(voting);

          await bot.answerCallbackQuery(query.id, { text: 'Голосование начато!' });
          await bot.editMessageText('✅ Голосование начато! Подписчики могут оценивать фильм.', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: createAdminPanel().reply_markup
          });
          break;

        case 'admin_stop_vote':
          voting.active = false;
          voting.endTime = new Date().toISOString();

          // Подсчет средней оценки
          const ratings = Object.values(voting.ratings);
          if (ratings.length > 0) {
            const sum = ratings.reduce((a, b) => a + b, 0);
            voting.average = sum / ratings.length;
          }

          saveVoting(voting);

          await bot.answerCallbackQuery(query.id, { text: 'Голосование остановлено!' });
          await bot.editMessageText('🛑 Голосование остановлено. Подписчики больше не могут оценивать фильм.', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: createAdminPanel().reply_markup
          });
          break;

        case 'admin_clear_votes':
          voting.ratings = {};
          voting.average = null;
          saveVoting(voting);

          await bot.answerCallbackQuery(query.id, { text: 'Результаты очищены!' });
          await bot.editMessageText('🧹 Все результаты голосования очищены. Можно начинать новое голосование.', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: createAdminPanel().reply_markup
          });
          break;

        case 'admin_vote_results':
          const currentRatings = Object.values(voting.ratings);
          let resultsMessage = `📊 <b>Результаты голосования:</b>\n\n` +
            `🎥 Фильм: ${voting.film || meeting.film}\n` +
            `👥 Участников: ${currentRatings.length}\n`;

          if (currentRatings.length > 0) {
            const sum = currentRatings.reduce((a, b) => a + b, 0);
            const average = sum / currentRatings.length;

            resultsMessage += `⭐ Средняя оценка: ${average.toFixed(1)}/10\n\n`;

            // Распределение оценок
            const ratingDistribution = Array(10).fill(0);
            currentRatings.forEach(r => ratingDistribution[r-1]++);

            resultsMessage += `<b>Распределение оценок:</b>\n`;
            ratingDistribution.forEach((count, index) => {
              resultsMessage += `${index+1} баллов: ${count} голосов\n`;
            });
          } else {
            resultsMessage += `Еще нет оценок.`;
          }

          await bot.answerCallbackQuery(query.id);
          await bot.editMessageText(resultsMessage, {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: 'HTML',
            reply_markup: createAdminPanel().reply_markup
          });
          break;

        case 'admin_send_results':
          if (!voting.ratings || Object.keys(voting.ratings).length === 0) {
            return await bot.answerCallbackQuery(query.id, { text: 'Нет результатов для рассылки' });
          }

          const currentRatingsForSend = Object.values(voting.ratings);
          const sumForSend = currentRatingsForSend.reduce((a, b) => a + b, 0);
          const averageForSend = sumForSend / currentRatingsForSend.length;

          const subscriptionsForSend = loadSubscriptions();
          let sentCount = 0;

          for (const subChatId of subscriptionsForSend) {
            try {
              await bot.sendMessage(
                subChatId,
                `⭐ <b>Результаты голосования:</b>\n\n` +
                `Фильм: ${voting.film || meeting.film}\n` +
                `Средняя оценка: ${averageForSend.toFixed(1)}/10\n` +
                `Количество участников: ${currentRatingsForSend.length}\n\n` +
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
          break;

        case 'admin_save_to_history':
          if (!voting.average || !voting.film) {
            return await bot.answerCallbackQuery(query.id, { text: 'Нет данных для сохранения' });
          }

          const history = loadHistory();
          history.push({
            film: voting.film,
            genre: voting.genre || meeting.genre,
            average: voting.average,
            participants: Object.keys(voting.ratings).length,
            date: voting.endTime || new Date().toISOString(),
            poster: voting.poster || meeting.poster
          });
          saveHistory(history);

          await bot.answerCallbackQuery(query.id, { text: 'Результаты сохранены в историю!' });
          await bot.editMessageText('✅ Результаты голосования сохранены в историю.', {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: createAdminPanel().reply_markup
          });
          break;

          case 'admin_add_next_movie':
  await bot.answerCallbackQuery(query.id);
  await bot.editMessageText('Введите информацию о следующем фильме в формате:\n\n' +
    '<b>Дата|Время|Место|Название фильма|Режиссер|Жанр|Страна|Год|URL постера|Номер обсуждения</b>\n\n' +
    'Пример:\n' +
    '20.07.2025|15:00|Кофейня "Том Сойер"|"Интерстеллар"|"Кристофер Нолан"|"фантастика, драма"|"США"|"2014"|"https://example.com/poster.jpg"|"16"', {
    chat_id: chatId,
    message_id: query.message.message_id,
    parse_mode: 'HTML'
  });

  // Сохраняем состояние ожидания ввода данных о фильме
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
        await bot.sendMessage(chatId, '✅ Информация о следующем фильме сохранена!', createAdminPanel());
      } else {
        await bot.sendMessage(chatId, '❌ Неверный формат. Попробуйте снова.', createAdminPanel());
      }
    }
  });
  break;
      }
    } else {
      switch(query.data) {
        case 'subscribe':
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
          break;

        case 'unsubscribe':
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
          break;

        case 'back_to_main':
          await bot.deleteMessage(chatId, query.message.message_id);
          await bot.sendMessage(
            chatId,
            'Выбери действие:',
            ADMIN_IDS.includes(chatId.toString()) ? createAdminMenu() : createMainMenu()
          );
          break;
      }
    }
  } catch (err) {
    log(`Ошибка обработки callback ${chatId}: ${err}`);
    await bot.sendAnimation(chatId, animations.error, {
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

  await bot.sendAnimation(msg.chat.id, animations.success, {
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
    '🎥 <b>Кино-клуб "Одиссея"</b>\n\n' +
    'Мы собираемся каждую неделю, чтобы:\n' +
    '• Смотреть дома хорошее кино\n' +
    '• Обсуждать фильмы\n' +
    '• Знакомиться с единомышленниками\n\n' +
    'Присоединяйся!',
    {
      parse_mode: 'HTML',
      ...(ADMIN_IDS.includes(chatId.toString()) ? createAdminMenu() : createMainMenu())
    }
  );
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
      ...(ADMIN_IDS.includes(chatId.toString()) ? createAdminMenu() : createMainMenu())
    }
  );
}

log('🎬 Бот запущен и готов к киномании!');