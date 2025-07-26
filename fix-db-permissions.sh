#!/bin/bash

echo "Останавливаем backend..."
docker-compose -f docker-compose.prod.yml stop backend

echo "Удаляем volume с базой данных..."
docker volume rm booking_machine_backend-db

echo "Пересобираем и запускаем backend..."
docker-compose -f docker-compose.prod.yml up -d --build backend

echo "Проверяем логи..."
sleep 10
docker logs booking-backend-prod --tail 5