# DEPLOY_YANDEX_CLOUD

Production-развертывание должно хранить данные в инфраструктуре РФ. Бот поддерживает два режима запуска: `BOT_MODE=polling` и `BOT_MODE=webhook`.

## 1. PostgreSQL

1. Создайте кластер Yandex Managed Service for PostgreSQL.
2. Создайте базу, пользователя и пароль.
3. Ограничьте сетевой доступ только нужными сервисами.
4. Примените `database/schema.sql`.
5. Сформируйте `DATABASE_URL`.
6. Если подключение требует SSL, установите `DATABASE_SSL=true`.

## 2. Вариант A: Serverless Containers

Подходит для компактного MVP.

1. Соберите Docker-образ.
2. Загрузите образ в Yandex Container Registry.
3. Создайте Serverless Container.
4. Добавьте env-переменные из `.env.example`.
5. Укажите порт `3000`.
6. Проверьте `GET /health`.
7. Для `BOT_MODE=webhook` настройте публичный HTTPS endpoint.
8. Для `BOT_MODE=webhook` настройте Telegram webhook.

## 3. Вариант B: VM + Docker

Подходит, если рядом нужно держать NocoDB/Directus и удобнее администрировать долгоживущий сервис.

1. Создайте VM в Yandex Cloud.
2. Установите Docker и Docker Compose.
3. Передайте `.env` на сервер безопасным способом.
4. Запустите контейнер бота.
5. Для `BOT_MODE=webhook` настройте reverse proxy с HTTPS.
6. Проверьте `GET /health`.
7. Для `BOT_MODE=webhook` настройте Telegram webhook.

## 4. Webhook

Этот раздел нужен только для `BOT_MODE=webhook`. При `BOT_MODE=polling` бот получает обновления через `bot.start()`, а webhook endpoint не используется.

Production endpoint:

```text
POST https://<domain>/telegram/webhook
```

Бот проверяет заголовок:

```text
X-Telegram-Bot-Api-Secret-Token: <TELEGRAM_WEBHOOK_SECRET>
```

Если secret неверный, сервер возвращает `401`.

Пример настройки webhook:

```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<domain>/telegram/webhook",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
  }'
```

## 5. NocoDB или Directus

NocoDB/Directus подключается к той же PostgreSQL-базе и используется как внутренний интерфейс команды.

Обязательные меры:

- закрытая авторизация;
- HTTPS;
- сильные пароли;
- ограничение доступа по пользователям;
- регулярный аудит доступа;
- резервные копии PostgreSQL.

## 6. Production checklist

- `NODE_ENV=production`.
- `BOT_MODE` выбран явно: `polling` или `webhook`.
- Для `BOT_MODE=webhook`: `TELEGRAM_WEBHOOK_SECRET` и `PUBLIC_BOT_URL` заполнены.
- Все ссылки на документы для consent screen заполнены и согласованы юристом.
- Бот добавлен в закрытый чат команды.
- `TELEGRAM_ADMIN_CHAT_ID` указывает на закрытый чат.
- `database/schema.sql` применен.
- `npm run typecheck` проходит.
- `npm run build` проходит.
- `/health` отвечает `200`.
- Для `BOT_MODE=webhook`: webhook отвечает `200` на корректные Telegram update.
- Для `BOT_MODE=webhook`: некорректный webhook secret получает `401`.
