# SETUP

Локальная настройка Telegram-бота для заявок Елизаветы Кушниренко.

## 1. Что нужно заранее

- Node.js 20+.
- Telegram-бот, созданный через BotFather.
- Закрытый Telegram-чат команды, куда добавлен бот.
- PostgreSQL: локальный через Docker Compose или тестовый кластер.
- Публичные ссылки на документы для consent screen.

## 2. Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
TELEGRAM_WEBHOOK_SECRET=
PUBLIC_BOT_URL=
DATABASE_URL=postgres://bot:bot_password@localhost:5432/elizaveta_bot
DATABASE_SSL=false
OWNER_TELEGRAM_USERNAME=
PUBLIC_CHANNEL_URL=
PUBLIC_SITE_URL=
PERSONAL_DATA_POLICY_URL=https://disk.yandex.ru/...
USER_AGREEMENT_URL=https://disk.yandex.ru/...
PERSONAL_DATA_CONSENT_URL=https://disk.yandex.ru/...
PUBLIC_OFFER_URL=https://disk.yandex.ru/...
CONSENT_TEXT_VERSION=2026-05-17-v1
PORT=3000
NODE_ENV=development
```

Все четыре ссылки на документы обязательны: без них бот не должен запускаться.

## 3. Локальная база

Запуск PostgreSQL и NocoDB:

```bash
docker compose -f docker-compose.local.yml up -d
```

Схема применится автоматически при первом создании volume. Если база уже была создана раньше, примените `database/schema.sql` вручную через SQL-клиент.

## 4. Установка и запуск

```bash
npm install
npm run dev
```

В Windows PowerShell может быть заблокирован `npm.ps1`. В таком случае используйте:

```bash
npm.cmd install
npm.cmd run dev
```

В development используется polling, webhook не нужен.

## 5. Проверка MVP

Проверьте вручную:

- `/start` показывает согласие, если его еще нет.
- До согласия заявки не создаются.
- Кнопка `✅ Согласен, продолжить` записывает согласие и открывает меню.
- `Записаться лично` создает клиента, lead и уведомление в чат.
- `Описать ситуацию` ожидает одно текстовое сообщение и сохраняет его в lead.
- `Система лояльности` создает событие `loyalty_interest`.
- `Контакты` показывает заполненные ссылки.
- `/cancel` сбрасывает текущий сценарий.
- `/help` объясняет работу бота.

Команды проверки:

```bash
npm run typecheck
npm run build
```
