import express from "express";
import { webhookCallback } from "grammy";
import { createBot } from "./bot";
import { config } from "./config";
import { closePool } from "./db/pool";

async function startPolling(): Promise<void> {
  const bot = createBot();

  process.once("SIGINT", () => {
    bot.stop();
  });

  process.once("SIGTERM", () => {
    bot.stop();
  });

  await bot.start({
    onStart: (botInfo) => {
      console.log(`Bot @${botInfo.username} started in polling mode`);
    }
  });

  await closePool();
}

function startWebhookServer(): void {
  const bot = createBot();
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.post("/telegram/webhook", (req, res, next) => {
    const secret = req.header("X-Telegram-Bot-Api-Secret-Token");

    if (secret !== config.telegramWebhookSecret) {
      res.sendStatus(401);
      return;
    }

    next();
  });

  app.post("/telegram/webhook", webhookCallback(bot, "express"));

  const server = app.listen(config.port, () => {
    console.log(`Bot webhook server is listening on port ${config.port}`);
  });

  const shutdown = (): void => {
    server.close(() => {
      closePool()
        .catch((error) => {
          console.error("Failed to close database pool", error);
        })
        .finally(() => {
          process.exit(0);
        });
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

if (config.nodeEnv === "production") {
  startWebhookServer();
} else {
  startPolling().catch((error) => {
    console.error("Failed to start bot in polling mode", error);
    closePool()
      .catch((poolError) => {
        console.error("Failed to close database pool", poolError);
      })
      .finally(() => {
        process.exit(1);
      });
  });
}
