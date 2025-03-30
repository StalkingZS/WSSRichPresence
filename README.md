# 🎮 WSSRichPresence — WebSocket Server Rich Presence

A WebSocket server that monitors a specific user's Discord presence and broadcasts real-time updates to connected clients.

## 🌟 Features
- Real-time Discord presence tracking
- WebSocket server for live updates
- Detailed user activity information
- Easy integration with any client

## 🚀 Prerequisites
- Node.js (version 16 or higher)
- npm or yarn
- Discord developer account
- Discord bot with proper intents

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/StalkingZS/WSSRichPresence.git
cd discord-presence-wss
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure the `.env` file:
```env
DISCORD_TOKEN="your_bot_token_here"
DISCORD_USER_ID="user_id_to_monitor"
PORT="8443"
```

## 💻 Usage

### Starting the server
```bash
npm start
# or
yarn start
```

The server will:
1. Connect to Discord using the provided token
2. Monitor the specified user
3. Start the WebSocket server on the configured port

### Client Integration
Clients can connect to the WebSocket using:

```javascript
const socket = new WebSocket('ws://localhost:3000');

socket.onopen = () => {
  console.log('Connected to presence server');
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Presence update:', data);
  // Example data:
  // {
  //   userId: '1234567890',
  //   username: 'TestUser',
  //   status: 'online',
  //   activities: [...],
  //   ...
  // }
};

socket.onclose = () => {
  console.log('Connection closed');
};
```

## 📊 Presence Data Structure
Data sent through WebSocket follows this format:

```typescript
interface DiscordUserProfile {
  userId: string;
  username: string;
  globalName?: string;
  displayName?: string;
  avatar?: string;
  avatarDecoration?: string;
  banner?: string;
  bio?: string;
  status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline';
  activities: {
    name: string;
    type: 'PLAYING' | 'STREAMING' | 'LISTENING' | 'WATCHING' | 'COMPETING' | 'CUSTOM';
    state?: string;
    details?: string;
    timestamps?: {
      start?: string;
      end?: string;
    };
    assets?: {
      largeImage?: string;
      largeText?: string;
      smallImage?: string;
      smallText?: string;
    };
    url?: string;
    createdAt?: string;
    flags?: number;
  }[];
  lastUpdated: string;
  platform?: 'desktop' | 'mobile' | 'web';
  accentColor?: number;
}
```

## ⚙️ Advanced Configuration

### Additional Environment Variables
| Variable       | Description                          | Default |
|----------------|--------------------------------------|---------|
| LOG_LEVEL      | Log level (debug, info, warn, error)| info    |
| RATE_LIMIT_MS  | Minimum update interval (ms)        | 3000    |

### Production Deployment
For production deployment, we recommend:

1. Using a process manager like PM2:
```bash
npm install -g pm2
pm2 start src/index.js --name "discord-presence"
```

2. Setting up a reverse proxy (Nginx) for SSL/TLS:

Example Nginx configuration:
```nginx
server {
    listen 443 ssl;
    server_name your.domain.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## 🔌 API Endpoints

### `GET /`
Returns basic server status

Response:
```json
{
  "request": {
    "success": true
  },
  "client": {
    "IPaddress": "client_ip",
    "userAgent": "client_user_agent"
  }
}
```

### `WebSocket /`
WebSocket connection that sends presence updates

Messages:
- Server → Client: Presence updates in DiscordUserProfile format
- Client → Server: "/presence" to request the latest state immediately

## 🎯 Use Cases

### Personal Website Integration
Show your real-time Discord status on your portfolio.

### Streaming Overlay
Display current Discord activities during live streams.

### Custom Applications
Develop bots or dashboards that react to your Discord activities.

## 🐛 Troubleshooting

### Issue: Bot doesn't detect presence
- Verify the bot has GUILD_PRESENCES intent enabled
- Confirm the bot and user share at least one server

### Issue: WebSocket connections fail
- Check if the server is running
- Verify firewall allows connections on the configured port

### Issue: Updates are too slow
- Adjust RATE_LIMIT_MS in .env to a lower value (minimum recommended: 1000)

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/awesome-feature`)
3. Commit your changes (`git commit -am 'Add awesome feature'`)
4. Push to the branch (`git push origin feature/awesome-feature`)
5. Open a Pull Request

## 🙏 Credits

Special thanks to:

1. kxllswxtchXD (https://github.com/kxllswxtchXD)
   - For initial project inspiration and concept
   - Valuable contributions to the shuffling algorithm

2. DeepSeek | 深度求索 (https://www.deepseek.com/)
   - AI assistance in code optimization
   - Documentation and README improvements

## 📜 License

MIT License - Free for personal and commercial use

💡 Pro Tip: For best results, use this with your favorite streaming tools to share your activities with viewers!
