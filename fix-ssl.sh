#!/bin/bash

DOMAIN="bookingminiapp.ru"
SSL_DIR="./ssl/booking"
SERVER_SSL_DIR="/etc/ssl/booking"

echo "🔐 Создание отдельного SSL сертификата для $DOMAIN..."

# Создаем локальную папку для сертификатов
mkdir -p $SSL_DIR

# Создаем сертификат для конкретного домена
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout $SSL_DIR/privkey.pem \
    -out $SSL_DIR/fullchain.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"

# Устанавливаем права
chmod 644 $SSL_DIR/fullchain.pem
chmod 600 $SSL_DIR/privkey.pem

echo "✅ Сертификат создан локально в $SSL_DIR"
echo "📋 Команды для сервера:"
echo "sudo mkdir -p $SERVER_SSL_DIR"
echo "sudo cp $SSL_DIR/* $SERVER_SSL_DIR/"
echo "sudo chmod 644 $SERVER_SSL_DIR/fullchain.pem"
echo "sudo chmod 600 $SERVER_SSL_DIR/privkey.pem"