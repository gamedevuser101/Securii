import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { registerCommands, getSlashCommands } from './commands';
import { registerEvents } from './events';
import { storage } from '../storage';
import './types';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ]
});

// Initialize collections
client.commands = new Collection();
client.cooldowns = new Collection();

export async function initializeBot() {
  if (!process.env.DISCORD_TOKEN) {
    throw new Error('DISCORD_TOKEN is required');
  }

  // Register commands and events first
  registerCommands(client);
  registerEvents(client);

  // Login to Discord
  try {
    await client.login(process.env.DISCORD_TOKEN);
    console.log('Bot logged in successfully');

    // Register slash commands after bot is logged in
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(
      Routes.applicationCommands(client.user!.id),
      { body: getSlashCommands() }
    );
    console.log('Successfully registered slash commands');
  } catch (error) {
    console.error('Error initializing bot:', error);
    throw error;
  }

  return client;
}