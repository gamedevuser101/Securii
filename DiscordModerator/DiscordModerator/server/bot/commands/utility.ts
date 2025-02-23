import { 
  SlashCommandBuilder,
  EmbedBuilder,
  version as discordVersion,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import { storage } from '../../storage';
import { createEmbed } from '../utils';
import type { CommandFunction } from '../types';
import * as os from 'os';

// Track bot start time
const botStartTime = new Date();

export const botinfo: CommandFunction = async (source) => {
  const totalCommands = source.client.commands.size;
  const uptime = Date.now() - botStartTime.getTime();
  
  // Convert uptime to readable format
  const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

  const embed = createEmbed({
    title: '🤖 Bot Information',
    description: 'Detailed statistics and information about the bot',
    color: 'Blue',
    fields: [
      { 
        name: '📊 Statistics',
        value: `Commands: ${totalCommands}\nServers: ${source.client.guilds.cache.size}\nUsers: ${source.client.users.cache.size}`,
        inline: true
      },
      {
        name: '⏱️ Uptime',
        value: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        inline: true
      },
      {
        name: '💻 System',
        value: `Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\nNode.js: ${process.version}\nDiscord.js: v${discordVersion}`,
        inline: true
      },
      {
        name: '🔧 Technical',
        value: `Platform: ${os.platform()}\nCPU Load: ${(os.loadavg()[0]).toFixed(2)}%\nPing: ${source.client.ws.ping}ms`,
        inline: true
      }
    ],
    timestamp: true
  });

  await source.reply({ embeds: [embed] });
};

export const vote: CommandFunction = async (source) => {
  const embed = createEmbed({
    title: '🗳️ Vote for Our Bot!',
    description: 'Support us by voting and get awesome perks!',
    color: 'Purple',
    fields: [
      {
        name: '🎁 Voting Perks',
        value: '• Exclusive commands access\n• Special role in our support server\n• Higher limits on certain commands',
        inline: false
      },
      {
        name: '🔗 Vote Link',
        value: '[Click here to vote on top.gg](https://top.gg/bot/1290502191420801077)',
        inline: false
      }
    ],
    footer: 'Thank you for supporting us! ❤️'
  });

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setLabel('Vote Now')
        .setStyle(ButtonStyle.Link)
        .setURL('https://top.gg/bot/1290502191420801077')
    );

  await source.reply({ embeds: [embed], components: [row] });
};

export const modpanel: CommandFunction = async (source) => {
  if (!source.memberPermissions?.has('ModerateMembers')) {
    const embed = createEmbed({
      title: '❌ Access Denied',
      description: 'You need moderator permissions to use this command.',
      color: 'Red'
    });
    await source.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  const embed = createEmbed({
    title: '🛡️ Moderation Panel',
    description: 'Quick access to all moderation commands',
    color: 'Blue',
    fields: [
      {
        name: '👢 Member Management',
        value: '`/kick` - Kick a member\n`/ban` - Ban a member\n`/softban` - Ban and unban to clear messages\n`/timeout` - Timeout a member',
        inline: false
      },
      {
        name: '🔇 Mute Controls',
        value: '`/mute` - Mute a member\n`/unmute` - Unmute a member',
        inline: false
      },
      {
        name: '⚠️ Warning System',
        value: '`/warn` - Warn a member\n`/warnings` - View member warnings\n`/clearwarns` - Clear member warnings',
        inline: false
      },
      {
        name: '📝 Logs & Info',
        value: '`/modlogs` - View moderation logs\n`/userinfo` - View member info',
        inline: false
      },
      {
        name: '🧹 Channel Management',
        value: '`/purge` - Delete messages\n`/lock` - Lock channel\n`/unlock` - Unlock channel\n`/slowmode` - Set slowmode',
        inline: false
      }
    ],
    footer: 'Use these commands responsibly!'
  });

  await source.reply({ embeds: [embed] });
};

// Slash command builders
export const utilityCommands = [
  new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Display detailed information about the bot'),

  new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Get the link to vote for the bot and view voting perks'),

  new SlashCommandBuilder()
    .setName('modpanel')
    .setDescription('Display the moderation command panel')
].map(command => command.toJSON());

// Command map for both slash and prefix commands
export const commandMap = new Map<string, CommandFunction>([
  ['botinfo', botinfo],
  ['vote', vote],
  ['modpanel', modpanel]
]);
