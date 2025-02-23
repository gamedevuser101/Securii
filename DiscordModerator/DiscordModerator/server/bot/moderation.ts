import { 
  PermissionFlagsBits, 
  GuildMember,
  TextChannel,
  Message,
  CommandInteraction,
  ChatInputCommandInteraction
} from 'discord.js';
import { storage } from '../storage';
import { checkPermissions, formatDuration, getMemberFromCommand, getStringOption, createEmbed } from './utils';

const COMMAND_COOLDOWN = 3000; // 3 seconds

export const ban = async (source: Message | ChatInputCommandInteraction) => {
  if (!checkPermissions(source, PermissionFlagsBits.BanMembers)) return;

  const member = getMemberFromCommand(source);
  const reason = source instanceof Message ? 
    source.content.split(' ').slice(2).join(' ') : 
    source.options.getString('reason') ?? 'No reason provided';

  if (!member) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify a member to ban',
      color: 'Red'
    });
    return source.reply({ embeds: [embed] });
  }

  try {
    await member.ban({ reason });
    const embed = createEmbed({
      title: '🔨 Member Banned',
      description: `Successfully banned ${member.user.tag}`,
      color: 'Green',
      fields: [
        { name: 'Member', value: member.user.tag, inline: true },
        { name: 'Reason', value: reason, inline: true }
      ],
      timestamp: true
    });
    return source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to ban member. Check my permissions and role hierarchy.',
      color: 'Red'
    });
    return source.reply({ embeds: [embed] });
  }
};

export const kick = async (source: Message | ChatInputCommandInteraction) => {
  if (!checkPermissions(source, PermissionFlagsBits.KickMembers)) return;

  const member = getMemberFromCommand(source);
  const reason = source instanceof Message ? 
    source.content.split(' ').slice(2).join(' ') : 
    source.options.getString('reason') ?? 'No reason provided';

  if (!member) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify a member to kick',
      color: 'Red'
    });
    return source.reply({ embeds: [embed] });
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
    return source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to kick member. Check my permissions and role hierarchy.',
      color: 'Red'
    });
    return source.reply({ embeds: [embed] });
  }
};

export const warn = async (source: Message | ChatInputCommandInteraction) => {
  if (!checkPermissions(source, PermissionFlagsBits.ModerateMembers)) return;

  const member = getMemberFromCommand(source);
  const reason = source instanceof Message ? 
    source.content.split(' ').slice(2).join(' ') : 
    source.options.getString('reason') ?? 'No reason provided';

  if (!member) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify a member to warn',
      color: 'Red'
    });
    return source.reply({ embeds: [embed] });
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
    return source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to warn member.',
      color: 'Red'
    });
    return source.reply({ embeds: [embed] });
  }
};

export const mute = async (source: Message | ChatInputCommandInteraction) => {
  if (!checkPermissions(source, PermissionFlagsBits.ModerateMembers)) return;

  const member = getMemberFromCommand(source);
  const duration = source instanceof Message ? 
    source.content.split(' ')[2] : 
    source.options.getString('duration');
  const reason = source instanceof Message ? 
    source.content.split(' ').slice(3).join(' ') : 
    source.options.getString('reason') ?? 'No reason provided';

  if (!member || !duration) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify a member and duration (!mute @user 1h reason)',
      color: 'Red'
    });
    return source.reply({ embeds: [embed] });
  }

  try {
    const durationMs = formatDuration(duration);
    if (!durationMs) {
      const embed = createEmbed({
        title: '❌ Invalid Duration',
        description: 'Invalid duration format. Use 1m, 1h, 1d etc.',
        color: 'Red'
      });
      return source.reply({ embeds: [embed] });
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
    return source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to mute member. Check my permissions and role hierarchy.',
      color: 'Red'
    });
    return source.reply({ embeds: [embed] });
  }
};

export const purge = async (source: Message | ChatInputCommandInteraction) => {
  if (!checkPermissions(source, PermissionFlagsBits.ManageMessages)) return;

  const amount = source instanceof Message ? 
    parseInt(source.content.split(' ')[1]) : 
    source.options.getInteger('amount', true);

  if (isNaN(amount)) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please provide a valid number of messages to delete',
      color: 'Red'
    });
    return source.reply({ embeds: [embed] });
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
    return source.reply({ embeds: [embed] });
  }
};

export const help = async (source: Message | ChatInputCommandInteraction) => {
  const embed = createEmbed({
    title: '📚 Moderation Commands',
    description: 'Available as both slash commands and prefix commands (!):',
    color: 'Blue',
    fields: [
      { name: '🔨 Ban', value: '`/ban @user [reason]` - Ban a user from the server', inline: false },
      { name: '👢 Kick', value: '`/kick @user [reason]` - Kick a user from the server', inline: false },
      { name: '⚠️ Warn', value: '`/warn @user [reason]` - Issue a warning to a user', inline: false },
      { name: '🔇 Mute', value: '`/mute @user [duration] [reason]` - Temporarily mute a user', inline: false },
      { name: '🗑️ Purge', value: '`/purge [amount]` - Delete messages', inline: false },
      { name: '❓ Help', value: '`/help` - Show this help message', inline: false }
    ],
    timestamp: true
  });

  const content = { embeds: [embed], ephemeral: source instanceof ChatInputCommandInteraction };
  if (source instanceof Message) {
    await source.channel.send(content);
  } else {
    await source.reply(content);
  }
};