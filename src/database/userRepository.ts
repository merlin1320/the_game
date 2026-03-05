import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const CURRENT_USER_KEY = '@thegame:current_user';

export const saveCurrentUser = async (user: User): Promise<void> => {
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const getCurrentUser = async (): Promise<User | null> => {
  const data = await AsyncStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearCurrentUser = async (): Promise<void> => {
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
};

export const updateCurrentUser = async (updates: Partial<User>): Promise<User | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const updated: User = { ...user, ...updates, updatedAt: new Date().toISOString() };
  await saveCurrentUser(updated);
  return updated;
};
