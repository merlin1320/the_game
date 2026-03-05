import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game, Character, GameMessage } from '../types';

const GAMES_KEY = '@thegame:games';
const CHARACTERS_KEY = '@thegame:characters';
const MESSAGES_KEY_PREFIX = '@thegame:messages:';

// ---- Games ----
export const saveGames = async (games: Game[]): Promise<void> => {
  await AsyncStorage.setItem(GAMES_KEY, JSON.stringify(games));
};

export const getGames = async (): Promise<Game[]> => {
  const data = await AsyncStorage.getItem(GAMES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveGame = async (game: Game): Promise<void> => {
  const games = await getGames();
  const idx = games.findIndex((g) => g.id === game.id);
  if (idx >= 0) {
    games[idx] = game;
  } else {
    games.push(game);
  }
  await saveGames(games);
};

export const deleteGame = async (gameId: string): Promise<void> => {
  const games = await getGames();
  await saveGames(games.filter((g) => g.id !== gameId));
};

// ---- Characters ----
export const saveCharacters = async (characters: Character[]): Promise<void> => {
  await AsyncStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
};

export const getCharacters = async (): Promise<Character[]> => {
  const data = await AsyncStorage.getItem(CHARACTERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveCharacter = async (character: Character): Promise<void> => {
  const chars = await getCharacters();
  const idx = chars.findIndex((c) => c.id === character.id);
  if (idx >= 0) {
    chars[idx] = character;
  } else {
    chars.push(character);
  }
  await saveCharacters(chars);
};

export const deleteCharacter = async (characterId: string): Promise<void> => {
  const chars = await getCharacters();
  await saveCharacters(chars.filter((c) => c.id !== characterId));
};

// ---- Messages ----
export const getMessages = async (gameId: string): Promise<GameMessage[]> => {
  const data = await AsyncStorage.getItem(`${MESSAGES_KEY_PREFIX}${gameId}`);
  return data ? JSON.parse(data) : [];
};

export const saveMessage = async (message: GameMessage): Promise<void> => {
  const messages = await getMessages(message.gameId);
  messages.push(message);
  await AsyncStorage.setItem(`${MESSAGES_KEY_PREFIX}${message.gameId}`, JSON.stringify(messages));
};
