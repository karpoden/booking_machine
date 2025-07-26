#!/bin/bash

echo "Статус backend контейнера:"
docker ps | grep backend

echo -e "\nЛоги backend:"
docker logs booking-backend-prod --tail 10

echo -e "\nПорт 3000:"
netstat -tlnp | grep :3000