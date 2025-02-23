import { 
  PermissionFlagsBits,
  SlashCommandBuilder,
  GuildMember,
  TextChannel
} from 'discord.js';
import { storage } from '../../../storage';
import { checkPermissions, createEmbed, getMemberFromCommand, getStringOption, formatDuration } from '../../utils';
import type { CommandFunction } from '../../types';

// Basic Moderation Commands
export const ban: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.BanMembers)) return;

  const member = getMemberFromCommand(source);
  const reason = getStringOption(source, 'reason') ?? 'No reason provided';

  if (!member) {
    return source.reply({
      embeds: [createEmbed({
        title: '❌ Error',
        description: 'Please specify a member to ban',
        color: 'Red'
      })]
    });
  }

  try {
    await member.ban({ reason });
    
    await storage.createModLog({
      userId: member.id,
      guildId: source.guild!.id,
      moderatorId: source instanceof Message ? source.author.id : source.user.id,
      action: 'ban',
      reason
    });

    return source.reply({
      embeds: [createEmbed({
        title: '🔨 Member Banned',
        description: `Successfully banned ${member.user.tag}`,
        color: 'Red',
        fields: [
          { name: 'Member', value: member.user.tag, inline: true },
          { name: 'Reason', value: reason, inline: true }
        ],
        timestamp: true
      })]
    });
  } catch (error) {
    return source.reply({
      embeds: [createEmbed({
        title: '❌ Error',
        description: 'Failed to ban member. Check my permissions and role hierarchy.',
        color: 'Red'
      })]
    });
  }
};

export const softban: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.BanMembers)) return;

  const member = getMemberFromCommand(source);
  const reason = getStringOption(source, 'reason') ?? 'No reason provided';

  if (!member) {
    return source.reply({
      embeds: [createEmbed({
        title: '❌ Error',
        description: 'Please specify a member to softban',
        color: 'Red'
      })]
    });
  }

  try {
    // Ban and then immediately unban to clear messages
    await member.ban({ reason, deleteMessageDays: 7 });
    await source.guild!.members.unban(member.id, 'Softban - Message cleanup');

    await storage.createModLog({
      userId: member.id,
      guildId: source.guild!.id,
      moderatorId: source instanceof Message ? source.author.id : source.user.id,
      action: 'softban',
      reason
    });

    return source.reply({
      embeds: [createEmbed({
        title: '🔨 Member Softbanned',
        description: `Successfully softbanned ${member.user.tag}`,
        color: 'Orange',
        fields: [
          { name: 'Member', value: member.user.tag, inline: true },
          { name: 'Reason', value: reason, inline: true }
        ],
        timestamp: true
      })]
    });
  } catch (error) {
    return source.reply({
      embeds: [createEmbed({
        title: '❌ Error',
        description: 'Failed to softban member. Check my permissions and role hierarchy.',
        color: 'Red'
      })]
    });
  }
};

// Command Builders for Slash Commands
export const moderationCommands = [
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
    .setName('softban')
    .setDescription('Ban and immediately unban a user to clear their messages')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to softban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the softban')),
].map(command => command.toJSON());

// Command mapping for both slash and prefix commands
export const moderationCommandsMap = new Map<string, CommandFunction>([
  ['ban', ban],
  ['softban', softban],
]);
