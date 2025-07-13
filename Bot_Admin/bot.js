const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const API_URL = process.env.API_URL;

// Список подписанных админов
const subscribedAdmins = new Set();

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  // Автоматически подписываем админа на уведомления
  subscribedAdmins.add(chatId);
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '📊 Все бронирования', callback_data: 'all_bookings' }],
      [{ text: '📅 Бронирования на сегодня', callback_data: 'today_bookings' }]
    ]
  };
  
  bot.sendMessage(chatId, 
    '👨‍💼 Панель администратора\n\n' +
    '✅ Вы подписаны на уведомления о новых бронированиях\n\n' +
    'Выберите действие:', 
    { reply_markup: keyboard }
  );
});

// Получение всех бронирований
async function getAllBookings() {
  try {
    const response = await axios.get(`${API_URL}/api/bookings`);
    return response.data;
  } catch (error) {
    console.error('Ошибка получения бронирований:', error);
    return [];
  }
}

// Обработка callback кнопок
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  if (data === 'all_bookings') {
    const bookings = await getAllBookings();
    
    if (bookings.length === 0) {
      bot.sendMessage(chatId, '📋 Нет активных бронирований.');
    } else {
      let message = '📊 Все бронирования:\n\n';
      bookings.forEach((booking, index) => {
        message += `${index + 1}. 🍽 Стол №${booking.tableId}\n`;
        message += `   📅 ${booking.bookingDate} в ${booking.bookingTime}\n`;
        message += `   📞 ${booking.customerPhone || 'не указан'}\n`;
        message += `   👤 ${booking.customerName || 'не указано'}\n\n`;
      });
      
      bot.sendMessage(chatId, message);
    }
  }
  
  if (data === 'today_bookings') {
    const today = new Date().toISOString().split('T')[0];
    const bookings = await getAllBookings();
    const todayBookings = bookings.filter(booking => booking.bookingDate === today);
    
    if (todayBookings.length === 0) {
      bot.sendMessage(chatId, '📅 На сегодня нет бронирований.');
    } else {
      let message = '📅 Бронирования на сегодня:\n\n';
      todayBookings.forEach((booking, index) => {
        message += `${index + 1}. 🍽 Стол №${booking.tableId}\n`;
        message += `   🕐 ${booking.bookingTime}\n`;
        message += `   📞 ${booking.customerPhone || 'не указан'}\n`;
        message += `   👤 ${booking.customerName || 'не указано'}\n\n`;
      });
      
      bot.sendMessage(chatId, message);
    }
  }
  
  if (data.startsWith('approve_')) {
    const bookingId = data.replace('approve_', '');
    bot.editMessageText(
      query.message.text + '\n\n✅ ПОДТВЕРЖДЕНО',
      { chat_id: chatId, message_id: query.message.message_id }
    );
  }
  
  if (data.startsWith('reject_')) {
    const bookingId = data.replace('reject_', '');
    bot.editMessageText(
      query.message.text + '\n\n❌ ОТКЛОНЕНО',
      { chat_id: chatId, message_id: query.message.message_id }
    );
  }
  
  bot.answerCallbackQuery(query.id);
});

// Функция для отправки уведомления о новом бронировании
function sendBookingNotification(booking) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Подтвердить', callback_data: `approve_${booking.id}` },
        { text: '❌ Отклонить', callback_data: `reject_${booking.id}` }
      ]
    ]
  };
  
  const message = 
    `🔔 Новая заявка на бронирование!\n\n` +
    `🍽 Стол: №${booking.tableId}\n` +
    `📅 Дата: ${booking.bookingDate}\n` +
    `🕐 Время: ${booking.bookingTime}\n` +
    `📞 Телефон: ${booking.customerPhone || 'не указан'}\n` +
    `👤 Имя: ${booking.customerName || 'не указано'}`;
  
  // Отправляем всем подписанным админам
  subscribedAdmins.forEach(adminId => {
    bot.sendMessage(adminId, message, { reply_markup: keyboard });
  });
}

// Экспортируем функцию для использования в API
module.exports = { sendBookingNotification };

console.log('👨‍💼 Админский бот запущен...');