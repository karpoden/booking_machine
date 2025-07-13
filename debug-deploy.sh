#!/bin/bash

echo "🔍 Отладка деплоя..."

# Создаем SSL сертификат
./fix-ssl.sh

echo ""
echo "📋 Команды для сервера:"
echo ""
echo "# 1. Проверьте статус Docker"
echo "docker-compose ps"
echo ""
echo "# 2. Проверьте логи"
echo "docker-compose logs frontend"
echo ""
echo "# 3. Проверьте порты"
echo "netstat -tlnp | grep :8444"
echo ""
echo "# 4. Обновите nginx конфигурацию"
echo "sudo cp nginx-proxy.conf /etc/nginx/sites-available/booking"
echo "sudo nginx -t"
echo "sudo systemctl reload nginx"
echo ""
echo "# 5. Проверьте доступность"
echo "curl -k https://localhost:8444"