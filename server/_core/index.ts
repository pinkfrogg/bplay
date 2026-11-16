import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

const CRAWLER_USER_AGENT = /bot|crawler|spider|slurp|bingpreview|semrush|ahrefs|bytespider|scrapy|headless/i;
const NO_INDEX_ROBOTS = "noindex, nofollow, noarchive, nosnippet, noimageindex";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function clientAddress(req: express.Request) {
  const forwarded = req.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.ip || req.socket.remoteAddress || "unknown";
}

function rateLimit(req: express.Request, res: express.Response) {
  const now = Date.now();
  const key = clientAddress(req);
  const existing = requestCounts.get(key);
  const entry = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
    : existing;
  entry.count += 1;
  requestCounts.set(key, entry);

  if (requestCounts.size > 5000) {
    requestCounts.forEach((value, address) => {
      if (value.resetAt <= now) requestCounts.delete(address);
    });
  }

  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count);
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
    res.status(429).type("text/plain").send("Too many requests. Please try again shortly.");
    return false;
  }
  return true;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Defense in depth: robots.txt is advisory, so also send an HTTP directive.
  app.use((req, res, next) => {
    res.setHeader("X-Robots-Tag", NO_INDEX_ROBOTS);
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });

  // Apply a modest per-client limit to slow automated enumeration without denying normal browsing or app APIs.
  app.use((req, res, next) => {
    if (rateLimit(req, res)) next();
  });

  // Decline common crawler/scraper user agents on public navigation and assets.
  // API traffic remains available for the application itself.
  app.use((req, res, next) => {
    const isExempt = req.path === "/robots.txt" || req.path.startsWith("/api/");
    if (!isExempt && CRAWLER_USER_AGENT.test(req.get("user-agent") ?? "")) {
      res.status(403).type("text/plain").send("Automated access is not permitted.");
      return;
    }
    next();
  });
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = process.env.PORT ? preferredPort : await findAvailablePort(preferredPort);

  if (!process.env.PORT && port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
