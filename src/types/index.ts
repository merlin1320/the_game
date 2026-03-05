export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  profilePic: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  race: string;
  class: string;
  level: number;
  stats: CharacterStats;
  backstory: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  dungeonMasterId: string;
  playerIds: string[];
  status: 'waiting' | 'active' | 'paused' | 'completed';
  maxPlayers: number;
  currentScene: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameMessage {
  id: string;
  gameId: string;
  userId: string;
  username: string;
  content: string;
  type: 'chat' | 'dice' | 'action' | 'system';
  diceRoll?: DiceRoll;
  fileAttachment?: FileAttachment;
  timestamp: string;
}

export interface DiceRoll {
  diceType: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
  count: number;
  results: number[];
  total: number;
  modifier: number;
  finalTotal: number;
}

export interface FileAttachment {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
}

export interface Profile {
  user: User;
  characters: Character[];
  games: Game[];
}
