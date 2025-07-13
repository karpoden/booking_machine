const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const WEBAPP_URL = process.env.WEBAPP_URL;
const API_URL = process.env.API_URL;

// Хранилище активных бронирований пользователей
const userBookings = new Map();

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const keyboard = {
    inline_keyboard: [
      [{ text: '📅 Забронировать стол', web_app: { url: WEBAPP_URL } }],
      [{ text: '📋 Мои бронирования', callback_data: 'my_bookings' }]
    ]
  };
  
  bot.sendMessage(chatId, 
    '🍽 Добро пожаловать в систему бронирования столов!\n\n' +
    'Выберите действие:', 
    { reply_markup: keyboard }
  );
});

// Обработка данных из Web App
bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  const data = JSON.parse(msg.web_app.data);
  
  if (data.action === 'book_table') {
    // Сохраняем бронирование пользователя
    const bookingId = `${chatId}_${Date.now()}`;
    userBookings.set(bookingId, {
      userId: chatId,
      userName: msg.from.first_name,
      userUsername: msg.from.username,
      ...data,
      status: 'pending',
      bookingId
    });
    
    // Уведомление будет отправлено админским ботом
    
    // Отправляем подтверждение пользователю
    const userKeyboard = {
      inline_keyboard: [
        [{ text: '❌ Отменить бронирование', callback_data: `cancel_${bookingId}` }]
      ]
    };
    
    bot.sendMessage(chatId, 
      `✅ Заявка на бронирование отправлена!\n\n` +
      `🍽 Стол: №${data.table}\n` +
      `📅 Дата: ${data.date}\n` +
      `🕐 Время: ${data.time}\n\n` +
      `⏳ Ожидайте подтверждения от администратора...`,
      { reply_markup: userKeyboard }
    );
  }
});

// Обработка callback кнопок
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  if (data.startsWith('approve_')) {
    const bookingId = data.replace('approve_', '');
    const booking = userBookings.get(bookingId);
    
    if (booking) {
      booking.status = 'approved';
      
      // Уведомляем пользователя
      bot.sendMessage(booking.userId, 
        `✅ Ваше бронирование подтверждено!\n\n` +
        `🍽 Стол: №${booking.table}\n` +
        `📅 Дата: ${booking.date}\n` +
        `🕐 Время: ${booking.time}\n\n` +
        `Ждем вас в ресторане! 🎉`
      );
      
      // Обновляем сообщение админа
      bot.editMessageText(
        query.message.text + '\n\n✅ ПОДТВЕРЖДЕНО',
        { chat_id: chatId, message_id: query.message.message_id }
      );
    }
  }
  
  if (data.startsWith('reject_')) {
    const bookingId = data.replace('reject_', '');
    const booking = userBookings.get(bookingId);
    
    if (booking) {
      booking.status = 'rejected';
      
      // Уведомляем пользователя
      bot.sendMessage(booking.userId, 
        `❌ К сожалению, ваше бронирование отклонено.\n\n` +
        `🍽 Стол: №${booking.table}\n` +
        `📅 Дата: ${booking.date}\n` +
        `🕐 Время: ${booking.time}\n\n` +
        `Попробуйте выбрать другое время.`
      );
      
      // Обновляем сообщение админа
      bot.editMessageText(
        query.message.text + '\n\n❌ ОТКЛОНЕНО',
        { chat_id: chatId, message_id: query.message.message_id }
      );
    }
  }
  
  if (data.startsWith('cancel_')) {
    const bookingId = data.replace('cancel_', '');
    const booking = userBookings.get(bookingId);
    
    if (booking && booking.userId === chatId) {
      userBookings.delete(bookingId);
      
      bot.sendMessage(chatId, '❌ Бронирование отменено.');
      
      // Уведомляем админа
      bot.sendMessage(ADMIN_CHAT_ID, 
        `❌ Пользователь ${booking.userName} отменил бронирование стола №${booking.table} на ${booking.date} ${booking.time}`
      );
    }
  }
  
  if (data === 'my_bookings') {
    const userActiveBookings = Array.from(userBookings.values())
      .filter(booking => booking.userId === chatId && booking.status !== 'rejected');
    
    if (userActiveBookings.length === 0) {
      bot.sendMessage(chatId, '📋 У вас нет активных бронирований.');
    } else {
      let message = '📋 Ваши бронирования:\n\n';
      userActiveBookings.forEach((booking, index) => {
        const statusEmoji = booking.status === 'approved' ? '✅' : '⏳';
        const statusText = booking.status === 'approved' ? 'Подтверждено' : 'Ожидает подтверждения';
        
        message += `${index + 1}. ${statusEmoji} Стол №${booking.table}\n`;
        message += `   📅 ${booking.date} в ${booking.time}\n`;
        message += `   📊 Статус: ${statusText}\n\n`;
      });
      
      bot.sendMessage(chatId, message);
    }
  }
  
  bot.answerCallbackQuery(query.id);
});

console.log('🤖 Пользовательский бот запущен...');