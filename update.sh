#!/bin/bash

echo "🔄 Обновление системы бронирования..."

# Проверяем, что мы в правильной директории
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Файл docker-compose.yml не найден. Убедитесь, что вы в корневой директории проекта."
    exit 1
fi

# Создаем бэкап базы данных
echo "💾 Создание резервной копии базы данных..."
BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).db"
if docker-compose ps | grep -q backend; then
    docker-compose exec -T backend sqlite3 /app/prisma/dev.db ".backup /app/backup.db" 2>/dev/null || true
    docker cp $(docker-compose ps -q backend):/app/backup.db ./$BACKUP_FILE 2>/dev/null || true
    if [ -f "$BACKUP_FILE" ]; then
        echo "✅ Бэкап создан: $BACKUP_FILE"
    else
        echo "⚠️  Не удалось создать бэкап (возможно, база данных пуста)"
    fi
fi

# Останавливаем сервисы
echo "🛑 Остановка сервисов..."
docker-compose down

# Получаем обновления из Git
echo "📥 Получение обновлений из GitHub..."
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "✅ Система уже обновлена до последней версии"
else
    echo "🔄 Найдены обновления, применяем..."
    git pull origin main
    
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка при получении обновлений из Git"
        exit 1
    fi
fi

# Проверяем изменения в зависимостях
echo "📦 Проверка обновлений зависимостей..."
REBUILD_FLAG=""
if git diff HEAD~1 HEAD --name-only | grep -E "(package\.json|Dockerfile|docker-compose\.yml)" > /dev/null; then
    echo "🔨 Обнаружены изменения в зависимостях, требуется пересборка..."
    REBUILD_FLAG="--build"
fi

# Запускаем обновленные сервисы
echo "🚀 Запуск обновленных сервисов..."
docker-compose up -d $REBUILD_FLAG

# Ждем запуска backend
echo "⏳ Ожидание запуска backend..."
sleep 10

# Применяем миграции базы данных (если есть)
echo "🗄️ Применение миграций базы данных..."
docker-compose exec -T backend npx prisma migrate deploy 2>/dev/null || echo "ℹ️  Миграции не требуются"

# Проверяем статус сервисов
echo "🔍 Проверка статуса сервисов..."
sleep 5
docker-compose ps

# Проверяем доступность
echo "🌐 Проверка доступности..."
if curl -s -o /dev/null -w "%{http_code}" https://bookingminiapp.ru | grep -q "200\|301\|302"; then
    echo "✅ Сайт доступен: https://bookingminiapp.ru"
else
    echo "⚠️  Сайт может быть недоступен, проверьте логи: docker-compose logs -f"
fi

# Очистка старых Docker образов
echo "🧹 Очистка неиспользуемых Docker образов..."
docker image prune -f > /dev/null 2>&1

echo ""
echo "✅ Обновление завершено!"
echo "📊 Статус сервисов:"
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "📋 Полезные команды:"
echo "  Логи всех сервисов: docker-compose logs -f"
echo "  Логи конкретного сервиса: docker-compose logs -f [backend|frontend|bot-user|bot-admin]"
echo "  Перезапуск: docker-compose restart"
echo "  Статус: docker-compose ps"

if [ -f "$BACKUP_FILE" ]; then
    echo ""
    echo "💾 Бэкап базы данных: $BACKUP_FILE"
    echo "   Для восстановления: cp $BACKUP_FILE Backend/prisma/dev.db && docker-compose restart backend"
fi