import { 
  Client, 
  Presence, 
  GatewayIntentBits, 
  ActivityType as DiscordActivityType,
} from 'discord.js';
import { DiscordUserProfile, StatusType, ActivityType, DiscordActivity } from '../types';
import { WSSServer } from '../server/wss';

const mapActivityType = (type: DiscordActivityType): ActivityType => {
  switch (type) {
    case DiscordActivityType.Playing: return 'PLAYING';
    case DiscordActivityType.Streaming: return 'STREAMING';
    case DiscordActivityType.Listening: return 'LISTENING';
    case DiscordActivityType.Watching: return 'WATCHING';
    case DiscordActivityType.Competing: return 'COMPETING';
    case DiscordActivityType.Custom: return 'CUSTOM';
    default: return 'CUSTOM';
  }
};

const formatUTCDate = (date?: Date | null): string | undefined => {
  return date ? date.toISOString() : undefined;
};

export class DiscordBot {
  private client: Client;
  private lastPresenceUpdate: Date | null = null;
  private readonly rateLimit = 3000;

  constructor(
    private readonly token: string,
    private readonly targetUserId: string,
    private readonly wssServer: WSSServer
  ) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
      ],
      presence: { status: 'invisible' }
    });

    this.setupEventHandlers();
    this.login();
  }

  private setupEventHandlers() {
    this.client.on('ready', async () => {
      console.log(`Bot connected as ${this.client.user?.username}`);
      
      await Promise.all(this.client.guilds.cache.map(async (guild) => {
        try {
          const member = await guild.members.fetch(this.targetUserId);
          if (member.presence) {
            await this.handlePresenceUpdate(member.presence);
          }
        } catch (error) {
          console.error(`Error fetching initial presence in guild ${guild.id}:`, error);
        }
      }));
    });

    this.client.on('presenceUpdate', async (_, newPresence) => {
      if (newPresence.userId === this.targetUserId) {
        try {
          await this.handlePresenceUpdate(newPresence);
        } catch (error) {
          console.error('Error handling presence update:', error);
        }
      }
    });

    this.client.on('userUpdate', async (oldUser, newUser) => {
      if (newUser.id === this.targetUserId) {
        try {
          const presence = this.client.guilds.cache.reduce<Presence | null>((found, guild) => {
            return found || guild.members.cache.get(this.targetUserId)?.presence || null;
          }, null);
          
          if (presence) {
            await this.handlePresenceUpdate(presence);
          }
        } catch (error) {
          console.error('Error handling user update:', error);
        }
      }
    });

    this.client.on('error', (error) => {
      console.error('Discord client error:', error);
    });

    this.client.on('warn', (warning) => {
      console.warn('Discord client warning:', warning);
    });

    this.client.on('debug', (info) => {
      console.debug('Discord client debug:', info);
    });
  }

  private async login() {
    try {
      await this.client.login(this.token);
    } catch (error) {
      console.error('Failed to login:', error);
      process.exit(1);
    }
  }

  private async handlePresenceUpdate(presence: Presence) {
    const now = new Date();
    
    if (this.lastPresenceUpdate && (now.getTime() - this.lastPresenceUpdate.getTime()) < this.rateLimit) {
      return;
    }

    this.lastPresenceUpdate = now;

    try {
      const user = await this.client.users.fetch(presence.userId, { 
        force: true,
        cache: true
      });
      
      const member = presence.member || await presence.guild?.members.fetch(presence.userId);
      const avatarDecoration = user.avatarDecorationURL({ size: 256 });

      const profile: DiscordUserProfile = {
        userId: presence.userId,
        username: user.username,
        globalName: user.globalName || undefined,
        displayName: member?.displayName || user.globalName || user.username,
        avatar: user.displayAvatarURL({ 
          size: 256, 
          extension: 'png',
          forceStatic: false 
        }),
        avatarDecoration: avatarDecoration || undefined,
        banner: user.bannerURL({ 
          size: 512, 
          extension: 'png' 
        }) || undefined,
        bio: (user as any).bio || undefined,
        accentColor: user.accentColor || undefined,
        status: presence.status as StatusType,
        activities: presence.activities.map(a => ({
          name: a.name ?? '',
          type: mapActivityType(a.type),
          state: a.state ?? undefined,
          details: a.details ?? undefined,
          timestamps: a.timestamps ? {
            start: formatUTCDate(a.timestamps.start),
            end: formatUTCDate(a.timestamps.end)
          } : undefined,
          assets: a.assets ? {
            largeImage: a.assets.largeImageURL() ?? undefined,
            largeText: a.assets.largeText ?? undefined,
            smallImage: a.assets.smallImageURL() ?? undefined,
            smallText: a.assets.smallText ?? undefined
          } : undefined,
          url: a.url ?? undefined,
          createdAt: formatUTCDate(a.createdAt),
          flags: a.flags?.bitfield || undefined
        })),
        lastUpdated: now.toISOString(),
        platform: presence.clientStatus?.desktop ? 'desktop' : 
                presence.clientStatus?.mobile ? 'mobile' : 
                presence.clientStatus?.web ? 'web' : undefined
      };

      console.log(`[${now.toISOString()}] Presence updated for ${user.username}`);
      this.wssServer.broadcastPresence(profile);
    } catch (error) {
      console.error('Error processing presence update:', error);
    }
  }
}