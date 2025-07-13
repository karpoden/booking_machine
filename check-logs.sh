#!/bin/bash

echo "🔍 Проверка логов..."
echo ""
echo "Backend логи:"
docker-compose logs backend
echo ""
echo "Frontend логи:"
docker-compose logs frontend