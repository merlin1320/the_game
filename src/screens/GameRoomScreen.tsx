import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { v4 as uuidv4 } from 'uuid';
import { Colors, Spacing, Fonts } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { DiceRoller } from '../components/common/DiceRoller';
import { Card } from '../components/common/Card';
import { GameMessage, DiceRoll, Game } from '../types';
import { getMessages, saveMessage, getGames } from '../database/gameRepository';
import { pickDocument } from '../utils/fileUtils';
import { formatDiceRoll } from '../utils/dice';

type GameRoomRouteParams = {
  GameRoom: { gameId: string };
};

export const GameRoomScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<GameRoomRouteParams, 'GameRoom'>>();
  const { currentUser } = useApp();
  const { gameId } = route.params;
  const [game, setGame] = useState<Game | null>(null);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadGame();
    loadMessages();
  }, [gameId]);

  const loadGame = async () => {
    const allGames = await getGames();
    const found = allGames.find((g) => g.id === gameId);
    setGame(found ?? null);
  };

  const loadMessages = async () => {
    const msgs = await getMessages(gameId);
    setMessages(msgs);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser) return;
    const msg: GameMessage = {
      id: uuidv4(),
      gameId,
      userId: currentUser.id,
      username: currentUser.username,
      content: inputText.trim(),
      type: 'chat',
      timestamp: new Date().toISOString(),
    };
    await saveMessage(msg);
    setMessages((prev) => [...prev, msg]);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendDiceRoll = async (roll: DiceRoll) => {
    if (!currentUser) return;
    const msg: GameMessage = {
      id: uuidv4(),
      gameId,
      userId: currentUser.id,
      username: currentUser.username,
      content: formatDiceRoll(roll),
      type: 'dice',
      diceRoll: roll,
      timestamp: new Date().toISOString(),
    };
    await saveMessage(msg);
    setMessages((prev) => [...prev, msg]);
    setShowDiceRoller(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleAttachFile = async () => {
    const file = await pickDocument();
    if (!file || !currentUser) return;
    const msg: GameMessage = {
      id: uuidv4(),
      gameId,
      userId: currentUser.id,
      username: currentUser.username,
      content: `📎 ${file.name}`,
      type: 'action',
      fileAttachment: file,
      timestamp: new Date().toISOString(),
    };
    await saveMessage(msg);
    setMessages((prev) => [...prev, msg]);
    Alert.alert('File Attached', `${file.name} has been shared.`);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: GameMessage }) => {
    const isMe = item.userId === currentUser?.id;
    const isDice = item.type === 'dice';
    const isSystem = item.type === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <Animated.View
        entering={FadeInRight.duration(200)}
        style={[styles.messageRow, isMe && styles.messageRowMe]}
      >
        <View style={[styles.messageBubble, isMe && styles.messageBubbleMe, isDice && styles.messageBubbleDice]}>
          {!isMe && <Text style={styles.messageUsername}>{item.username}</Text>}
          <Text style={[styles.messageContent, isDice && styles.diceContent]}>{item.content}</Text>
          {item.fileAttachment && (
            <Text style={styles.attachmentInfo}>
              📎 {item.fileAttachment.name}
            </Text>
          )}
          <Text style={styles.messageTime}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </Animated.View>
    );
  };

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading game...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.gameName}>{game.name}</Text>
          <Text style={styles.gameStatus}>{game.playerIds.length} players · {game.status}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowDiceRoller(!showDiceRoller)} style={styles.diceToggle}>
          <Text style={styles.diceToggleText}>🎲</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Scene Banner */}
      {game.currentScene ? (
        <Card style={styles.sceneBanner}>
          <Text style={styles.sceneLabel}>Current Scene</Text>
          <Text style={styles.sceneText}>{game.currentScene}</Text>
        </Card>
      ) : null}

      {/* Dice Roller Panel */}
      {showDiceRoller && (
        <Card style={styles.dicePanel}>
          <DiceRoller onRoll={sendDiceRoll} />
        </Card>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>The adventure begins! Send a message or roll the dice.</Text>
            </View>
          }
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity onPress={handleAttachFile} style={styles.attachBtn}>
            <Text style={styles.attachBtnText}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Say something..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  loadingText: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.xs, marginRight: Spacing.sm },
  backText: { color: Colors.text, fontSize: Fonts.sizes.xl },
  headerInfo: { flex: 1 },
  gameName: { color: Colors.text, fontSize: Fonts.sizes.lg, fontWeight: 'bold' },
  gameStatus: { color: Colors.textMuted, fontSize: Fonts.sizes.xs },
  diceToggle: { padding: Spacing.sm },
  diceToggleText: { fontSize: 24 },
  sceneBanner: {
    margin: Spacing.sm,
    borderColor: Colors.accent,
    borderWidth: 1,
  },
  sceneLabel: { color: Colors.accent, fontSize: Fonts.sizes.xs, fontWeight: '600', marginBottom: 2 },
  sceneText: { color: Colors.text, fontSize: Fonts.sizes.sm, fontStyle: 'italic' },
  dicePanel: { margin: Spacing.sm },
  messageList: { padding: Spacing.sm, paddingBottom: Spacing.md },
  messageRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  messageRowMe: { justifyContent: 'flex-end' },
  messageBubble: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.sm,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageBubbleMe: {
    backgroundColor: Colors.primary + '33',
    borderColor: Colors.primary,
  },
  messageBubbleDice: {
    backgroundColor: Colors.accent + '22',
    borderColor: Colors.accent,
  },
  messageUsername: { color: Colors.primary, fontSize: Fonts.sizes.xs, fontWeight: '600', marginBottom: 2 },
  messageContent: { color: Colors.text, fontSize: Fonts.sizes.sm },
  diceContent: { color: Colors.accent, fontWeight: '600' },
  attachmentInfo: { color: Colors.primary, fontSize: Fonts.sizes.xs, marginTop: 4 },
  messageTime: { color: Colors.textMuted, fontSize: 10, marginTop: 4, textAlign: 'right' },
  systemMessage: { alignItems: 'center', marginVertical: Spacing.xs },
  systemMessageText: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, fontStyle: 'italic' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyChatText: { color: Colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  attachBtn: { padding: Spacing.sm },
  attachBtnText: { fontSize: 22 },
  textInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: Fonts.sizes.md,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: { color: Colors.white, fontSize: Fonts.sizes.md },
});
