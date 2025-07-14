const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
require('dotenv').config();

const bot = new TelegramBot(process.env.USER_BOT_TOKEN, { polling: true });
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://bookingminiapp.ru';
const API_URL = 'http://backend:3000';

// HTTP сервер для уведомлений
const app = express();
app.use(express.json());

app.post('/notify', (req, res) => {
  const { userId, message } = req.body;
  bot.sendMessage(userId, message);
  res.json({ success: true });
});

app.listen(3001, () => {
  console.log('🔔 HTTP сервер для уведомлений запущен на порту 3001');
});

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
    const keyboard = {
      inline_keyboard: [
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
      ]
    };
    
    bot.sendMessage(chatId, 
      `✅ Заявка на бронирование отправлена!\n\n` +
      `🍽 Стол: №${data.table}\n` +
      `📅 Дата: ${data.date}\n` +
      `🕐 Время: ${data.time}\n\n` +
      `⏳ Ожидайте подтверждения от администратора...`,
      { reply_markup: keyboard }
    );
  }
});

// Обработка callback кнопок
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  if (data === 'main_menu') {
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
  }
  
  if (data === 'my_bookings') {
    try {
      const response = await axios.get(`${API_URL}/api/user-bookings/${chatId}`);
      const bookings = response.data;
      
      const keyboard = {
        inline_keyboard: [
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
        ]
      };
      
      if (bookings.length === 0) {
        bot.sendMessage(chatId, '📋 У вас нет активных бронирований.', { reply_markup: keyboard });
      } else {
        let message = '📋 Ваши бронирования:\n\n';
        bookings.forEach((booking, index) => {
          message += `${index + 1}. ✅ Стол №${booking.tableId}\n`;
          message += `   📅 ${booking.bookingDate} в ${booking.bookingTime}\n`;
          message += `   ⏱ Продолжительность: ${booking.duration} ч\n`;
          if (booking.customerName) {
            message += `   👤 ${booking.customerName}\n`;
          }
          message += `\n`;
        });
        
        bot.sendMessage(chatId, message, { reply_markup: keyboard });
      }
    } catch (error) {
      console.error('Ошибка получения бронирований:', error);
      bot.sendMessage(chatId, '❌ Ошибка получения бронирований. Попробуйте позже.');
    }
  }
  
  bot.answerCallbackQuery(query.id);
});

console.log('🤖 Пользовательский бот запущен...');