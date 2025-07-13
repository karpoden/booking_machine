# Система бронирования столов с Telegram Bot

Полнофункциональная система бронирования столов ресторана с Telegram Mini App, пользовательским и админским ботами.

## 🏗️ Архитектура системы

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Пользователь  │───▶│  Telegram Bot    │───▶│   Mini App      │
│                 │    │  (User Bot)      │    │   (React SPA)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Администратор │◀───│  Telegram Bot    │◀───│   Backend API   │
│                 │    │  (Admin Bot)     │    │ (Express+Prisma)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   SQLite DB     │
                                               │   (Bookings)    │
                                               └─────────────────┘
```

## 📁 Структура проекта

```
booking_machine/
├── Backend/                 # API сервер
│   ├── prisma/             # База данных и миграции
│   ├── server.js           # Основной сервер
│   ├── package.json        # Зависимости Node.js
│   └── Dockerfile          # Docker образ для API
├── Frontend/               # React приложение
│   └── restaurant-booking-twa/
│       ├── src/            # Исходный код React
│       ├── public/         # Статические файлы
│       ├── nginx.conf      # Конфигурация Nginx
│       └── Dockerfile      # Docker образ для фронтенда
├── Bot_User/               # Пользовательский бот
│   ├── bot.js              # Логика пользовательского бота
│   ├── package.json        # Зависимости
│   └── Dockerfile          # Docker образ
├── Bot_Admin/              # Админский бот
│   ├── bot.js              # Логика админского бота
│   ├── package.json        # Зависимости
│   └── Dockerfile          # Docker образ
├── ssl/                    # SSL сертификаты (создается автоматически)
├── docker-compose.yml      # Конфигурация всех сервисов
├── setup-ssl.sh           # Скрипт настройки SSL
├── deploy.sh              # Скрипт деплоя
├── update.sh              # Скрипт обновления
└── README.md              # Документация
```

## 🚀 Первоначальный деплой

### Шаг 1: Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезагрузка для применения изменений
sudo reboot
```

### Шаг 2: Настройка DNS

Настройте A-записи для вашего домена:
```
bookingminiapp.ru     → IP_ВАШЕГО_СЕРВЕРА
www.bookingminiapp.ru → IP_ВАШЕГО_СЕРВЕРА
```

### Шаг 3: Создание Telegram ботов

1. **Создание пользовательского бота:**
   ```
   Напишите @BotFather → /newbot
   Имя: Restaurant Booking Bot
   Username: your_restaurant_bot
   Сохраните токен!
   ```

2. **Создание админского бота:**
   ```
   Напишите @BotFather → /newbot
   Имя: Restaurant Admin Bot
   Username: your_restaurant_admin_bot
   Сохраните токен!
   ```

### Шаг 4: Клонирование проекта

```bash
# Клонирование репозитория
git clone https://github.com/your-username/booking_machine.git
cd booking_machine

# Создание .env файла
cp .env.example .env
```

### Шаг 5: Настройка переменных окружения

Отредактируйте файл `.env`:
```bash
nano .env
```

```env
# Токены ботов (получите у @BotFather)
USER_BOT_TOKEN=ваш_токен_пользовательского_бота
ADMIN_BOT_TOKEN=ваш_токен_админского_бота

# URL вашего домена
WEBAPP_URL=https://bookingminiapp.ru
```

### Шаг 6: Настройка SSL сертификатов

```bash
# Отредактируйте email в скрипте
nano setup-ssl.sh
# Замените your-email@example.com на ваш email

# Запуск настройки SSL
chmod +x setup-ssl.sh
./setup-ssl.sh
```

### Шаг 7: Деплой системы

```bash
# Запуск деплоя
chmod +x deploy.sh
./deploy.sh
```

### Шаг 8: Настройка Mini App в Telegram

1. **Для пользовательского бота:**
   ```
   @BotFather → выберите вашего пользовательского бота
   /setmenubutton
   Текст кнопки: 📅 Забронировать стол
   URL: https://bookingminiapp.ru
   ```

2. **Тестирование админского бота:**
   ```
   Найдите вашего админского бота в Telegram
   Напишите /start
   Вы автоматически подпишетесь на уведомления
   ```

## 🔄 Обновление системы

### Автоматическое обновление

```bash
# Создание скрипта обновления
chmod +x update.sh
./update.sh
```

### Ручное обновление

```bash
# Остановка сервисов
docker-compose down

# Получение обновлений
git pull origin main

# Пересборка и запуск
docker-compose up --build -d

# Применение миграций БД (если есть)
docker-compose exec -T backend npx prisma migrate deploy
```

## 🛠️ Управление системой

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f bot-user
docker-compose logs -f bot-admin
docker-compose logs -f frontend
```

### Перезапуск сервисов

```bash
# Все сервисы
docker-compose restart

# Конкретный сервис
docker-compose restart backend
```

### Остановка системы

```bash
# Остановка всех сервисов
docker-compose down

# Остановка с удалением данных
docker-compose down -v
```

## 📊 Мониторинг

### Проверка статуса

```bash
# Статус контейнеров
docker-compose ps

# Использование ресурсов
docker stats
```

### Проверка доступности

- **Frontend:** https://bookingminiapp.ru
- **API Health:** https://bookingminiapp.ru/api/tables
- **SSL Certificate:** `openssl s_client -connect bookingminiapp.ru:443`

## 🔧 Обслуживание

### Обновление SSL сертификатов

```bash
# Ручное обновление
./setup-ssl.sh
./deploy.sh

# Автоматическое обновление (добавить в crontab)
crontab -e
# Добавить строку:
0 0 1 * * /path/to/project/setup-ssl.sh && /path/to/project/deploy.sh
```

### Резервное копирование

```bash
# Создание бэкапа базы данных
docker-compose exec backend sqlite3 /app/prisma/dev.db ".backup /app/backup.db"
docker cp $(docker-compose ps -q backend):/app/backup.db ./backup-$(date +%Y%m%d).db
```

### Восстановление из бэкапа

```bash
# Остановка сервисов
docker-compose down

# Восстановление базы данных
cp backup-YYYYMMDD.db Backend/prisma/dev.db

# Запуск сервисов
docker-compose up -d
```

## 🐛 Устранение неполадок

### Проблемы с SSL

```bash
# Проверка сертификатов
ls -la ssl/
openssl x509 -in ssl/fullchain.pem -text -noout

# Пересоздание сертификатов
rm -rf ssl/
./setup-ssl.sh
```

### Проблемы с ботами

```bash
# Проверка логов ботов
docker-compose logs bot-user
docker-compose logs bot-admin

# Перезапуск ботов
docker-compose restart bot-user bot-admin
```

### Проблемы с базой данных

```bash
# Проверка базы данных
docker-compose exec backend npx prisma studio

# Сброс базы данных (ОСТОРОЖНО!)
docker-compose down
rm Backend/prisma/dev.db
docker-compose up -d
```

## 📋 Функциональность системы

### Пользовательский бот
- ✅ Открытие Mini App для бронирования
- ✅ Просмотр активных бронирований
- ✅ Отмена бронирований
- ✅ Уведомления о статусе заявок

### Админский бот
- ✅ Автоматические уведомления о новых заявках
- ✅ Подтверждение/отклонение бронирований
- ✅ Просмотр всех бронирований
- ✅ Статистика по дням

### Mini App (React SPA)
- ✅ Интерактивная карта ресторана
- ✅ Выбор даты, времени и продолжительности
- ✅ Просмотр фотографий столов с каруселью
- ✅ Форма бронирования с валидацией телефона
- ✅ Адаптивный дизайн для мобильных устройств

### Backend API
- ✅ RESTful API для бронирований
- ✅ Проверка пересечений времени
- ✅ Автоматическая очистка старых данных (>2 дней)
- ✅ Интеграция с Telegram ботами

## 🔒 Безопасность

- ✅ HTTPS с автоматическим редиректом
- ✅ SSL сертификаты Let's Encrypt
- ✅ Заголовки безопасности (HSTS, CSP, X-Frame-Options)
- ✅ Изолированная Docker сеть
- ✅ Валидация входных данных
- ✅ Защита от XSS и CSRF

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose logs -f`
2. Убедитесь в доступности домена: `ping bookingminiapp.ru`
3. Проверьте SSL: `curl -I https://bookingminiapp.ru`
4. Перезапустите систему: `./deploy.sh`

---

**Версия:** 1.0.0  
**Последнее обновление:** $(date +%Y-%m-%d)