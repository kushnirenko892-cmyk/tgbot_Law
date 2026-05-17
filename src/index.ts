import express from "express";
import type { Server } from "http";
import { createBot } from "./bot";
import { config } from "./config";
import { closePool } from "./db/pool";

function createHealthApp(): express.Express {
  const app = express();

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  return app;
}

function startHealthServer(): Server {
  const app = createHealthApp();

  return app.listen(config.port, () => {
    console.log(`Bot health server is listening on port ${config.port}`);
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function startPolling(): Promise<void> {
  const bot = createBot();
  const healthServer = startHealthServer();

  process.once("SIGINT", () => {
    bot.stop();
  });

  process.once("SIGTERM", () => {
    bot.stop();
  });

  try {
    await bot.start({
      onStart: (botInfo) => {
        console.log(`Bot @${botInfo.username} started in polling mode`);
      }
    });
  } finally {
    await closeServer(healthServer).catch((error) => {
      console.error("Failed to close health server", error);
    });
    await closePool();
  }
}

function startWebhookServer(): void {
  const bot = createBot();
  const app = createHealthApp();

  app.use(express.json());

  app.post("/telegram/webhook", async (req, res, next) => {
    const secret = req.header("X-Telegram-Bot-Api-Secret-Token");

    if (secret !== config.telegramWebhookSecret) {
      res.sendStatus(401);
      return;
    }

    try {
      await bot.handleUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

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

if (config.botMode === "webhook") {
  startWebhookServer();
} else {
  startPolling().catch((error) => {
    console.error("Failed to start bot in polling mode", error);
    process.exit(1);
  });
}
