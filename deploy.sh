#!/bin/bash

echo "🚀 Деплой системы бронирования..."

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден. Скопируйте .env.example в .env и заполните токены."
    exit 1
fi



# Останавливаем старые контейнеры
echo "🛑 Остановка старых контейнеров..."
docker-compose down

# Собираем и запускаем новые контейнеры
echo "🔨 Сборка и запуск контейнеров..."
docker-compose up --build -d

# Инициализируем базу данных
echo "🗄️ Инициализация базы данных..."
sleep 5
docker-compose exec -T backend npx prisma migrate deploy

echo "✅ Деплой завершен!"
echo "🌐 Сайт: https://app.bookingminiapp.ru"
echo "🤖 Боты запущены и готовы к работе"
echo ""
echo "📋 Настройте в @BotFather:"
echo "Mini App URL: https://app.bookingminiapp.ru"