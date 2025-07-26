#!/bin/bash

echo "Останавливаем backend..."
docker-compose -f docker-compose.prod.yml stop backend

echo "Удаляем контейнер..."
docker rm booking-backend-prod

echo "Пересобираем backend..."
docker-compose -f docker-compose.prod.yml build backend

echo "Запускаем backend..."
docker-compose -f docker-compose.prod.yml up -d backend

echo "Проверяем статус..."
sleep 5
docker ps | grep backend