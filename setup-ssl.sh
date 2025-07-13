#!/bin/bash

echo "🔐 Настройка SSL сертификатов для bookingminiapp.ru..."

# Создаем папку для SSL сертификатов
mkdir -p ssl

# Устанавливаем certbot если не установлен
if ! command -v certbot &> /dev/null; then
    echo "📦 Установка certbot..."
    sudo apt update
    sudo apt install -y certbot
fi

# Останавливаем контейнеры если запущены
echo "🛑 Остановка контейнеров..."
docker-compose down

# Создаем самоподписанный сертификат
echo "📜 Создание самоподписанного сертификата..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/privkey.pem \
    -out ssl/fullchain.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=bookingminiapp.ru"

# Проверяем наличие Let's Encrypt сертификатов
if [ -f "/etc/letsencrypt/live/bookingminiapp.ru/fullchain.pem" ]; then
    echo "✅ Найдены Let's Encrypt сертификаты, заменяем..."
    sudo cp /etc/letsencrypt/live/bookingminiapp.ru/fullchain.pem ssl/
    sudo cp /etc/letsencrypt/live/bookingminiapp.ru/privkey.pem ssl/
    sudo chown $USER:$USER ssl/*.pem
fi

# Устанавливаем правильные права доступа
chmod 644 ssl/fullchain.pem
chmod 600 ssl/privkey.pem

echo "✅ SSL сертификаты настроены!"
echo "🚀 Теперь запустите: ./deploy.sh"