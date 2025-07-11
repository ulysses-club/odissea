const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

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
const ADMIN_ID = '@GeekLS';
const SUBSCRIPTIONS_FILE = path.join(__dirname, 'subscriptions.json');

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
  error: 'https://media.giphy.com/media/TqiwHbFBaZ4ti/giphy.gif'
};

// Загрузка/сохранение подписок
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

// Информация о встрече
function getMeetingInfo() {
  return {
    date: '13.07.2025',
    time: '15:00',
    place: 'Кофейня "Том Сойер", ул. Шмидта, 12',
    film: '«Amores perros/Сука-любовь» (2000)',
    description: 'Жанр: триллер, драма, криминал',
    poster: 'https://sun9-77.userapi.com/s/v1/ig2/Q91kMgxR5t6YrRGSs3bx2uFJjj98U4Gl0JYTY-DWHmJe7gKzIQLw842yglmdJlLcqyWlE_TmHxDCwB8ER5HZPW5G.jpg?quality=95&as=32x44,48x66,72x99,108x148,160x219,240x329,360x494,480x658,540x741,640x878,720x988,729x1000&from=bu&cs=729x0'
  };
}

// Красивое меню
function createMainMenu() {
  return {
    reply_markup: JSON.stringify({
      resize_keyboard: true,
      keyboard: [
        [{ text: '🍿 Ближайшая встреча' }, { text: '📅 Моя подписка' }],
        [{ text: 'ℹ️ О клубе' }, { text: '📢 Контакты' }]
      ]
    })
  };
}

// Отправка информации о встрече с анимацией
async function sendMeetingInfo(chatId) {
  const meeting = getMeetingInfo();

  try {
    // Сначала отправляем анимацию
    await bot.sendAnimation(chatId, animations.movie, {
      caption: '🎬 Загружаю информацию о встрече...'
    });

    // Затем основное сообщение
    const message = `🎬 <b>Ближайшая встреча кино-клуба:</b>\n\n` +
      `📅 <b>Дата:</b> ${meeting.date}\n` +
      `⏰ <b>Время:</b> ${meeting.time}\n` +
      `📍 <b>Место:</b> <a href="https://maps.google.com/?q=${encodeURIComponent(meeting.place)}">${meeting.place}</a>\n` +
      `🎥 <b>Фильм:</b> ${meeting.film}\n` +
      `📝 <b>Описание:</b> ${meeting.description}\n\n` +
      `Не забудьте посмотреть фильм заранее!`;

    await bot.sendPhoto(chatId, meeting.poster, {
      caption: message,
      parse_mode: 'HTML',
      ...createMainMenu()
    });
  } catch (err) {
    log(`Ошибка отправки сообщения ${chatId}: ${err}`);
    await bot.sendAnimation(chatId, animations.error, {
      caption: 'Ой, что-то пошло не так! Попробуйте позже.'
    });
  }
}

// Команда /start с анимацией
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Отправляем приветственную анимацию
    await bot.sendAnimation(chatId, animations.welcome, {
      caption: `Привет, ${msg.from.first_name}! 👋\nЯ бот кино-клуба 'Одиссея'!`
    });

    // Основное сообщение с меню
    await bot.sendMessage(
      chatId,
      '🎥 Я помогу тебе:\n' +
      '• Узнать о ближайших встречах\n' +
      '• Подписаться на уведомления\n' +
      '• Получать напоминания о фильмах\n\n' +
      'Выбери действие:',
      createMainMenu()
    );
  } catch (err) {
    log(`Ошибка отправки /start ${chatId}: ${err}`);
  }
});

// Обработка текстовых сообщений
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
      default:
        await bot.sendMessage(chatId, 'Используй меню для навигации 😉', createMainMenu());
    }
  }
});

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

  try {
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
          createMainMenu()
        );
        break;
    }
  } catch (err) {
    log(`Ошибка обработки callback ${chatId}: ${err}`);
    await bot.sendAnimation(chatId, animations.error, {
      caption: 'Произошла ошибка, попробуйте снова'
    });
  }
});

// Команда для админа
bot.onText(/\/notify (.+)/, async (msg, match) => {
  if (msg.from.id.toString() !== ADMIN_ID) {
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

// Рассылка по расписанию
setInterval(async () => {
  const subscriptions = loadSubscriptions();

  for (const chatId of subscriptions) {
    try {
      await bot.sendChatAction(chatId, 'upload_photo');
      await sendMeetingInfo(chatId);
    } catch (err) {
      log(`Ошибка рассылки ${chatId}: ${err}`);
    }
  }
}, 7 * 24 * 60 * 60 * 1000); // 1 неделя

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
    { parse_mode: 'HTML', ...createMainMenu() }
  );
}

async function sendContacts(chatId) {
  await bot.sendMessage(
    chatId,
    '📬 <b>Контакты организаторов:</b>\n\n' +
    '• Админ бота: @GeekLS\n' +
    '• Босс: https://vk.com/id8771550\n' +
    '• Телефон: +7 (978)73 63 212\n\n' +
    'Пишите по любым вопросам!',
    { parse_mode: 'HTML', ...createMainMenu() }
  );
}

log('🎬 Бот запущен и готов к киномании!');