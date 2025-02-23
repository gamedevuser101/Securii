import { Client, Collection } from 'discord.js';
import { slashCommands as moderationCommands, commandMap as moderationCommandMap } from './moderation';
import { channelCommands, channelCommandsMap } from './channel';
import { economyCommands, economyCommandsMap } from './economy';
import { roleCommands, commandMap as roleCommandMap } from './roles';
import { utilityCommands, commandMap as utilityCommandMap } from './utility';
import type { CommandFunction } from '../types';

// Combine all slash commands
export function getSlashCommands() {
  const commands = [
    ...moderationCommands,
    ...channelCommands,
    ...economyCommands,
    ...roleCommands,
    ...utilityCommands,
  ];
  console.log(`Registering ${commands.length} slash commands`);
  return commands;
}

// Register all commands
export function registerCommands(client: Client) {
  // Initialize commands collection if not already done
  if (!client.commands) {
    client.commands = new Collection<string, CommandFunction>();
  }

  // Initialize cooldowns collection
  if (!client.cooldowns) {
    client.cooldowns = new Collection();
  }

  // Register all command categories
  const commandMaps = [
    moderationCommandMap,
    channelCommandsMap,
    economyCommandsMap,
    roleCommandMap,
    utilityCommandMap,
  ];

  let totalCommands = 0;
  for (const commandMap of commandMaps) {
    for (const [name, command] of commandMap) {
      client.commands.set(name, command);
      totalCommands++;
    }
  }

  console.log(`Registered ${totalCommands} commands`);
}