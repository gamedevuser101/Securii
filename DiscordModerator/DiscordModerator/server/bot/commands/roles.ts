import { 
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  Message,
  Role,
  GuildMember
} from 'discord.js';
import { storage } from '../../storage';
import { checkPermissions, createEmbed } from '../utils';
import type { CommandFunction } from '../types';

export const giverole: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.ManageRoles)) return;

  const member = source instanceof Message 
    ? source.mentions.members?.first() 
    : source.options.getMember('user') as GuildMember;
  const role = source instanceof Message
    ? source.mentions.roles.first()
    : source.options.getRole('role') as Role;

  if (!member || !role) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify both a member and a role',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
    return;
  }

  try {
    await member.roles.add(role);
    const embed = createEmbed({
      title: '✅ Role Added',
      description: `Successfully added ${role.name} to ${member.user.tag}`,
      color: 'Green',
      timestamp: true
    });
    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to add role. Check my permissions and role hierarchy.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

export const removerole: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.ManageRoles)) return;

  const member = source instanceof Message 
    ? source.mentions.members?.first() 
    : source.options.getMember('user') as GuildMember;
  const role = source instanceof Message
    ? source.mentions.roles.first()
    : source.options.getRole('role') as Role;

  if (!member || !role) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify both a member and a role',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
    return;
  }

  try {
    await member.roles.remove(role);
    const embed = createEmbed({
      title: '✅ Role Removed',
      description: `Successfully removed ${role.name} from ${member.user.tag}`,
      color: 'Green',
      timestamp: true
    });
    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to remove role. Check my permissions and role hierarchy.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

export const roleinfo: CommandFunction = async (source) => {
  const role = source instanceof Message
    ? source.mentions.roles.first()
    : source.options.getRole('role') as Role;

  if (!role) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify a role',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
    return;
  }

  const embed = createEmbed({
    title: '📝 Role Information',
    description: `Information about ${role.name}`,
    color: role.color || 'Blue',
    fields: [
      { name: 'ID', value: role.id, inline: true },
      { name: 'Color', value: role.hexColor, inline: true },
      { name: 'Position', value: role.position.toString(), inline: true },
      { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
      { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
      { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Members', value: role.members.size.toString(), inline: true }
    ],
    timestamp: true
  });

  await source.reply({ embeds: [embed] });
};

export const setmodrole: CommandFunction = async (source) => {
  if (!checkPermissions(source, PermissionFlagsBits.Administrator)) return;

  const role = source instanceof Message
    ? source.mentions.roles.first()
    : source.options.getRole('role') as Role;

  if (!role) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Please specify a role to set as moderator role',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
    return;
  }

  try {
    const settings = await storage.getServerSettings(source.guild!.id);
    const currentModRoles = settings?.modRoles ? settings.modRoles.split(',') : [];

    if (!currentModRoles.includes(role.id)) {
      currentModRoles.push(role.id);
      await storage.updateServerSettings(source.guild!.id, {
        modRoles: currentModRoles.join(',')
      });
    }

    const embed = createEmbed({
      title: '🛡️ Mod Role Set',
      description: `Successfully set ${role.name} as a moderator role`,
      color: 'Green',
      timestamp: true
    });
    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to set mod role.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

export const listmodroles: CommandFunction = async (source) => {
  try {
    const settings = await storage.getServerSettings(source.guild!.id);
    const modRoles = settings?.modRoles ? settings.modRoles.split(',') : [];

    const rolesList = modRoles.map(roleId => {
      const role = source.guild!.roles.cache.get(roleId);
      return role ? `• ${role.name}` : null;
    }).filter(Boolean);

    const embed = createEmbed({
      title: '🛡️ Moderator Roles',
      description: rolesList.length > 0 
        ? rolesList.join('\n')
        : 'No moderator roles set',
      color: 'Blue',
      timestamp: true
    });

    await source.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createEmbed({
      title: '❌ Error',
      description: 'Failed to fetch mod roles.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed] });
  }
};

// Slash command builders
export const roleCommands = [
  new SlashCommandBuilder()
    .setName('giverole')
    .setDescription('Give a role to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to give the role to')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to give')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Remove a role from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to remove the role from')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to remove')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Get information about a role')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to get information about')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('setmodrole')
    .setDescription('Set a role as a moderator role')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to set as moderator')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('listmodroles')
    .setDescription('List all moderator roles'),
].map(command => command.toJSON());

// Command map for both slash and prefix commands
export const commandMap = new Map<string, CommandFunction>([
  ['giverole', giverole],
  ['removerole', removerole],
  ['roleinfo', roleinfo],
  ['setmodrole', setmodrole],
  ['listmodroles', listmodroles]
]);

// Mark commands that require mod roles
giverole.modOnly = true;
removerole.modOnly = true;