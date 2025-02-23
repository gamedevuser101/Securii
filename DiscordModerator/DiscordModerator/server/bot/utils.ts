import { 
  Message, 
  PermissionResolvable, 
  ChatInputCommandInteraction,
  GuildMember,
  PermissionsBitField,
  EmbedBuilder,
  ColorResolvable
} from 'discord.js';

export function checkPermissions(source: Message | ChatInputCommandInteraction, permission: PermissionResolvable): boolean {
  if (!source.member || !('permissions' in source.member)) {
    return false;
  }

  const permissions = source.member.permissions as Readonly<PermissionsBitField>;
  if (!permissions.has(permission)) {
    const embed = createEmbed({
      title: '❌ Permission Denied',
      description: 'You do not have permission to use this command.',
      color: 'Red'
    });

    if (source instanceof Message) {
      source.reply({ embeds: [embed] });
    } else {
      source.reply({ embeds: [embed], ephemeral: true });
    }
    return false;
  }
  return true;
}

export function formatDuration(duration: string): number | null {
  const regex = /^(\d+)([mhd])$/;
  const match = duration.match(regex);

  if (!match) return null;

  const [, amount, unit] = match;
  const value = parseInt(amount);

  switch (unit) {
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

export function getMemberFromCommand(source: Message | ChatInputCommandInteraction): GuildMember | null {
  if (source instanceof Message) {
    return source.mentions.members?.first() ?? null;
  }
  return source.options.getMember('user') as GuildMember | null;
}

export function getStringOption(
  source: Message | ChatInputCommandInteraction,
  optionName: string,
  args: string[] = []
): string | null {
  if (source instanceof Message) {
    return args.length > 0 ? args.join(' ') : null;
  }
  return source.options.getString(optionName);
}

interface EmbedOptions {
  title: string;
  description: string;
  color?: ColorResolvable;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: string;
  timestamp?: boolean;
}

export function createEmbed(options: EmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setColor(options.color || '#2B2D31');

  if (options.fields) {
    embed.addFields(options.fields);
  }

  if (options.footer) {
    embed.setFooter({ text: options.footer });
  }

  if (options.timestamp) {
    embed.setTimestamp();
  }

  return embed;
}