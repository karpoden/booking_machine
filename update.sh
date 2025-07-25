#!/bin/bash

echo "🔄 Обновление системы бронирования..."

# Получение обновлений
echo "📥 Получение обновлений из Git..."
git pull origin main

# Остановка сервисов
echo "🛑 Остановка сервисов..."
docker-compose -f docker-compose.prod.yml down

# Пересборка и запуск
echo "🔨 Пересборка контейнеров..."
docker-compose -f docker-compose.prod.yml up --build -d

# Применение миграций БД
echo "🗄️ Применение миграций базы данных..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

# Проверка статуса
echo "📊 Проверка статуса..."
docker-compose -f docker-compose.prod.yml ps

echo "✅ Обновление завершено!"