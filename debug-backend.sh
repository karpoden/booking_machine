#!/bin/bash

echo "1. Проверка контейнеров:"
docker ps | grep backend

echo -e "\n2. Логи backend:"
docker logs booking-backend-prod --tail 20

echo -e "\n3. Проверка порта 3000:"
netstat -tlnp | grep :3000

echo -e "\n4. Тест подключения к backend:"
curl -v http://localhost:3000/api/tables