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

# Получаем SSL сертификат
echo "📜 Получение SSL сертификата..."
sudo certbot certonly --standalone \
    -d bookingminiapp.ru \
    -d www.bookingminiapp.ru \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive

# Копируем сертификаты в папку проекта
echo "📋 Копирование сертификатов..."
sudo cp /etc/letsencrypt/live/bookingminiapp.ru/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/bookingminiapp.ru/privkey.pem ssl/

# Устанавливаем правильные права доступа
sudo chown $USER:$USER ssl/*.pem
chmod 644 ssl/fullchain.pem
chmod 600 ssl/privkey.pem

echo "✅ SSL сертификаты настроены!"
echo "🚀 Теперь запустите: ./deploy.sh"