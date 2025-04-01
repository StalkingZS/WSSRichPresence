import { WebSocketServer, WebSocket } from 'ws';
import { DiscordUserProfile } from '../types';

export class WSServer {
  private wss: WebSocketServer | null = null;
  private ws: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private latestPresence: DiscordUserProfile | null = null;

  constructor(wsPort: number, wssPort?: number) {
    this.ws = new WebSocketServer({ port: wsPort });
    this.setupEventHandlers(this.ws, 'WS');
    console.log(`WebSocket server (WS) running on port ${wsPort}`);

    if (wssPort) {
      this.wss = new WebSocketServer({ port: wssPort });
      this.setupEventHandlers(this.wss, 'WSS');
      console.log(`WebSocket Secure server (WSS) running on port ${wssPort}`);
    }
  }

  private setupEventHandlers(server: WebSocketServer, protocol: 'WS' | 'WSS') {
    server.on('connection', (ws, req) => {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      console.log(`New ${protocol} connection from IP: ${clientIp}`);

      if (req.url !== '/presence') {
        ws.close(1003, 'Unsupported path');
        return;
      }

      this.clients.add(ws);
      console.log(`New WebSocket client connected (${protocol}). Total: ${this.clients.size}`);

      ws.send('connected');

      if (this.latestPresence) {
        this.sendPresence(ws, this.latestPresence);
      }

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`WebSocket client disconnected (${protocol}). Remaining: ${this.clients.size}`);
      });

      ws.on('message', (message) => {
        const data = message.toString().trim();
        
        if (data === 'ping') {
          ws.send('pong');
        } else if (data === 'Connection established') {
          console.log(`Client ${clientIp} established connection`);
        } else if (data === '/presence' && this.latestPresence) {
          this.sendPresence(ws, this.latestPresence);
        }
      });

      ws.on('error', (error) => {
        console.error(`WebSocket (${protocol}) error:`, error);
      });
    });
  }

  private sendPresence(ws: WebSocket, presence: DiscordUserProfile) {
    if (ws.readyState !== WebSocket.OPEN) return;

    try {
      const message = JSON.stringify(presence);
      ws.send(message);
    } catch (error) {
      console.error('Error sending presence:', error);
    }
  }

  public broadcastPresence(data: DiscordUserProfile) {
    this.latestPresence = data;
    const message = JSON.stringify(data);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  public close() {
    this.ws.close();
    if (this.wss) {
      this.wss.close();
    }
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    this.clients.clear();
  }
}