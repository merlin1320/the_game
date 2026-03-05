import * as SQLite from 'expo-sqlite';

// SQLite is initialized here to define the relational schema and serve as the
// structured local database layer. Runtime CRUD operations use AsyncStorage
// (via the repository files) for simplicity and cross-platform compatibility,
// while this schema can be extended for complex queries as the app grows.
const db = SQLite.openDatabase('thegame.db');

export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          username TEXT NOT NULL,
          email TEXT NOT NULL,
          phone_number TEXT,
          profile_pic TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`,
        [],
        () => {},
        (_, error) => { console.error('Error creating users table', error); return false; }
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS characters (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          race TEXT NOT NULL,
          class TEXT NOT NULL,
          level INTEGER NOT NULL DEFAULT 1,
          stats TEXT NOT NULL,
          backstory TEXT,
          avatar_url TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );`,
        [],
        () => {},
        (_, error) => { console.error('Error creating characters table', error); return false; }
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS games (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          dungeon_master_id TEXT NOT NULL,
          player_ids TEXT NOT NULL DEFAULT '[]',
          status TEXT NOT NULL DEFAULT 'waiting',
          max_players INTEGER NOT NULL DEFAULT 6,
          current_scene TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`,
        [],
        () => {},
        (_, error) => { console.error('Error creating games table', error); return false; }
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY NOT NULL,
          game_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          username TEXT NOT NULL,
          content TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'chat',
          dice_roll TEXT,
          file_attachment TEXT,
          timestamp TEXT NOT NULL,
          FOREIGN KEY (game_id) REFERENCES games(id)
        );`,
        [],
        () => {},
        (_, error) => { console.error('Error creating messages table', error); return false; }
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS attachments (
          id TEXT PRIMARY KEY NOT NULL,
          game_id TEXT,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          uri TEXT NOT NULL,
          type TEXT NOT NULL,
          size INTEGER NOT NULL,
          created_at TEXT NOT NULL
        );`,
        [],
        () => {},
        (_, error) => { console.error('Error creating attachments table', error); return false; }
      );
    },
    (error) => {
      console.error('Transaction error during DB init', error);
      reject(error);
    },
    () => {
      resolve();
    });
  });
};

export default db;
