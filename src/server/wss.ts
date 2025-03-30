import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { DiscordUserProfile } from '../types';

export class WSSServer {
  private wss: WebSocketServer;
  private httpServer: ReturnType<typeof createServer>;
  private clients: Set<WebSocket> = new Set();
  private latestPresence: DiscordUserProfile | null = null;

  constructor(port: number) {
    this.httpServer = createServer((req, res) => {
      if (req.url === '/') {
        this.handleStatusRequest(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          request: {
            success: false,
          },
          error: 'Endpoint not found'
        }));
      }
    });

    this.wss = new WebSocketServer({ server: this.httpServer });
    
    this.setupEventHandlers();
    this.httpServer.listen(port, () => {
      console.log(`WebSocket server running on port ${port} (WSS)`);
    });
  }

  private handleStatusRequest(req: any, res: any) {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' 
    });
    
    res.end(JSON.stringify({
      request: {
        success: true,
      },
      client: {
        IPaddress: clientIp,
        userAgent: userAgent
      }
    }));
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      console.log(`New WebSocket connection from IP: ${clientIp}`);

      this.clients.add(ws);
      console.log(`New WebSocket client connected. Total: ${this.clients.size}`);

      if (this.latestPresence) {
        this.sendPresence(ws, this.latestPresence);
      }

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`WebSocket client disconnected. Remaining: ${this.clients.size}`);
      });

      ws.on('message', (message) => {
        const data = message.toString().trim();
        if (data === '/presence' && this.latestPresence) {
          this.sendPresence(ws, this.latestPresence);
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private sendPresence(ws: WebSocket, presence: DiscordUserProfile) {
    if (ws.readyState !== WebSocket.OPEN) return;

    try {
      const message = JSON.stringify({
        request: {
          success: true,
        },
        data: presence,
        timestamp: new Date().toISOString()
      });
      ws.send(message);
    } catch (error) {
      console.error('Error sending presence:', error);
    }
  }

  public broadcastPresence(data: DiscordUserProfile) {
    this.latestPresence = data;
    const message = JSON.stringify({
      request: {
        success: true,
      },
      data,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}