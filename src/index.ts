import 'dotenv/config';
import { WSServer } from './server/wss';
import { DiscordBot } from './bot';

const { DISCORD_TOKEN, DISCORD_USER_ID, WS_PORT = '8080', WSS_PORT } = process.env;

if (!DISCORD_TOKEN || !DISCORD_USER_ID) throw new Error('Configuração faltando');

const wsServer = new WSServer(Number(WS_PORT), Number(WSS_PORT));
new DiscordBot(DISCORD_TOKEN, DISCORD_USER_ID, wsServer);

process.on('SIGINT', () => {
  wsServer.close();
  process.exit();
});