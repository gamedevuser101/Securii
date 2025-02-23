import { pgTable, text, serial, integer, timestamp, boolean, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Warnings table
export const warnings = pgTable("warnings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  guildId: text("guild_id").notNull(),
  reason: text("reason").notNull(),
  moderatorId: text("moderator_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow()
});

// Mutes table
export const mutes = pgTable("mutes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  guildId: text("guild_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  moderatorId: text("moderator_id").notNull()
});

// Moderation logs table
export const modLogs = pgTable("mod_logs", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  userId: text("user_id").notNull(),
  moderatorId: text("moderator_id").notNull(),
  action: text("action").notNull(),
  reason: text("reason"),
  timestamp: timestamp("timestamp").notNull().defaultNow()
});

// Auto roles table
export const autoRoles = pgTable("auto_roles", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  roleId: text("role_id").notNull(),
  enabled: boolean("enabled").notNull().default(true)
});

// Reaction roles table
export const reactionRoles = pgTable("reaction_roles", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  channelId: text("channel_id").notNull(),
  messageId: text("message_id").notNull(),
  roleId: text("role_id").notNull(),
  emoji: text("emoji").notNull()
});

// Channel settings table
export const channelSettings = pgTable("channel_settings", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  channelId: text("channel_id").notNull(),
  slowMode: integer("slow_mode"),
  locked: boolean("locked").default(false)
});

// Server settings table
export const serverSettings = pgTable("server_settings", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  antiSpam: boolean("anti_spam").default(false),
  antiRaid: boolean("anti_raid").default(false),
  ghostPing: boolean("ghost_ping").default(false),
  modLogChannel: text("mod_log_channel"),
  suggestChannel: text("suggest_channel"),
  levelSystem: boolean("level_system").default(true),
  economySystem: boolean("economy_system").default(true),
  modRoles: text("mod_roles"),
  verificationEnabled: boolean("verification_enabled").default(false),
  verificationChannel: text("verification_channel"),
  verificationRole: text("verification_role"),
  verificationMessage: text("verification_message").default('React to verify'),
  maxWarnings: integer("max_warnings").default(3),
  autoModEnabled: boolean("auto_mod_enabled").default(false),
  autoModActions: jsonb("auto_mod_actions").default({})
});

// Economy table
export const economy = pgTable("economy", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  guildId: text("guild_id").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  bank: decimal("bank", { precision: 10, scale: 2 }).notNull().default("0"),
  lastDaily: timestamp("last_daily"),
  lastWork: timestamp("last_work"),
  inventory: jsonb("inventory").default({})
});

// Level system table
export const levels = pgTable("levels", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  guildId: text("guild_id").notNull(),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(0),
  lastMessage: timestamp("last_message").notNull().defaultNow()
});

// Shop items table
export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  role: text("role_id"),
  stock: integer("stock").default(-1) // -1 means unlimited
});

// Create insert schemas
export const insertWarningSchema = createInsertSchema(warnings).omit({ 
  id: true,
  timestamp: true 
});

export const insertMuteSchema = createInsertSchema(mutes).omit({
  id: true
});

export const insertModLogSchema = createInsertSchema(modLogs).omit({
  id: true,
  timestamp: true
});

export const insertAutoRoleSchema = createInsertSchema(autoRoles).omit({
  id: true
});

export const insertReactionRoleSchema = createInsertSchema(reactionRoles).omit({
  id: true
});

export const insertChannelSettingSchema = createInsertSchema(channelSettings).omit({
  id: true
});

export const insertServerSettingSchema = createInsertSchema(serverSettings).omit({
  id: true
});

export const insertEconomySchema = createInsertSchema(economy).omit({
  id: true,
  lastDaily: true,
  lastWork: true
});

export const insertLevelSchema = createInsertSchema(levels).omit({
  id: true,
  lastMessage: true
});

export const insertShopItemSchema = createInsertSchema(shopItems).omit({
  id: true
});

// Export types
export type InsertWarning = z.infer<typeof insertWarningSchema>;
export type Warning = typeof warnings.$inferSelect;
export type InsertMute = z.infer<typeof insertMuteSchema>;
export type Mute = typeof mutes.$inferSelect;
export type InsertModLog = z.infer<typeof insertModLogSchema>;
export type ModLog = typeof modLogs.$inferSelect;
export type InsertAutoRole = z.infer<typeof insertAutoRoleSchema>;
export type AutoRole = typeof autoRoles.$inferSelect;
export type InsertReactionRole = z.infer<typeof insertReactionRoleSchema>;
export type ReactionRole = typeof reactionRoles.$inferSelect;
export type InsertChannelSetting = z.infer<typeof insertChannelSettingSchema>;
export type ChannelSetting = typeof channelSettings.$inferSelect;
export type InsertServerSetting = z.infer<typeof insertServerSettingSchema>;
export type ServerSetting = typeof serverSettings.$inferSelect;
export type InsertEconomy = z.infer<typeof insertEconomySchema>;
export type Economy = typeof economy.$inferSelect;
export type InsertLevel = z.infer<typeof insertLevelSchema>;
export type Level = typeof levels.$inferSelect;
export type InsertShopItem = z.infer<typeof insertShopItemSchema>;
export type ShopItem = typeof shopItems.$inferSelect;