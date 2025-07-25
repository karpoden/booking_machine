#!/bin/bash

echo "🔄 Перезапуск системы бронирования..."

# Остановка контейнеров
docker-compose down

# Пересборка и запуск
docker-compose up --build -d

echo "✅ Система перезапущена!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:8000"

# Показать логи
docker-compose logs -f