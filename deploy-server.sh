#!/bin/bash

echo "🚀 Деплой на сервер с отдельными SSL сертификатами..."

# Создаем SSL сертификат локально
./fix-ssl.sh

echo ""
echo "📋 Выполните на сервере следующие команды:"
echo ""
echo "# 1. Создайте папку для SSL сертификатов"
echo "sudo mkdir -p /etc/ssl/booking"
echo ""
echo "# 2. Скопируйте сертификаты (выполните локально)"
echo "scp ssl/booking/* user@your-server:/tmp/"
echo ""
echo "# 3. Переместите сертификаты на сервере"
echo "sudo mv /tmp/fullchain.pem /etc/ssl/booking/"
echo "sudo mv /tmp/privkey.pem /etc/ssl/booking/"
echo "sudo chmod 644 /etc/ssl/booking/fullchain.pem"
echo "sudo chmod 600 /etc/ssl/booking/privkey.pem"
echo ""
echo "# 4. Настройте nginx"
echo "sudo cp nginx-proxy.conf /etc/nginx/sites-available/booking"
echo "sudo rm -f /etc/nginx/sites-enabled/booking"
echo "sudo ln -s /etc/nginx/sites-available/booking /etc/nginx/sites-enabled/"
echo "sudo nginx -t"
echo "sudo systemctl reload nginx"
echo ""
echo "# 5. Запустите Docker приложение"
echo "./deploy.sh"