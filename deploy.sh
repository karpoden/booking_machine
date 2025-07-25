#!/bin/bash

echo "🚀 Запуск деплоя системы бронирования..."

# Проверка .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден. Скопируйте .env.example в .env и настройте переменные."
    exit 1
fi

# Остановка существующих контейнеров
echo "🛑 Остановка существующих контейнеров..."
docker-compose -f docker-compose.prod.yml down

# Удаление старых образов
echo "🗑️ Удаление старых образов..."
docker system prune -f
docker image prune -f

# Сборка и запуск
echo "🔨 Сборка и запуск контейнеров..."
docker-compose -f docker-compose.prod.yml up --build -d

# Проверка статуса
echo "📊 Проверка статуса контейнеров..."
docker-compose -f docker-compose.prod.yml ps

echo "✅ Деплой завершен!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:8000/api"
echo "📋 Логи: docker-compose -f docker-compose.prod.yml logs -f"