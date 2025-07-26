#!/bin/bash

echo "Проверка сервисов:"
echo "Frontend на порту 8080:"
curl -I http://localhost:8080

echo -e "\nBackend на порту 3000:"
curl -I http://localhost:3000/api/tables

echo -e "\nПроцессы на портах:"
netstat -tlnp | grep -E ':(3000|8080)'