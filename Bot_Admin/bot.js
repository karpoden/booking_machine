const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const bot = new TelegramBot(process.env.ADMIN_BOT_TOKEN, { polling: true });
const API_URL = 'http://backend:3000';

// Список подписанных админов
const subscribedAdmins = new Set();

// Состояния для диалогов
const userStates = new Map();

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  // Автоматически подписываем админа на уведомления
  subscribedAdmins.add(chatId);
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '📊 Все бронирования', callback_data: 'all_bookings' }],
      [{ text: '📅 Бронирования на сегодня', callback_data: 'today_bookings' }],
      [{ text: '➕ Добавить бронирование', callback_data: 'add_booking' }],
      [{ text: '❌ Отменить бронирование', callback_data: 'cancel_booking' }]
    ]
  };
  
  bot.sendMessage(chatId, 
    '👨‍💼 Панель администратора\n\n' +
    '✅ Вы подписаны на уведомления о новых бронированиях\n\n' +
    'Доступные команды:\n' +
    '/add - добавить бронирование\n' +
    '/cancel - отменить бронирование\n\n' +
    'Выберите действие:', 
    { reply_markup: keyboard }
  );
});

// Команды для добавления бронирования
bot.onText(/\/add/, (msg) => {
  const chatId = msg.chat.id;
  showTableButtons(chatId, 'add_booking');
});

// Команды для отмены бронирования
bot.onText(/\/cancel/, (msg) => {
  const chatId = msg.chat.id;
  showTableButtons(chatId, 'cancel_booking');
});

// Функция показа кнопок столов
function showTableButtons(chatId, action) {
  const keyboard = {
    inline_keyboard: [
      [{ text: 'Стол 1', callback_data: `${action}_table_1` }, { text: 'Стол 2', callback_data: `${action}_table_2` }, { text: 'Стол 3', callback_data: `${action}_table_3` }],
      [{ text: 'Стол 4', callback_data: `${action}_table_4` }, { text: 'Стол 5', callback_data: `${action}_table_5` }, { text: 'Стол 6', callback_data: `${action}_table_6` }],
      [{ text: 'Стол 7', callback_data: `${action}_table_7` }, { text: 'Стол 8', callback_data: `${action}_table_8` }, { text: 'Стол 9', callback_data: `${action}_table_9` }]
    ]
  };
  
  bot.sendMessage(chatId, 'Выберите стол:', { reply_markup: keyboard });
}

// Функция показа кнопок дат
function showDateButtons(chatId, action, tableId) {
  const today = new Date();
  const dates = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
    dates.push({ text: dayName, callback_data: `${action}_date_${tableId}_${dateStr}` });
  }
  
  const keyboard = {
    inline_keyboard: [
      [dates[0], dates[1]],
      [dates[2], dates[3]],
      [dates[4], dates[5]],
      [dates[6]]
    ]
  };
  
  bot.sendMessage(chatId, 'Выберите дату:', { reply_markup: keyboard });
}

// Функция показа кнопок времени
function showTimeButtons(chatId, action, tableId, date) {
  const times = [];
  for (let hour = 12; hour < 24; hour++) {
    times.push(
      { text: `${hour}:00`, callback_data: `${action}_time_${tableId}_${date}_${hour}:00` },
      { text: `${hour}:30`, callback_data: `${action}_time_${tableId}_${date}_${hour}:30` }
    );
  }
  
  const keyboard = {
    inline_keyboard: [
      [times[0], times[1], times[2], times[3]],
      [times[4], times[5], times[6], times[7]],
      [times[8], times[9], times[10], times[11]],
      [times[12], times[13], times[14], times[15]],
      [times[16], times[17], times[18], times[19]],
      [times[20], times[21], times[22], times[23]]
    ]
  };
  
  bot.sendMessage(chatId, 'Выберите время:', { reply_markup: keyboard });
}

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
      const keyboard = {
        inline_keyboard: [
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
        ]
      };
      
      let message = '📊 Все бронирования:\n\n';
      bookings.forEach((booking, index) => {
        message += `${index + 1}. 🍽 Стол №${booking.tableId}\n`;
        message += `   📅 ${booking.bookingDate} в ${booking.bookingTime}\n`;
        message += `   📞 ${booking.customerPhone || 'не указан'}\n`;
        message += `   👤 ${booking.customerName || 'не указано'}\n\n`;
      });
      
      bot.sendMessage(chatId, message, { reply_markup: keyboard });
    }
  }
  
  if (data === 'today_bookings') {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const bookings = await getAllBookings();
    const todayBookings = bookings.filter(booking => {
      // Проверяем, не прошло ли более 2 часов
      const bookingDateTime = new Date(`${booking.bookingDate}T${booking.bookingTime}`);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      if (bookingDateTime < twoHoursAgo) return false;
      
      if (booking.bookingDate === today) return true;
      if (booking.bookingDate === tomorrowStr) {
        const hour = parseInt(booking.bookingTime.split(':')[0]);
        return hour >= 0 && hour < 12; // 00:00-11:59 завтрашнего дня
      }
      return false;
    });
    
    if (todayBookings.length === 0) {
      bot.sendMessage(chatId, '📅 На сегодня нет бронирований.');
    } else {
      const keyboard = {
        inline_keyboard: [
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
        ]
      };
      
      let message = '📅 Бронирования на сегодня:\n\n';
      todayBookings.forEach((booking, index) => {
        const isNextDay = booking.bookingDate === tomorrowStr;
        message += `${index + 1}. 🍽 Стол №${booking.tableId}\n`;
        message += `   🕐 ${booking.bookingTime}${isNextDay ? ' (завтра)' : ''}\n`;
        message += `   📞 ${booking.customerPhone || 'не указан'}\n`;
        message += `   👤 ${booking.customerName || 'не указано'}\n\n`;
      });
      
      bot.sendMessage(chatId, message, { reply_markup: keyboard });
    }
  }
  
  if (data === 'add_booking') {
    showTableButtons(chatId, 'add_booking');
  }
  
  if (data === 'cancel_booking') {
    showTableButtons(chatId, 'cancel_booking');
  }
  
  if (data === 'main_menu') {
    const keyboard = {
      inline_keyboard: [
        [{ text: '📊 Все бронирования', callback_data: 'all_bookings' }],
        [{ text: '📅 Бронирования на сегодня', callback_data: 'today_bookings' }],
        [{ text: '➕ Добавить бронирование', callback_data: 'add_booking' }],
        [{ text: '❌ Отменить бронирование', callback_data: 'cancel_booking' }]
      ]
    };
    
    bot.sendMessage(chatId, 
      '👨‍💼 Панель администратора\n\n' +
      'Выберите действие:', 
      { reply_markup: keyboard }
    );
  }
  
  // Обработка выбора стола для добавления
  if (data.startsWith('add_booking_table_')) {
    const tableId = data.replace('add_booking_table_', '');
    showDateButtons(chatId, 'add_booking', tableId);
  }
  
  // Обработка выбора даты для добавления
  if (data.startsWith('add_booking_date_')) {
    const parts = data.replace('add_booking_date_', '').split('_');
    const tableId = parts[0];
    const date = parts[1];
    showTimeButtons(chatId, 'add_booking', tableId, date);
  }
  
  // Обработка выбора времени для добавления
  if (data.startsWith('add_booking_time_')) {
    const parts = data.replace('add_booking_time_', '').split('_');
    const tableId = parts[0];
    const date = parts[1];
    const time = parts[2];
    
    userStates.set(chatId, { action: 'add_booking', tableId, date, time, step: 'name' });
    bot.sendMessage(chatId, 'Введите имя клиента:');
  }
  
  // Обработка выбора стола для отмены
  if (data.startsWith('cancel_booking_table_')) {
    const tableId = data.replace('cancel_booking_table_', '');
    showDateButtons(chatId, 'cancel_booking', tableId);
  }
  
  // Обработка выбора даты для отмены
  if (data.startsWith('cancel_booking_date_')) {
    const parts = data.replace('cancel_booking_date_', '').split('_');
    const tableId = parts[0];
    const date = parts[1];
    showTimeButtons(chatId, 'cancel_booking', tableId, date);
  }
  
  // Обработка выбора времени для отмены
  if (data.startsWith('cancel_booking_time_')) {
    const parts = data.replace('cancel_booking_time_', '').split('_');
    const tableId = parseInt(parts[0]);
    const date = parts[1];
    const time = parts[2];
    
    try {
      const response = await axios.delete(`${API_URL}/api/book/${tableId}?date=${date}&time=${time}`);
      const booking = response.data.booking;
      
      if (booking && booking.telegramId) {
        try {
          await axios.post('http://bot-user:3001/notify', {
            userId: booking.telegramId,
            message: `❌ Ваше бронирование отменено администратором:\n\n🍽 Стол №${booking.tableId}\n📅 ${booking.bookingDate} в ${booking.bookingTime}\n\nПриносим извинения за неудобства.`
          });
        } catch (notifyError) {
          console.log('Не удалось отправить уведомление пользователю');
        }
      }
      
      const keyboard = {
        inline_keyboard: [
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
        ]
      };
      
      bot.sendMessage(chatId, `✅ Бронирование отменено:\nСтол №${tableId}\n${date} в ${time}`, { reply_markup: keyboard });
    } catch (error) {
      const keyboard = {
        inline_keyboard: [
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
        ]
      };
      bot.sendMessage(chatId, `❌ Ошибка: ${error.response?.data?.error || 'Не удалось отменить бронирование'}`, { reply_markup: keyboard });
    }
  }
  
  if (data.startsWith('approve_')) {
    const bookingId = data.replace('approve_', '');
    
    try {
      const bookings = await getAllBookings();
      const booking = bookings.find(b => b.id == bookingId);
      
      if (booking && booking.telegramId) {
        await axios.post('http://bot-user:3001/notify', {
          userId: booking.telegramId,
          message: `✅ Ваше бронирование подтверждено!\n\n🍽 Стол №${booking.tableId}\n📅 ${booking.bookingDate} в ${booking.bookingTime}\n\nЖдем вас в ресторане! 🎉`
        });
      }
    } catch (error) {
      console.log('Не удалось уведомить пользователя');
    }
    
    bot.editMessageText(
      query.message.text + '\n\n✅ ПОДТВЕРЖДЕНО',
      { chat_id: chatId, message_id: query.message.message_id }
    );
  }
  
  if (data.startsWith('change_')) {
    const bookingId = data.replace('change_', '');
    userStates.set(chatId, { action: 'change_table', bookingId, messageId: query.message.message_id });
    
    const keyboard = {
      inline_keyboard: [
        [{ text: 'Стол 1', callback_data: `change_table_${bookingId}_1` }, { text: 'Стол 2', callback_data: `change_table_${bookingId}_2` }, { text: 'Стол 3', callback_data: `change_table_${bookingId}_3` }],
        [{ text: 'Стол 4', callback_data: `change_table_${bookingId}_4` }, { text: 'Стол 5', callback_data: `change_table_${bookingId}_5` }, { text: 'Стол 6', callback_data: `change_table_${bookingId}_6` }],
        [{ text: 'Стол 7', callback_data: `change_table_${bookingId}_7` }, { text: 'Стол 8', callback_data: `change_table_${bookingId}_8` }, { text: 'Стол 9', callback_data: `change_table_${bookingId}_9` }]
      ]
    };
    
    bot.sendMessage(chatId, 'Выберите новый стол:', { reply_markup: keyboard });
  }
  
  if (data.startsWith('change_table_')) {
    const parts = data.replace('change_table_', '').split('_');
    const bookingId = parts[0];
    const newTableId = parseInt(parts[1]);
    
    try {
      const bookings = await getAllBookings();
      const booking = bookings.find(b => b.id == bookingId);
      
      if (booking) {
        // Обновляем бронирование
        await axios.put(`${API_URL}/api/book/${bookingId}`, {
          tableId: newTableId
        });
        
        // Уведомляем пользователя
        if (booking.telegramId) {
          await axios.post('http://bot-user:3001/notify', {
            userId: booking.telegramId,
            message: `🔄 Ваше бронирование изменено!\n\n🍽 Новый стол: №${newTableId}\n📅 ${booking.bookingDate} в ${booking.bookingTime}\n\nЖдем вас в ресторане! 🎉`
          });
        }
        
        const state = userStates.get(chatId);
        if (state && state.messageId) {
          bot.editMessageText(
            query.message.text.replace(/Стол: №\d+/, `Стол: №${newTableId}`) + '\n\n🔄 СТОЛ ИЗМЕНЕН',
            { chat_id: chatId, message_id: state.messageId }
          );
        }
        
        bot.sendMessage(chatId, `✅ Стол изменен на №${newTableId}`);
      }
    } catch (error) {
      bot.sendMessage(chatId, '❌ Ошибка изменения стола');
    }
    
    userStates.delete(chatId);
  }
  
  if (data.startsWith('reject_')) {
    const bookingId = data.replace('reject_', '');
    
    try {
      const bookings = await getAllBookings();
      const booking = bookings.find(b => b.id == bookingId);
      
      if (booking) {
        // Удаляем бронирование
        await axios.delete(`${API_URL}/api/book/${booking.tableId}?date=${booking.bookingDate}&time=${booking.bookingTime}`);
        
        // Уведомляем пользователя
        if (booking.telegramId) {
          await axios.post('http://bot-user:3001/notify', {
            userId: booking.telegramId,
            message: `❌ К сожалению, ваше бронирование отклонено.\n\n🍽 Стол №${booking.tableId}\n📅 ${booking.bookingDate} в ${booking.bookingTime}\n\nПопробуйте выбрать другое время.`
          });
        }
      }
    } catch (error) {
      console.log('Не удалось уведомить пользователя');
    }
    
    bot.editMessageText(
      query.message.text + '\n\n❌ ОТКЛОНЕНО',
      { chat_id: chatId, message_id: query.message.message_id }
    );
  }
  
  bot.answerCallbackQuery(query.id);
});

// Обработка текстовых сообщений только для имени и телефона
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (!userStates.has(chatId) || text.startsWith('/')) return;
  
  const state = userStates.get(chatId);
  
  if (state.action === 'add_booking') {
    if (state.step === 'name') {
      state.name = text;
      state.step = 'phone';
      bot.sendMessage(chatId, 'Введите телефон клиента:');
    } else if (state.step === 'phone') {
      state.phone = text;
      
      try {
        await axios.post(`${API_URL}/api/book`, {
          table_id: parseInt(state.tableId),
          booking_date: state.date,
          booking_time: state.time,
          duration: 2,
          customer_name: state.name,
          customer_phone: state.phone
        });
        
        const keyboard = {
          inline_keyboard: [
            [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
          ]
        };
        
        bot.sendMessage(chatId, `✅ Бронирование добавлено:\nСтол №${state.tableId}\n${state.date} в ${state.time}\n${state.name} (${state.phone})`, { reply_markup: keyboard });
      } catch (error) {
        const keyboard = {
          inline_keyboard: [
            [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
          ]
        };
        bot.sendMessage(chatId, `❌ Ошибка: ${error.response?.data?.error || 'Не удалось добавить бронирование'}`, { reply_markup: keyboard });
      }
      
      userStates.delete(chatId);
    }
  }
});

// Функция для отправки уведомления о новом бронировании
function sendBookingNotification(booking) {
  const keyboard = {
    inline_keyboard: [
      [{ text: '✅ Подтвердить', callback_data: `approve_${booking.id}` }],
      [{ text: '🔄 Изменить стол', callback_data: `change_${booking.id}` }],
      [{ text: '❌ Отменить', callback_data: `reject_${booking.id}` }]
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