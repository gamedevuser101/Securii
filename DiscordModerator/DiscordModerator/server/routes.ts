import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeBot } from "./bot";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize Discord bot
  await initializeBot();

  return httpServer;
}
