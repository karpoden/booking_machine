#!/bin/bash

echo "🏥 Проверка здоровья системы..."

# Проверка контейнеров
echo "📦 Статус контейнеров:"
docker-compose ps

# Проверка API
echo "🔧 Проверка Backend API:"
curl -s http://localhost:3000/api/tables?date=2025-01-15&time=18:00 | head -100

# Проверка фронтенда
echo "🌐 Проверка Frontend:"
curl -s -o /dev/null -w "%{http_code}" http://localhost

# Проверка логов
echo "📋 Последние логи (ошибки):"
docker-compose logs --tail=10 | grep -i error

echo "✅ Проверка завершена!"