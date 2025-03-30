import dotenv from 'dotenv';
import { WSSServer } from './server/wss';
import { DiscordBot } from './bot';

dotenv.config();

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} not found in .env`);
  }
  return value;
}

const DISCORD_TOKEN = getEnvVar('DISCORD_TOKEN');
const DISCORD_USER_ID = getEnvVar('DISCORD_USER_ID');
const PORT = parseInt(getEnvVar('PORT'));

const wss = new WSSServer(PORT);
const bot = new DiscordBot(DISCORD_TOKEN, DISCORD_USER_ID, wss);

console.log(`
  Application started:
  - WebSocket server running on port ${PORT}
  - Monitoring user: ${DISCORD_USER_ID}
`);