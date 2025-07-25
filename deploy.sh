#!/bin/bash

echo "🚀 Запуск деплоя системы бронирования..."

# Проверка .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден. Скопируйте .env.example в .env и настройте переменные."
    exit 1
fi

# Остановка существующих контейнеров
echo "🛑 Остановка существующих контейнеров..."
docker-compose down

# Удаление старых образов
echo "🗑️ Удаление старых образов..."
docker system prune -f

# Сборка и запуск
echo "🔨 Сборка и запуск контейнеров..."
docker-compose up --build -d

# Проверка статуса
echo "📊 Проверка статуса контейнеров..."
docker-compose ps

echo "✅ Деплой завершен!"
echo "📱 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost:3000/api"
echo "📋 Логи: docker-compose logs -f"