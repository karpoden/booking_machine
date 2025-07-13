#!/bin/bash

echo "🚀 Деплой системы бронирования..."

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден. Скопируйте .env.example в .env и заполните токены."
    exit 1
fi

# Проверяем наличие SSL сертификатов
if [ ! -f ssl/fullchain.pem ] || [ ! -f ssl/privkey.pem ]; then
    echo "❌ SSL сертификаты не найдены. Запустите: ./setup-ssl.sh"
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
echo "🌐 Сайт: https://bookingminiapp.ru"
echo "🤖 Боты запущены и готовы к работе"
echo ""
echo "📋 Настройте в @BotFather:"
echo "Mini App URL: https://bookingminiapp.ru"