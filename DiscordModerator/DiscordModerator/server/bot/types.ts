import { Client, Collection, Message, ChatInputCommandInteraction } from 'discord.js';

export interface CommandFunction {
  (source: Message | ChatInputCommandInteraction): Promise<void>;
  modOnly?: boolean;
}

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, CommandFunction>;
    cooldowns: Collection<string, Collection<string, number>>;
  }
}