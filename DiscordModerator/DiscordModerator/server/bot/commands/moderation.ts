import { 
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  Message,
  GuildMember,
  TextChannel,
  EmbedBuilder
} from 'discord.js';
import { storage } from '../../storage';
import { checkPermissions, formatDuration, createEmbed } from '../utils';
import type { CommandFunction } from '../types';

// Command implementations
export const ban: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.BanMembers)) {
    return;
  }

  let member: GuildMember | null = null;
  let reason = 'No reason provided';

  if (source instanceof Message) {
    member = source.mentions.members?.first() ?? null;
    const args = source.content.split(' ').slice(2);
    if (args.length > 0) reason = args.join(' ');
  } else {
    member = source.options.getMember('user') as GuildMember;
    reason = source.options.getString('reason') ?? reason;
  }

  if (!member) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify a member to ban',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
    return;
  }

  try {
    await member.ban({ reason });
    const embed = createEmbed({
      title: '🔨 Member Banned',
      description: `Successfully banned ${member.user.tag}`,
      color: 'Red',
      fields: [
        { name: 'Member', value: member.user.tag, inline: true },
        { name: 'Reason', value: reason, inline: true }
      ],
      timestamp: true
    });
    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to ban member. Check my permissions and role hierarchy.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

export const kick: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.KickMembers)) return;

  let member: GuildMember | null = null;
  let reason = 'No reason provided';

  if (source instanceof Message) {
    member = source.mentions.members?.first() ?? null;
    const args = source.content.split(' ').slice(2);
    if (args.length > 0) reason = args.join(' ');
  } else {
    member = source.options.getMember('user') as GuildMember;
    reason = source.options.getString('reason') ?? reason;
  }

  if (!member) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify a member to kick',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
    return;
  }

  try {
    await member.kick(reason);
    const embed = createEmbed({
      title: '👢 Member Kicked',
      description: `Successfully kicked ${member.user.tag}`,
      color: 'Orange',
      fields: [
        { name: 'Member', value: member.user.tag, inline: true },
        { name: 'Reason', value: reason, inline: true }
      ],
      timestamp: true
    });
    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to kick member. Check my permissions and role hierarchy.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

export const warn: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.ModerateMembers)) return;

  let member: GuildMember | null = null;
  let reason = 'No reason provided';

  if (source instanceof Message) {
    member = source.mentions.members?.first() ?? null;
    const args = source.content.split(' ').slice(2);
    if (args.length > 0) reason = args.join(' ');
  } else {
    member = source.options.getMember('user') as GuildMember;
    reason = source.options.getString('reason') ?? reason;
  }

  if (!member) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify a member to warn',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
    return;
  }

  try {
    await storage.createWarning({
      userId: member.id,
      guildId: source.guild!.id,
      reason,
      moderatorId: source instanceof Message ? source.author.id : source.user.id
    });

    const embed = createEmbed({
      title: '⚠️ Member Warned',
      description: `Successfully warned ${member.user.tag}`,
      color: 'Yellow',
      fields: [
        { name: 'Member', value: member.user.tag, inline: true },
        { name: 'Reason', value: reason, inline: true }
      ],
      timestamp: true
    });
    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to warn member.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

export const mute: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.ModerateMembers)) return;

  let member: GuildMember | null = null;
  let duration: string | null = null;
  let reason = 'No reason provided';

  if (source instanceof Message) {
    member = source.mentions.members?.first() ?? null;
    const args = source.content.split(' ').slice(2);
    duration = args[0];
    if (args.length > 1) reason = args.slice(1).join(' ');
  } else {
    member = source.options.getMember('user') as GuildMember;
    duration = source.options.getString('duration');
    reason = source.options.getString('reason') ?? reason;
  }

  if (!member || !duration) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify a member and duration (!mute @user 1h reason)',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
    return;
  }

  try {
    const durationMs = formatDuration(duration);
    if (!durationMs) {
      const embed = createEmbed({
        title: '❌ Invalid Duration',
        description: 'Invalid duration format. Use 1m, 1h, 1d etc.',
        color: 'Red'
      });
      await source.reply({ embeds: [embed] });
      return;
    }

    await member.timeout(durationMs, reason);

    await storage.createMute({
      userId: member.id,
      guildId: source.guild!.id,
      expiresAt: new Date(Date.now() + durationMs),
      moderatorId: source instanceof Message ? source.author.id : source.user.id
    });

    const embed = createEmbed({
      title: '🔇 Member Muted',
      description: `Successfully muted ${member.user.tag}`,
      color: 'Orange',
      fields: [
        { name: 'Member', value: member.user.tag, inline: true },
        { name: 'Duration', value: duration, inline: true },
        { name: 'Reason', value: reason, inline: true }
      ],
      timestamp: true
    });
    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to mute member. Check my permissions and role hierarchy.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

export const purge: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.ManageMessages)) return;

  let amount: number;

  if (source instanceof Message) {
    amount = parseInt(source.content.split(' ')[1]);
  } else {
    amount = source.options.getInteger('amount', true);
  }

  if (isNaN(amount)) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please provide a valid number of messages to delete',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
    return;
  }

  try {
    const channel = source.channel as TextChannel;
    const messages = await channel.bulkDelete(Math.min(amount + 1, 100));
    const embed = createEmbed({
      title: '🗑️ Messages Purged',
      description: `Deleted ${messages.size - 1} messages`,
      color: 'Green',
      timestamp: true
    });

    if (source instanceof Message) {
      const msg = await channel.send({ embeds: [embed] });
      setTimeout(() => msg.delete(), 3000);
    } else {
      await source.reply({ embeds: [embed], ephemeral: true });
    }
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to delete messages. Messages older than 14 days cannot be bulk deleted.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

// Extended moderation commands
export const unmute: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.ModerateMembers)) return;

  const member = source instanceof Message 
    ? source.mentions.members?.first() 
    : source.options.getMember('user') as GuildMember;

  if (!member) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify a member to unmute',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
    return;
  }

  try {
    await member.timeout(null);

    const embed = createEmbed({
      title: '🔊 Member Unmuted',
      description: `Successfully unmuted ${member.user.tag}`,
      color: 'Green',
      timestamp: true
    });
    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to unmute member. Check my permissions.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

export const softban: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.BanMembers)) return;

  const member = source instanceof Message 
    ? source.mentions.members?.first() 
    : source.options.getMember('user') as GuildMember;
  const reason = source instanceof Message 
    ? source.content.split(' ').slice(2).join(' ') 
    : source.options.getString('reason') ?? 'No reason provided';

  if (!member) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify a member to softban',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
    return;
  }

  try {
    await member.ban({ reason, deleteMessageSeconds: 60 * 60 * 24 * 7 }); // 7 days
    await source.guild!.members.unban(member.id, 'Softban completed');

    await storage.createModLog({
      userId: member.id,
      guildId: source.guild!.id,
      moderatorId: source instanceof Message ? source.author.id : source.user.id,
      action: 'softban',
      reason
    });

    const embed = createEmbed({
      title: '🔨 Member Softbanned',
      description: `Successfully softbanned ${member.user.tag}`,
      color: 'Orange',
      fields: [
        { name: 'Member', value: member.user.tag, inline: true },
        { name: 'Reason', value: reason, inline: true }
      ],
      timestamp: true
    });
    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to softban member. Check my permissions.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

export const clearwarns: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.ModerateMembers)) return;

  const member = source instanceof Message 
    ? source.mentions.members?.first() 
    : source.options.getMember('user') as GuildMember;

  if (!member) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify a member to clear warnings',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
    return;
  }

  try {
    await storage.clearWarnings(member.id, source.guild!.id);

    await storage.createModLog({
      userId: member.id,
      guildId: source.guild!.id,
      moderatorId: source instanceof Message ? source.author.id : source.user.id,
      action: 'clearwarns',
      reason: 'Warnings cleared'
    });

    const embed = createEmbed({
      title: '🧹 Warnings Cleared',
      description: `Successfully cleared all warnings for ${member.user.tag}`,
      color: 'Green',
      timestamp: true
    });
    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to clear warnings.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

export const warnings: CommandFunction = async (source) => {
  const member = source instanceof Message 
    ? source.mentions.members?.first() 
    : source.options.getMember('user') as GuildMember;

  if (!member) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify a member to view warnings',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
    return;
  }

  try {
    const warnings = await storage.getWarnings(member.id, source.guild!.id);

    const embed = createEmbed({
      title: '⚠️ Warning History',
      description: `Warnings for ${member.user.tag}`,
      color: 'Yellow',
      fields: warnings.map((warn, index) => ({
        name: `Warning #${index + 1}`,
        value: `Reason: ${warn.reason}\nModerator: <@${warn.moderatorId}>\nDate: <t:${Math.floor(warn.timestamp.getTime() / 1000)}:R>`,
        inline: false
      })),
      footer: `Total Warnings: ${warnings.length}`,
      timestamp: true
    });
    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to fetch warnings.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

export const modlogs: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.ViewAuditLog)) return;

  try {
    const logs = await storage.getModLogs(source.guild!.id);

    const embed = createEmbed({
      title: '📋 Moderation Logs',
      description: 'Recent moderation actions',
      color: 'Blue',
      fields: logs.slice(0, 10).map(log => ({
        name: `Action: ${log.action}`,
        value: `User: <@${log.userId}>\nModerator: <@${log.moderatorId}>\nReason: ${log.reason}\nDate: <t:${Math.floor(log.timestamp.getTime() / 1000)}:R>`,
        inline: false
      })),
      footer: 'Showing last 10 actions',
      timestamp: true
    });
    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to fetch moderation logs.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

// Slash command builders
export const slashCommands = [
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to warn')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the warning')),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to mute')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Duration of the mute (1m, 1h, 1d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the mute')),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to unmute')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Ban and immediately unban a user to clear their messages')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to softban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the softban')),

  new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Clear all warnings for a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to clear warnings for')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings for a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to view warnings for')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('modlogs')
    .setDescription('View recent moderation actions'),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete messages')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to delete')
        .setRequired(true))
].map(command => command.toJSON());

// Command map for both slash and prefix commands
export const commandMap = new Map<string, CommandFunction>([
  ['ban', ban],
  ['kick', kick],
  ['warn', warn],
  ['mute', mute],
  ['unmute', unmute],
  ['softban', softban],
  ['clearwarns', clearwarns],
  ['warnings', warnings],
  ['modlogs', modlogs],
  ['purge', purge]
]);