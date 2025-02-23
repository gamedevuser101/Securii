import { Client, Events, Collection, ChatInputCommandInteraction, AuditLogEvent, TextChannel } from 'discord.js';
import { CommandFunction } from '../types';
import { storage } from '../../storage';
import { createEmbed } from '../utils';

export function registerEvents(client: Client) {
  // Handle prefix commands
  client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    console.log(`Attempting to execute prefix command: ${commandName}`);
    const command = client.commands.get(commandName);

    if (!command) {
      console.log(`Command not found: ${commandName}`);
      return;
    }

    try {
      // Check cooldown
      const { cooldowns } = client;
      if (!cooldowns.has(commandName)) {
        cooldowns.set(commandName, new Collection<string, number>());
      }

      const now = Date.now();
      const timestamps = cooldowns.get(commandName);
      const cooldownAmount = 3000; // 3 seconds cooldown

      if (timestamps?.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id)! + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          await message.reply(
            `Please wait ${timeLeft.toFixed(1)} more seconds before using the \`${commandName}\` command.`
          );
          return;
        }
      }

      timestamps?.set(message.author.id, now);
      setTimeout(() => timestamps?.delete(message.author.id), cooldownAmount);

      // Check mod role permissions
      const settings = await storage.getServerSettings(message.guild!.id);
      if (settings?.modRoles && command.modOnly) {
        const modRoles = settings.modRoles.split(',');
        const hasModRole = message.member?.roles.cache.some(role => modRoles.includes(role.id));
        if (!hasModRole) {
          await message.reply({
            embeds: [createEmbed({
              title: '❌ Permission Denied',
              description: 'You need a moderator role to use this command.',
              color: 'Red'
            })]
          });
          return;
        }
      }

      // Execute command
      console.log(`Executing prefix command: ${commandName}`);
      await command(message);
    } catch (error) {
      console.error('Error executing prefix command:', error);
      await message.reply('There was an error executing that command.');
    }
  });

  // Handle slash commands
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const commandName = interaction.commandName;
    console.log(`Attempting to execute slash command: ${commandName}`);

    const command = client.commands.get(commandName);
    if (!command) {
      console.log(`Command not found: ${commandName}`);
      return;
    }

    try {
      // Check mod role permissions
      const settings = await storage.getServerSettings(interaction.guild!.id);
      if (settings?.modRoles && command.modOnly) {
        const modRoles = settings.modRoles.split(',');
        const hasModRole = interaction.member?.roles.cache.some(role => modRoles.includes(role.id));
        if (!hasModRole) {
          await interaction.reply({
            embeds: [createEmbed({
              title: '❌ Permission Denied',
              description: 'You need a moderator role to use this command.',
              color: 'Red'
            })],
            ephemeral: true
          });
          return;
        }
      }

      console.log(`Executing slash command: ${commandName}`);
      await command(interaction);
    } catch (error) {
      console.error('Error executing slash command:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: 'There was an error executing this command!', 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          content: 'There was an error executing this command!', 
          ephemeral: true 
        });
      }
    }
  });

  // Audit logging events
  client.on(Events.GuildAuditLogEntryCreate, async auditLogEntry => {
    const { guild, executorId, targetId, actionType, reason } = auditLogEntry;

    const settings = await storage.getServerSettings(guild.id);
    if (!settings?.modLogChannel) return;

    const logChannel = await guild.channels.fetch(settings.modLogChannel) as TextChannel;
    if (!logChannel) return;

    let description = '';
    const executor = await client.users.fetch(executorId);
    const target = targetId ? await client.users.fetch(targetId) : null;

    switch (actionType) {
      case AuditLogEvent.MemberKick:
        description = `👢 **Member Kicked**\nModerator: ${executor.tag}\nMember: ${target?.tag}\nReason: ${reason || 'No reason provided'}`;
        break;
      case AuditLogEvent.MemberBanAdd:
        description = `🔨 **Member Banned**\nModerator: ${executor.tag}\nMember: ${target?.tag}\nReason: ${reason || 'No reason provided'}`;
        break;
      case AuditLogEvent.MemberBanRemove:
        description = `🔓 **Member Unbanned**\nModerator: ${executor.tag}\nMember: ${target?.tag}\nReason: ${reason || 'No reason provided'}`;
        break;
      case AuditLogEvent.MemberUpdate:
        description = `📝 **Member Updated**\nModerator: ${executor.tag}\nMember: ${target?.tag}\nReason: ${reason || 'No reason provided'}`;
        break;
      case AuditLogEvent.MemberRoleUpdate:
        description = `👥 **Member Roles Updated**\nModerator: ${executor.tag}\nMember: ${target?.tag}\nReason: ${reason || 'No reason provided'}`;
        break;
      // Add more cases as needed
    }

    if (description) {
      await logChannel.send({
        embeds: [createEmbed({
          title: '📋 Audit Log Entry',
          description,
          color: 'Blue',
          timestamp: true
        })]
      });
    }
  });

  // Message deletion logging
  client.on(Events.MessageDelete, async message => {
    if (!message.guild) return;

    const settings = await storage.getServerSettings(message.guild.id);
    if (!settings?.modLogChannel) return;

    const logChannel = await message.guild.channels.fetch(settings.modLogChannel) as TextChannel;
    if (!logChannel) return;

    await logChannel.send({
      embeds: [createEmbed({
        title: '🗑️ Message Deleted',
        description: `**Channel:** ${message.channel}\n**Author:** ${message.author}\n**Content:** ${message.content || 'No content (possibly embed or attachment)'}`,
        color: 'Red',
        timestamp: true
      })]
    });
  });

  // Message edit logging
  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const settings = await storage.getServerSettings(oldMessage.guild.id);
    if (!settings?.modLogChannel) return;

    const logChannel = await oldMessage.guild.channels.fetch(settings.modLogChannel) as TextChannel;
    if (!logChannel) return;

    await logChannel.send({
      embeds: [createEmbed({
        title: '✏️ Message Edited',
        description: `**Channel:** ${oldMessage.channel}\n**Author:** ${oldMessage.author}\n**Before:** ${oldMessage.content}\n**After:** ${newMessage.content}`,
        color: 'Blue',
        timestamp: true
      })]
    });
  });

  // Log when ready
  client.on(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user?.tag}`);
    console.log(`Loaded ${client.commands.size} commands`);
    console.log('Available commands:', Array.from(client.commands.keys()).join(', '));
  });
}