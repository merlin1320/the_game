import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Character, Game } from '../types';
import { getCurrentUser, saveCurrentUser } from '../database/userRepository';
import { getCharacters, getGames } from '../database/gameRepository';

interface AppContextType {
  currentUser: User | null;
  characters: Character[];
  games: Game[];
  isLoading: boolean;
  setCurrentUser: (user: User | null) => void;
  refreshCharacters: () => Promise<void>;
  refreshGames: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUserState(user);
      if (user) {
        const [chars, gameList] = await Promise.all([getCharacters(), getGames()]);
        setCharacters(chars.filter((c) => c.userId === user.id));
        setGames(gameList.filter((g) => g.playerIds.includes(user.id) || g.dungeonMasterId === user.id));
      }
    } catch (error) {
      console.error('Error loading initial data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentUser = async (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      await saveCurrentUser(user);
    }
  };

  const refreshCharacters = async () => {
    if (!currentUser) return;
    const chars = await getCharacters();
    setCharacters(chars.filter((c) => c.userId === currentUser.id));
  };

  const refreshGames = async () => {
    if (!currentUser) return;
    const gameList = await getGames();
    setGames(gameList.filter((g) => g.playerIds.includes(currentUser.id) || g.dungeonMasterId === currentUser.id));
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
    setCurrentUserState(updated);
    await saveCurrentUser(updated);
  };

  return (
    <AppContext.Provider
      value={{ currentUser, characters, games, isLoading, setCurrentUser, refreshCharacters, refreshGames, updateUser }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
