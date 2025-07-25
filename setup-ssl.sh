#!/bin/bash

DOMAIN="appbookingmachine.ru"
EMAIL="your-email@example.com"

echo "🔒 Настройка SSL сертификатов для $DOMAIN..."

# Установка Certbot
if ! command -v certbot &> /dev/null; then
    echo "📦 Установка Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Создание директории для SSL
mkdir -p ssl

# Получение сертификата
echo "📜 Получение SSL сертификата..."
sudo certbot certonly --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Копирование сертификатов
echo "📋 Копирование сертификатов..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/
sudo chown $USER:$USER ssl/*.pem

echo "✅ SSL сертификаты настроены!"
echo "📁 Сертификаты находятся в папке ssl/"