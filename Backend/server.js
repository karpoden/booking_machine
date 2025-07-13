const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
require('dotenv').config();

// Импортируем функцию уведомления из админского бота
let sendBookingNotification;
try {
  const adminBot = require('../Bot_Admin/bot.js');
  sendBookingNotification = adminBot.sendBookingNotification;
} catch (error) {
  console.log('Админский бот не запущен');
  sendBookingNotification = () => {};
}

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Инициализация данных
async function initData() {
  const count = await prisma.table.count();
  if (count === 0) {
    await prisma.table.createMany({
      data: [
        { id: 1, seats: 4 },
        { id: 2, seats: 2 },
        { id: 3, seats: 6 },
        { id: 4, seats: 8 },
        { id: 5, seats: 8 },
        { id: 6, seats: 1 },
        { id: 7, seats: 1 },
        { id: 8, seats: 1 },
        { id: 9, seats: 1 }
      ]
    });
    console.log('Столы добавлены в базу данных');
  }
}

// API маршруты
app.get('/api/tables', async (req, res) => {
  const { date, time, duration = 2 } = req.query;
  
  try {
    const tables = await prisma.table.findMany({
      include: {
        bookings: {
          where: {
            bookingDate: date
          }
        }
      }
    });
    
    // Определяем статус каждого стола
    const tablesWithStatus = tables.map(table => {
      const hasConflict = table.bookings.some(booking => {
        return timesOverlap(booking.bookingTime, booking.duration || 2, time, parseInt(duration));
      });
      
      return {
        id: table.id,
        seats: table.seats,
        status: hasConflict ? 'booked' : 'available'
      };
    });
    
    res.json(tablesWithStatus);
  } catch (error) {
    console.error('Ошибка получения столов:', error);
    res.status(500).json({ error: 'Ошибка получения столов' });
  }
});

// Функция для проверки пересечения времени
function timesOverlap(time1, duration1, time2, duration2) {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  
  const start1 = h1 * 60 + m1;
  const end1 = start1 + duration1 * 60;
  const start2 = h2 * 60 + m2;
  const end2 = start2 + duration2 * 60;
  
  return start1 < end2 && start2 < end1;
}

app.post('/api/book', async (req, res) => {
  const { table_id, booking_date, booking_time, duration = 2, customer_name, customer_phone } = req.body;
  
  try {
    // Проверяем существующие бронирования для этого стола в указанную дату
    const existingBookings = await prisma.booking.findMany({
      where: {
        tableId: parseInt(table_id),
        bookingDate: booking_date
      }
    });
    
    // Проверяем пересечение времени
    const hasConflict = existingBookings.some(booking => {
      return timesOverlap(booking.bookingTime, booking.duration || 2, booking_time, parseInt(duration));
    });
    
    if (hasConflict) {
      return res.status(400).json({ error: 'Стол уже забронирован на это время' });
    }
    
    const newBooking = await prisma.booking.create({
      data: {
        tableId: parseInt(table_id),
        bookingDate: booking_date,
        bookingTime: booking_time,
        duration: parseInt(duration),
        customerName: customer_name,
        customerPhone: customer_phone
      }
    });
    
    // Отправляем уведомление админу
    if (sendBookingNotification) {
      sendBookingNotification(newBooking);
    }
    
    res.json({ success: true, message: 'Стол забронирован' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка бронирования' });
  }
});

app.delete('/api/book/:table_id', async (req, res) => {
  const { table_id } = req.params;
  const { date, time } = req.query;
  
  try {
    await prisma.booking.deleteMany({
      where: { 
        tableId: parseInt(table_id),
        bookingDate: date,
        bookingTime: time
      }
    });
    
    res.json({ success: true, message: 'Бронирование отменено' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка отмены бронирования' });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(bookings);
  } catch (error) {
    console.error('Ошибка получения бронирований:', error);
    res.status(500).json({ error: 'Ошибка получения бронирований' });
  }
});

// Функция очистки старых бронирований
async function cleanOldBookings() {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const dateString = twoDaysAgo.toISOString().split('T')[0];
    
    const deleted = await prisma.booking.deleteMany({
      where: {
        bookingDate: {
          lt: dateString
        }
      }
    });
    
    if (deleted.count > 0) {
      console.log(`Удалено ${deleted.count} старых бронирований`);
    }
  } catch (error) {
    console.error('Ошибка очистки старых бронирований:', error);
  }
}

// Запуск очистки каждые 24 часа
setInterval(cleanOldBookings, 24 * 60 * 60 * 1000);

initData().then(() => {
  app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    // Запускаем очистку при старте
    cleanOldBookings();
  });
});