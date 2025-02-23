import { 
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
  Message,
  ChatInputCommandInteraction
} from 'discord.js';
import { storage } from '../../storage';
import { checkPermissions, createEmbed } from '../utils';
import type { CommandFunction } from '../types';

export const lock: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.ManageChannels)) {
    return;
  }

  const channel = source.channel as TextChannel;
  try {
    await channel.permissionOverwrites.edit(source.guild!.roles.everyone, {
      SendMessages: false
    });

    await storage.createModLog({
      userId: source instanceof Message ? source.author.id : source.user.id,
      guildId: source.guild!.id,
      moderatorId: source instanceof Message ? source.author.id : source.user.id,
      action: 'lock',
      reason: `Channel ${channel.name} locked`
    });

    await source.reply({
      embeds: [createEmbed({
        title: '🔒 Channel Locked',
        description: `Successfully locked ${channel.name}`,
        color: 'Red',
        timestamp: true
      })]
    });
  } catch (error) {
    await source.reply({
      embeds: [createEmbed({
        title: '❌ Error',
        description: 'Failed to lock channel. Check my permissions.',
        color: 'Red'
      })]
    });
  }
};

export const unlock: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.ManageChannels)) {
    return;
  }

  const channel = source.channel as TextChannel;
  try {
    await channel.permissionOverwrites.edit(source.guild!.roles.everyone, {
      SendMessages: null
    });

    await storage.createModLog({
      userId: source instanceof Message ? source.author.id : source.user.id,
      guildId: source.guild!.id,
      moderatorId: source instanceof Message ? source.author.id : source.user.id,
      action: 'unlock',
      reason: `Channel ${channel.name} unlocked`
    });

    await source.reply({
      embeds: [createEmbed({
        title: '🔓 Channel Unlocked',
        description: `Successfully unlocked ${channel.name}`,
        color: 'Green',
        timestamp: true
      })]
    });
  } catch (error) {
    await source.reply({
      embeds: [createEmbed({
        title: '❌ Error',
        description: 'Failed to unlock channel. Check my permissions.',
        color: 'Red'
      })]
    });
  }
};

export const slowmode: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.ManageChannels)) {
    return;
  }

  const seconds = source instanceof Message 
    ? parseInt(source.content.split(' ')[1])
    : source.options.getInteger('seconds', true);

  if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
    await source.reply({
      embeds: [createEmbed({
        title: '❌ Error',
        description: 'Please provide a valid slowmode duration (0-21600 seconds)',
        color: 'Red'
      })]
    });
    return;
  }

  const channel = source.channel as TextChannel;
  try {
    await channel.setRateLimitPerUser(seconds);

    await storage.createModLog({
      userId: source instanceof Message ? source.author.id : source.user.id,
      guildId: source.guild!.id,
      moderatorId: source instanceof Message ? source.author.id : source.user.id,
      action: 'slowmode',
      reason: `Slowmode set to ${seconds} seconds in ${channel.name}`
    });

    await source.reply({
      embeds: [createEmbed({
        title: '⏱️ Slowmode Updated',
        description: seconds === 0 
          ? `Slowmode disabled in ${channel.name}`
          : `Slowmode set to ${seconds} seconds in ${channel.name}`,
        color: 'Blue',
        timestamp: true
      })]
    });
  } catch (error) {
    await source.reply({
      embeds: [createEmbed({
        title: '❌ Error',
        description: 'Failed to set slowmode. Check my permissions.',
        color: 'Red'
      })]
    });
  }
};

// Command Builders for Slash Commands
export const channelCommands = [
  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock the current channel'),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the current channel'),

  new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for the current channel')
    .addIntegerOption(option =>
      option.setName('seconds')
        .setDescription('Slowmode duration in seconds (0-21600)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)),
].map(command => command.toJSON());

// Command mapping for both slash and prefix commands
export const channelCommandsMap = new Map<string, CommandFunction>([
  ['lock', lock],
  ['unlock', unlock],
  ['slowmode', slowmode],
]);
