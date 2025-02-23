import { users, type User, type InsertUser } from "@shared/schema";
import { drizzle } from 'drizzle-orm/node-postgres';
import { warnings, mutes, modLogs, economy, levels, shopItems, serverSettings, autoRoles, reactionRoles, channelSettings } from '@shared/schema';
import type { Warning, Mute, ModLog, Economy, Level, ShopItem, ServerSetting, AutoRole, ReactionRole, ChannelSetting } from '@shared/schema';
import type { InsertWarning, InsertMute, InsertModLog, InsertEconomy, InsertLevel, InsertShopItem, InsertServerSetting, InsertAutoRole, InsertReactionRole, InsertChannelSetting } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface IStorage {
  // Moderation
  createWarning(warning: InsertWarning): Promise<Warning>;
  createMute(mute: InsertMute): Promise<Mute>;
  createModLog(log: InsertModLog): Promise<ModLog>;
  getWarnings(userId: string, guildId: string): Promise<Warning[]>;
  getMutes(userId: string, guildId: string): Promise<Mute[]>;
  getModLogs(guildId: string): Promise<ModLog[]>;
  clearWarnings(userId: string, guildId: string): Promise<void>;

  // Economy
  getEconomy(userId: string, guildId: string): Promise<Economy | undefined>;
  createEconomy(data: InsertEconomy): Promise<Economy>;
  updateBalance(userId: string, guildId: string, amount: number): Promise<Economy>;
  updateBank(userId: string, guildId: string, amount: number): Promise<Economy>;
  getLeaderboard(guildId: string): Promise<Economy[]>;

  // Levels
  getLevel(userId: string, guildId: string): Promise<Level | undefined>;
  createLevel(data: InsertLevel): Promise<Level>;
  addXP(userId: string, guildId: string, amount: number): Promise<Level>;
  setLevel(userId: string, guildId: string, level: number): Promise<Level>;
  getLevelLeaderboard(guildId: string): Promise<Level[]>;

  // Shop
  createShopItem(item: InsertShopItem): Promise<ShopItem>;
  getShopItems(guildId: string): Promise<ShopItem[]>;
  updateShopItem(id: number, item: Partial<InsertShopItem>): Promise<ShopItem>;
  deleteShopItem(id: number): Promise<void>;

  // Server Settings
  getServerSettings(guildId: string): Promise<ServerSetting | undefined>;
  updateServerSettings(guildId: string, settings: Partial<InsertServerSetting>): Promise<ServerSetting>;

  // Roles
  createAutoRole(role: InsertAutoRole): Promise<AutoRole>;
  getAutoRoles(guildId: string): Promise<AutoRole[]>;
  createReactionRole(role: InsertReactionRole): Promise<ReactionRole>;
  getReactionRoles(guildId: string): Promise<ReactionRole[]>;

  // Channel Settings
  updateChannelSettings(channelId: string, settings: Partial<InsertChannelSetting>): Promise<ChannelSetting>;
  getChannelSettings(channelId: string): Promise<ChannelSetting | undefined>;
}

export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    this.db = drizzle(pool);
  }

  // Moderation methods
  async createWarning(warning: InsertWarning): Promise<Warning> {
    const [result] = await this.db.insert(warnings).values(warning).returning();
    return result;
  }

  async createMute(mute: InsertMute): Promise<Mute> {
    const [result] = await this.db.insert(mutes).values(mute).returning();
    return result;
  }

  async createModLog(log: InsertModLog): Promise<ModLog> {
    const [result] = await this.db.insert(modLogs).values(log).returning();
    return result;
  }

  async getWarnings(userId: string, guildId: string): Promise<Warning[]> {
    return await this.db.select().from(warnings)
      .where(and(
        eq(warnings.userId, userId),
        eq(warnings.guildId, guildId)
      ));
  }

  async getMutes(userId: string, guildId: string): Promise<Mute[]> {
    return await this.db.select().from(mutes)
      .where(and(
        eq(mutes.userId, userId),
        eq(mutes.guildId, guildId)
      ));
  }

  async getModLogs(guildId: string): Promise<ModLog[]> {
    return await this.db.select().from(modLogs)
      .where(eq(modLogs.guildId, guildId))
      .orderBy(desc(modLogs.timestamp));
  }

  async clearWarnings(userId: string, guildId: string): Promise<void> {
    await this.db.delete(warnings)
      .where(and(
        eq(warnings.userId, userId),
        eq(warnings.guildId, guildId)
      ));
  }

  // Economy methods
  async getEconomy(userId: string, guildId: string): Promise<Economy | undefined> {
    const [result] = await this.db.select().from(economy)
      .where(and(
        eq(economy.userId, userId),
        eq(economy.guildId, guildId)
      ));
    return result;
  }

  async createEconomy(data: InsertEconomy): Promise<Economy> {
    const [result] = await this.db.insert(economy).values(data).returning();
    return result;
  }

  async updateBalance(userId: string, guildId: string, amount: number): Promise<Economy> {
    const [result] = await this.db
      .update(economy)
      .set({
        balance: sql`${economy.balance} + ${amount}`
      })
      .where(and(
        eq(economy.userId, userId),
        eq(economy.guildId, guildId)
      ))
      .returning();
    return result;
  }

  async updateBank(userId: string, guildId: string, amount: number): Promise<Economy> {
    const [result] = await this.db
      .update(economy)
      .set({
        bank: sql`${economy.bank} + ${amount}`
      })
      .where(and(
        eq(economy.userId, userId),
        eq(economy.guildId, guildId)
      ))
      .returning();
    return result;
  }

  async getLeaderboard(guildId: string): Promise<Economy[]> {
    return await this.db.select().from(economy)
      .where(eq(economy.guildId, guildId))
      .orderBy(desc(sql`${economy.balance} + ${economy.bank}`))
      .limit(10);
  }

  // Level methods
  async getLevel(userId: string, guildId: string): Promise<Level | undefined> {
    const [result] = await this.db.select().from(levels)
      .where(and(
        eq(levels.userId, userId),
        eq(levels.guildId, guildId)
      ));
    return result;
  }

  async createLevel(data: InsertLevel): Promise<Level> {
    const [result] = await this.db.insert(levels).values(data).returning();
    return result;
  }

  async addXP(userId: string, guildId: string, amount: number): Promise<Level> {
    const [result] = await this.db
      .update(levels)
      .set({
        xp: sql`${levels.xp} + ${amount}`,
        lastMessage: new Date()
      })
      .where(and(
        eq(levels.userId, userId),
        eq(levels.guildId, guildId)
      ))
      .returning();
    return result;
  }

  async setLevel(userId: string, guildId: string, level: number): Promise<Level> {
    const [result] = await this.db
      .update(levels)
      .set({ level })
      .where(and(
        eq(levels.userId, userId),
        eq(levels.guildId, guildId)
      ))
      .returning();
    return result;
  }

  async getLevelLeaderboard(guildId: string): Promise<Level[]> {
    return await this.db.select().from(levels)
      .where(eq(levels.guildId, guildId))
      .orderBy(desc(levels.level), desc(levels.xp))
      .limit(10);
  }

  // Shop methods
  async createShopItem(item: InsertShopItem): Promise<ShopItem> {
    const [result] = await this.db.insert(shopItems).values(item).returning();
    return result;
  }

  async getShopItems(guildId: string): Promise<ShopItem[]> {
    return await this.db.select().from(shopItems)
      .where(eq(shopItems.guildId, guildId));
  }

  async updateShopItem(id: number, item: Partial<InsertShopItem>): Promise<ShopItem> {
    const [result] = await this.db
      .update(shopItems)
      .set(item)
      .where(eq(shopItems.id, id))
      .returning();
    return result;
  }

  async deleteShopItem(id: number): Promise<void> {
    await this.db.delete(shopItems).where(eq(shopItems.id, id));
  }

  // Server Settings methods
  async getServerSettings(guildId: string): Promise<ServerSetting | undefined> {
    const [result] = await this.db.select().from(serverSettings)
      .where(eq(serverSettings.guildId, guildId));
    return result;
  }

  async updateServerSettings(guildId: string, settings: Partial<InsertServerSetting>): Promise<ServerSetting> {
    const [result] = await this.db
      .update(serverSettings)
      .set(settings)
      .where(eq(serverSettings.guildId, guildId))
      .returning();
    return result;
  }

  // Role methods
  async createAutoRole(role: InsertAutoRole): Promise<AutoRole> {
    const [result] = await this.db.insert(autoRoles).values(role).returning();
    return result;
  }

  async getAutoRoles(guildId: string): Promise<AutoRole[]> {
    return await this.db.select().from(autoRoles)
      .where(eq(autoRoles.guildId, guildId));
  }

  async createReactionRole(role: InsertReactionRole): Promise<ReactionRole> {
    const [result] = await this.db.insert(reactionRoles).values(role).returning();
    return result;
  }

  async getReactionRoles(guildId: string): Promise<ReactionRole[]> {
    return await this.db.select().from(reactionRoles)
      .where(eq(reactionRoles.guildId, guildId));
  }

  // Channel Settings methods
  async updateChannelSettings(channelId: string, settings: Partial<InsertChannelSetting>): Promise<ChannelSetting> {
    const [result] = await this.db
      .update(channelSettings)
      .set(settings)
      .where(eq(channelSettings.channelId, channelId))
      .returning();
    return result;
  }

  async getChannelSettings(channelId: string): Promise<ChannelSetting | undefined> {
    const [result] = await this.db.select().from(channelSettings)
      .where(eq(channelSettings.channelId, channelId));
    return result;
  }
}

export const storage = new PostgresStorage();