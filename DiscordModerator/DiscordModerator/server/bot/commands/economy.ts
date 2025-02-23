import { 
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder
} from 'discord.js';
import { storage } from '../../storage';
import { createEmbed } from '../utils';
import type { CommandFunction } from '../types';

// Command implementations
export const balance: CommandFunction = async (source) => {
  const userId = source instanceof Message ? source.author.id : source.user.id;
  const guildId = source.guild!.id;

  try {
    let economy = await storage.getEconomy(userId, guildId);
    if (!economy) {
      economy = await storage.createEconomy({
        userId,
        guildId,
        balance: "0",
        bank: "0"
      });
    }

    const embed = createEmbed({
      title: '💰 Balance',
      description: 'Your current balance',
      color: 'Green',
      fields: [
        { name: 'Wallet', value: `$${economy.balance}`, inline: true },
        { name: 'Bank', value: `$${economy.bank}`, inline: true },
        { name: 'Total', value: `$${Number(economy.balance) + Number(economy.bank)}`, inline: true }
      ],
      timestamp: true
    });

    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to fetch balance.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

export const daily: CommandFunction = async (source) => {
  const userId = source instanceof Message ? source.author.id : source.user.id;
  const guildId = source.guild!.id;
  const amount = 100; // Daily reward amount

  try {
    let economy = await storage.getEconomy(userId, guildId);
    if (!economy) {
      economy = await storage.createEconomy({
        userId,
        guildId,
        balance: "0",
        bank: "0"
      });
    }

    if (economy.lastDaily && Date.now() - economy.lastDaily.getTime() < 24 * 60 * 60 * 1000) {
      const nextDaily = new Date(economy.lastDaily.getTime() + 24 * 60 * 60 * 1000);
      const timeLeft = nextDaily.getTime() - Date.now();
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

      const embed = createEmbed({
        title: '⏰ Daily Reward',
        description: `You can claim your next daily reward in ${hoursLeft}h ${minutesLeft}m`,
        color: 'Red'
      });
      await source.reply({ embeds: [embed] });
      return;
    }

    economy = await storage.updateBalance(userId, guildId, amount);
    
    const embed = createEmbed({
      title: '💰 Daily Reward',
      description: `You received your daily reward of $${amount}!`,
      color: 'Green',
      fields: [
        { name: 'New Balance', value: `$${economy.balance}`, inline: true }
      ],
      timestamp: true
    });

    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to claim daily reward.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

// More economy commands will be added here...

// Slash command builders
export const economyCommands = [
  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your balance'),

  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward'),

  // More commands will be added...
].map(command => command.toJSON());

// Command map for both slash and prefix commands
export const economyCommandsMap = new Map<string, CommandFunction>([
  ['balance', balance],
  ['daily', daily],
  // More commands will be added...
]);
