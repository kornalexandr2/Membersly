# Membersly - Инструкция по установке и развертыванию

Данный документ содержит пошаговое руководство по установке SaaS-решения Membersly для автоматизации платных подписок в Telegram.

## 1. Системные требования

- **ОС:** Linux (рекомендуется Ubuntu 22.04+) или Windows с установленным Docker Desktop.
- **Инструменты:** Docker, Docker Compose, Git.
- **Ресурсы:** Минимум 2 ГБ ОЗУ, 10 ГБ свободного места на диске.

## 2. Подготовка окружения

### 2.1. Создание Telegram бота
1. Напишите [@BotFather](https://t.me/botfather).
2. Создайте нового бота (`/newbot`) и получите **API Token**.
3. Включите Web App в настройках бота (`/setwebapp`), если планируете использовать веб-интерфейс внутри Telegram.
4. Отключите Privacy Mode (`/setprivacy` -> Disable), чтобы бот мог корректно обрабатывать заявки на вступление (Chat Join Requests).

### 2.2. Настройка платежной системы (ЮKassa)
1. Зарегистрируйтесь в [ЮKassa](https://yookassa.ru/).
2. Получите `Shop ID` и `Secret Key` в личном кабинете (раздел "Настройки" -> "Ключи API").
3. Настройте Webhook URL: `https://your-domain.com/api/payments/webhook`.

---

## 3. Установка

### 3.1. Клонирование репозитория
```bash
git clone https://github.com/kornalexandr2/Membersly.git
cd Membersly
```

### 3.2. Настройка переменных окружения
Скопируйте пример файла конфигурации и заполните его:
```bash
cp backend/.env.example backend/.env
```

**Обязательные поля в `backend/.env`:**
- `BOT_TOKEN`: Токен вашего бота.
- `YOOKASSA_SHOP_ID`: ID магазина.
- `YOOKASSA_SECRET_KEY`: Секретный ключ.
- `POSTGRES_PASSWORD`: Придумайте сложный пароль для БД.

### 3.3. Запуск через Docker Compose
Запустите сборку и старт всех сервисов (БД, Redis, API, Бот, Воркер, Фронтенд):
```bash
docker-compose up -d --build
```

---

## 4. Настройка базы данных

После запуска контейнеров необходимо создать структуру таблиц:

```bash
# Генерация миграции (если вы вносили изменения в модели)
docker-compose exec backend alembic revision --autogenerate -m "Initial"

# Применение миграций
docker-compose exec backend alembic upgrade head
```

---

## 5. Проверка работоспособности

- **Бот:** Напишите `/start` вашему боту в Telegram. Он должен прислать приветственное сообщение.
- **API:** Откройте `http://localhost:8000/docs` (Swagger UI) для проверки доступных эндпоинтов.
- **Frontend:** Откройте `http://localhost/` в браузере (или используйте Web App через бота).

---

## 6. Обновление проекта

Для обновления проекта до последней версии используйте скрипт:
```bash
chmod +x update_server.sh
./update_server.sh
```

## 7. Устранение неполадок

- **Просмотр логов:**
  ```bash
  docker-compose logs -f [service_name] # например, backend или bot
  ```
- **Перезапуск конкретного сервиса:**
  ```bash
  docker-compose restart bot
  ```
