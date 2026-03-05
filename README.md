# The Game 🐉

A multiplayer mobile D&D group game built with React Native and Expo.

## Features

- 🎲 **Multiplayer D&D**: Create and join game rooms with friends
- ⚔️ **Character System**: Build D&D characters with full stats, race, class, and backstory
- 👤 **User Profiles**: Username, email, phone, profile picture
- 🎲 **Dice Roller**: Roll any dice type (d4, d6, d8, d10, d12, d20, d100) with animations
- 📎 **File Attachments**: Share documents, images, and files in-game
- 💾 **Local Storage**: All data persisted locally using AsyncStorage and expo-sqlite
- 📱 **Android + Web**: Runs on Android and browser via Expo

## Tech Stack

- [Expo](https://expo.dev/) SDK 50
- [React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/) (Stack + Bottom Tabs)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) for animations
- [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) for local storage
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) for relational local DB
- [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) for profile pictures and character avatars
- [expo-document-picker](https://docs.expo.dev/versions/latest/sdk/documentpicker/) for file attachments
- TypeScript throughout

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

```bash
npm install -g expo-cli
```

### Installation

```bash
cd the_game
npm install
```

### Running the App

```bash
# Start Expo dev server
npm start

# Android
npm run android

# Web
npm run web
```

## Project Structure

```
the_game/
├── App.tsx                    # Root component
├── app.json                   # Expo configuration
├── babel.config.js            # Babel config (includes reanimated plugin)
├── tsconfig.json              # TypeScript config
├── assets/                    # Static assets
└── src/
    ├── components/
    │   └── common/
    │       ├── Avatar.tsx     # Profile/character avatar
    │       ├── Button.tsx     # Animated button with Reanimated
    │       ├── Card.tsx       # Card container
    │       └── DiceRoller.tsx # Interactive dice roller
    ├── constants/
    │   └── theme.ts           # Colors, fonts, spacing
    ├── context/
    │   └── AppContext.tsx     # Global state (user, characters, games)
    ├── database/
    │   ├── db.ts              # SQLite database init
    │   ├── userRepository.ts  # User CRUD (AsyncStorage)
    │   └── gameRepository.ts  # Game/character/message CRUD (AsyncStorage)
    ├── navigation/
    │   └── AppNavigator.tsx   # Stack + Tab navigation
    ├── screens/
    │   ├── OnboardingScreen.tsx  # First-time user setup
    │   ├── HomeScreen.tsx        # Dashboard
    │   ├── ProfileScreen.tsx     # User profile (edit username, email, phone, avatar)
    │   ├── CharactersScreen.tsx  # Character list + creation
    │   ├── GamesScreen.tsx       # Game list + creation
    │   └── GameRoomScreen.tsx    # In-game chat, dice roller, file sharing
    ├── types/
    │   └── index.ts           # TypeScript interfaces
    └── utils/
        ├── dice.ts            # Dice rolling logic
        └── fileUtils.ts       # File/image picking utilities
```

## Gameplay

1. **Onboard**: Create your profile with username, email, and optional phone number
2. **Create Characters**: Build D&D heroes with race, class, stats, and backstory
3. **Create/Join Games**: Set up a campaign as Dungeon Master or join as a player
4. **Play**: Chat in the game room, roll dice, and share files with your party