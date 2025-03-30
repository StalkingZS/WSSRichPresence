export const ActivityTypes = [
  'PLAYING',
  'STREAMING',
  'LISTENING',
  'WATCHING',
  'COMPETING',
  'CUSTOM',
] as const;

export const StatusTypes = [
  'online',
  'idle',
  'dnd',
  'invisible',
  'offline',
] as const;

export type ActivityType = typeof ActivityTypes[number];
export type StatusType = typeof StatusTypes[number];

export interface DiscordActivity {
  name: string;
  type: ActivityType;
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
}

export interface DiscordUserProfile {
  userId: string;
  username: string;
  globalName?: string;
  displayName?: string;
  avatar?: string;
  avatarDecoration?: string;
  banner?: string;
  bio?: string;
  status: StatusType;
  activities: DiscordActivity[];
  lastUpdated: string;
  platform?: 'desktop' | 'mobile' | 'web';
  accentColor?: number;
}