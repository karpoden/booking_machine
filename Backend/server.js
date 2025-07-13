const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
require('dotenv').config();

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
        { id: 4, seats: 8 }
      ]
    });
    console.log('Столы добавлены в базу данных');
  }
}

// API маршруты
app.get('/api/tables', async (req, res) => {
  try {
    const tables = await prisma.table.findMany();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения столов' });
  }
});

app.post('/api/book', async (req, res) => {
  const { table_id, booking_date, booking_time } = req.body;
  
  try {
    const table = await prisma.table.findUnique({
      where: { id: parseInt(table_id) }
    });
    
    if (table?.status === 'booked') {
      return res.status(400).json({ error: 'Стол уже забронирован' });
    }
    
    await prisma.table.update({
      where: { id: parseInt(table_id) },
      data: { status: 'booked' }
    });
    
    await prisma.booking.create({
      data: {
        tableId: parseInt(table_id),
        bookingDate: booking_date,
        bookingTime: booking_time
      }
    });
    
    res.json({ success: true, message: 'Стол забронирован' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка бронирования' });
  }
});

app.delete('/api/book/:table_id', async (req, res) => {
  const { table_id } = req.params;
  
  try {
    await prisma.table.update({
      where: { id: parseInt(table_id) },
      data: { status: 'available' }
    });
    
    await prisma.booking.deleteMany({
      where: { tableId: parseInt(table_id) }
    });
    
    res.json({ success: true, message: 'Бронирование отменено' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка отмены бронирования' });
  }
});

initData().then(() => {
  app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
  });
});