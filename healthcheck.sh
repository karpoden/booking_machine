#!/bin/bash

echo "🏥 Проверка здоровья системы..."

# Проверка контейнеров
echo "📦 Статус контейнеров:"
docker-compose -f docker-compose.prod.yml ps

# Проверка API
echo "🔧 Проверка Backend API:"
curl -s http://localhost:8000/api/tables?date=2025-01-15&time=18:00 | head -100

# Проверка фронтенда
echo "🌐 Проверка Frontend:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173

# Проверка логов
echo "📋 Последние логи (ошибки):"
docker-compose -f docker-compose.prod.yml logs --tail=10 | grep -i error

echo "✅ Проверка завершена!"