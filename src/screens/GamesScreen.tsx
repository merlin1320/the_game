import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { v4 as uuidv4 } from 'uuid';
import { Colors, Spacing, Fonts } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Game } from '../types';
import { saveGame, deleteGame } from '../database/gameRepository';

interface GamesScreenProps {
  navigation: any;
}

export const GamesScreen: React.FC<GamesScreenProps> = ({ navigation }) => {
  const { currentUser, games, refreshGames } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [gameName, setGameName] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('6');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'waiting' | 'completed'>('all');

  const filteredGames = filter === 'all' ? games : games.filter((g) => g.status === filter);

  const handleCreate = async () => {
    if (!gameName.trim()) {
      Alert.alert('Error', 'Game name is required.');
      return;
    }
    if (!currentUser) return;
    setSaving(true);
    try {
      const game: Game = {
        id: uuidv4(),
        name: gameName.trim(),
        description: description.trim(),
        dungeonMasterId: currentUser.id,
        playerIds: [currentUser.id],
        status: 'waiting',
        maxPlayers: parseInt(maxPlayers, 10) || 6,
        currentScene: 'The adventure begins...',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveGame(game);
      await refreshGames();
      setModalVisible(false);
      setGameName('');
      setDescription('');
    } catch {
      Alert.alert('Error', 'Failed to create game.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (gameId: string, name: string) => {
    Alert.alert('Delete Game', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteGame(gameId);
          await refreshGames();
        },
      },
    ]);
  };

  const statusColor = (status: Game['status']) => {
    switch (status) {
      case 'active': return Colors.success;
      case 'waiting': return Colors.warning;
      case 'paused': return Colors.textMuted;
      case 'completed': return Colors.border;
      default: return Colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>Games</Text>
          <Button title="+ New" onPress={() => setModalVisible(true)} style={styles.newBtn} />
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.filterRow}>
          {(['all', 'active', 'waiting', 'completed'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {filteredGames.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(160).duration(400)}>
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🐉</Text>
              <Text style={styles.emptyTitle}>No Games Found</Text>
              <Text style={styles.emptyText}>Create a new game or join an existing one.</Text>
              <Button title="Create Game" onPress={() => setModalVisible(true)} style={{ marginTop: Spacing.md }} />
            </Card>
          </Animated.View>
        ) : (
          filteredGames.map((game, idx) => (
            <Animated.View key={game.id} entering={FadeInDown.delay(idx * 60).duration(400)}>
              <TouchableOpacity onPress={() => navigation.navigate('GameRoom', { gameId: game.id })}>
                <Card style={styles.gameCard}>
                  <View style={styles.gameCardHeader}>
                    <Text style={styles.gameName}>{game.name}</Text>
                    <View style={[styles.statusDot, { backgroundColor: statusColor(game.status) }]} />
                  </View>
                  {game.description ? (
                    <Text style={styles.gameDescription} numberOfLines={2}>{game.description}</Text>
                  ) : null}
                  <View style={styles.gameFooter}>
                    <Text style={styles.gameStatus}>{game.status.toUpperCase()}</Text>
                    <Text style={styles.gamePlayers}>{game.playerIds.length}/{game.maxPlayers} players</Text>
                    <TouchableOpacity onPress={() => handleDelete(game.id, game.name)}>
                      <Text style={styles.deleteText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Create Game Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Campaign</Text>

            <TextInput
              style={styles.input}
              placeholder="Campaign Name"
              placeholderTextColor={Colors.textMuted}
              value={gameName}
              onChangeText={setGameName}
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Description (optional)"
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
            <TextInput
              style={styles.input}
              placeholder="Max Players (default: 6)"
              placeholderTextColor={Colors.textMuted}
              value={maxPlayers}
              onChangeText={setMaxPlayers}
              keyboardType="number-pad"
            />

            <View style={styles.modalActions}>
              <Button title="Create" onPress={handleCreate} loading={saving} style={styles.modalBtn} />
              <Button title="Cancel" onPress={() => setModalVisible(false)} variant="outline" style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title: { color: Colors.text, fontSize: Fonts.sizes.xxl, fontWeight: 'bold' },
  newBtn: { paddingHorizontal: Spacing.md },
  filterRow: { flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.xs },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterTabText: { color: Colors.textMuted, fontSize: Fonts.sizes.sm },
  filterTabTextActive: { color: Colors.white },
  emptyCard: { alignItems: 'center', padding: Spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: 'bold', marginBottom: Spacing.sm },
  emptyText: { color: Colors.textMuted, textAlign: 'center' },
  gameCard: { marginBottom: Spacing.sm },
  gameCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  gameName: { color: Colors.text, fontSize: Fonts.sizes.lg, fontWeight: 'bold', flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  gameDescription: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginBottom: Spacing.sm },
  gameFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gameStatus: { color: Colors.primary, fontSize: Fonts.sizes.xs, fontWeight: '600' },
  gamePlayers: { color: Colors.textMuted, fontSize: Fonts.sizes.xs },
  deleteText: { fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
  },
  modalTitle: { color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: 'bold', marginBottom: Spacing.md, textAlign: 'center' },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: Spacing.sm,
    color: Colors.text,
    fontSize: Fonts.sizes.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  multilineInput: { height: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  modalBtn: { flex: 1 },
});
