import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Updater, CommandHandler, CallbackQueryHandler, CallbackContext

# Настройка логов
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Токен вашего бота (замените на реальный)
TOKEN = "ВАШ_TELEGRAM_BOT_TOKEN"

# Команда /start
def start(update: Update, context: CallbackContext) -> None:
    user = update.effective_user
    keyboard = [
        [InlineKeyboardButton("Подписаться на рассылку", callback_data='subscribe')],
        [InlineKeyboardButton("Отписаться", callback_data='unsubscribe')],
        [InlineKeyboardButton("Ближайшая встреча", callback_data='next_meeting')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    update.message.reply_html(
        f"Привет, {user.mention_html()}! Я бот кино-клуба 'Одиссея'.\n"
        "Я буду напоминать тебе о наших встречах и обсуждениях фильмов.",
        reply_markup=reply_markup
    )

# Обработка кнопок
def button_handler(update: Update, context: CallbackContext) -> None:
    query = update.callback_query
    query.answer()
    
    if query.data == 'subscribe':
        # Здесь можно добавить логику подписки (например, в базу данных)
        query.edit_message_text("✅ Вы подписались на рассылку! Я буду присылать уведомления о встречах.")
    elif query.data == 'unsubscribe':
        # Логика отписки
        query.edit_message_text("❌ Вы отписались от рассылки. Чтобы снова подписаться, нажмите /start")
    elif query.data == 'next_meeting':
        send_next_meeting_info(update.effective_chat.id)

# Функция отправки информации о встрече
def send_next_meeting_info(chat_id):
    # Пример данных о встрече (можно заменить на реальные)
    meeting_info = {
        'date': '15 июля 2023',
        'time': '19:00',
        'place': 'Кофейня "Том Сойер", ул. Шмидта, 12',
        'film': '«Не надо никого спасать» (2025)'
    }
    
    message = (
        f"🎬 <b>Ближайшая встреча кино-клуба:</b>\n\n"
        f"📅 <b>Дата:</b> {meeting_info['date']}\n"
        f"⏰ <b>Время:</b> {meeting_info['time']}\n"
        f"📍 <b>Место:</b> {meeting_info['place']}\n"
        f"🎥 <b>Фильм:</b> {meeting_info['film']}\n\n"
        f"Не забудьте посмотреть фильм заранее!"
    )
    
    context.bot.send_message(
        chat_id=chat_id,
        text=message,
        parse_mode='HTML'
    )

# Рассылка уведомлений всем подписчикам
def send_notification(context: CallbackContext):
    # Здесь должен быть список chat_id подписчиков
    subscribers = []  # Замените на реальные данные
    
    for chat_id in subscribers:
        send_next_meeting_info(chat_id)

def main() -> None:
    updater = Updater(TOKEN)
    dispatcher = updater.dispatcher

    # Обработчики команд
    dispatcher.add_handler(CommandHandler("start", start))
    dispatcher.add_handler(CallbackQueryHandler(button_handler))

    # Планировщик для регулярных уведомлений
    job_queue = updater.job_queue
    job_queue.run_repeating(send_notification, interval=604800, first=0)  # Раз в неделю

    updater.start_polling()
    updater.idle()

if __name__ == '__main__':
    main()