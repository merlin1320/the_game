import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CharactersScreen } from '../screens/CharactersScreen';
import { GamesScreen } from '../screens/GamesScreen';
import { GameRoomScreen } from '../screens/GameRoomScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabBarIcon = (name: string) => ({ color, size }: { color: string; size: number }) => (
  <Text style={{ fontSize: size, color }}>{name}</Text>
);

const MainTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: Colors.surface,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ tabBarIcon: tabBarIcon('🏠'), tabBarLabel: 'Home' }}
    />
    <Tab.Screen
      name="Characters"
      component={CharactersScreen}
      options={{ tabBarIcon: tabBarIcon('⚔️'), tabBarLabel: 'Characters' }}
    />
    <Tab.Screen
      name="Games"
      component={GamesScreen}
      options={{ tabBarIcon: tabBarIcon('🎲'), tabBarLabel: 'Games' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarIcon: tabBarIcon('👤'), tabBarLabel: 'Profile' }}
    />
  </Tab.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { currentUser, isLoading } = useApp();

  if (isLoading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {currentUser ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="GameRoom"
              component={GameRoomScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
