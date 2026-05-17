import express from "express";
import type { Server } from "http";
import { createBot } from "./bot";
import { config } from "./config";
import { closePool } from "./db/pool";

function createHealthApp(mode: typeof config.botMode): express.Express {
  const app = express();

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, mode });
  });

  return app;
}

function startHealthServer(mode: typeof config.botMode): Server {
  const app = createHealthApp(mode);

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

function isAbortedDelay(error: unknown): boolean {
  return error instanceof Error && error.message === "Aborted delay";
}

async function startPolling(): Promise<void> {
  console.log("Bot is starting in polling mode");

  const bot = createBot();
  const healthServer = startHealthServer("polling");
  let shutdownRequested = false;

  const stopPolling = (signal: NodeJS.Signals): void => {
    shutdownRequested = true;
    console.log(`Received ${signal}, stopping polling bot`);

    void bot.stop().catch((error) => {
      if (!isAbortedDelay(error)) {
        console.error("Failed to stop polling bot", error);
      }
    });
  };

  process.once("SIGINT", () => stopPolling("SIGINT"));
  process.once("SIGTERM", () => stopPolling("SIGTERM"));

  bot.catch((error) => {
    console.error("Bot update error", error);
  });

  try {
    await bot.init();
    console.log(`Bot @${bot.botInfo.username} initialized`);

    if (shutdownRequested) {
      return;
    }

    await bot.start({
      drop_pending_updates: true,
      onStart: (botInfo) => {
        console.log(`Bot @${botInfo.username} started in polling mode`);
      }
    });
  } catch (error) {
    if (shutdownRequested && isAbortedDelay(error)) {
      return;
    }

    throw error;
  } finally {
    await closeServer(healthServer).catch((error) => {
      console.error("Failed to close health server", error);
    });
    await closePool().catch((error) => {
      console.error("Failed to close database pool", error);
    });
  }
}

function startWebhookServer(): void {
  const bot = createBot();
  const app = createHealthApp("webhook");

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
