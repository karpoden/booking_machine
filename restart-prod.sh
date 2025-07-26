#!/bin/bash

echo "Перезапуск production системы..."

docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

echo "Проверка статуса:"
docker-compose -f docker-compose.prod.yml ps

echo "Проверка backend:"
sleep 5
curl -I http://localhost:3000/api/tables