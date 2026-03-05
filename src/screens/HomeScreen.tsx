import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Fonts } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/common/Avatar';
import { Card } from '../components/common/Card';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { currentUser, characters, games } = useApp();

  const activeGames = games.filter((g) => g.status === 'active' || g.status === 'waiting');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{currentUser?.username ?? 'Adventurer'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar uri={currentUser?.profilePic} name={currentUser?.username} size={48} />
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{characters.length}</Text>
            <Text style={styles.statLabel}>Characters</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{games.length}</Text>
            <Text style={styles.statLabel}>Total Games</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{activeGames.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </Card>
        </Animated.View>

        {/* Active Games */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Games</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Games')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {activeGames.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>No active games. Create or join one!</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate('Games')}
              >
                <Text style={styles.createButtonText}>+ Create Game</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            activeGames.slice(0, 3).map((game) => (
              <TouchableOpacity
                key={game.id}
                onPress={() => navigation.navigate('GameRoom', { gameId: game.id })}
              >
                <Card style={styles.gameCard}>
                  <View style={styles.gameCardHeader}>
                    <Text style={styles.gameName}>{game.name}</Text>
                    <View style={[styles.statusBadge, game.status === 'active' ? styles.activeBadge : styles.waitingBadge]}>
                      <Text style={styles.statusText}>{game.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.gameDescription} numberOfLines={2}>{game.description}</Text>
                  <Text style={styles.gameInfo}>
                    {game.playerIds.length}/{game.maxPlayers} players
                  </Text>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>

        {/* Characters */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Characters</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Characters')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {characters.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>No characters yet. Create your first hero!</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate('Characters')}
              >
                <Text style={styles.createButtonText}>+ Create Character</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            characters.slice(0, 3).map((char) => (
              <Card key={char.id} style={styles.characterCard}>
                <Avatar uri={char.avatarUrl} name={char.name} size={40} />
                <View style={styles.characterInfo}>
                  <Text style={styles.characterName}>{char.name}</Text>
                  <Text style={styles.characterDetails}>
                    Level {char.level} {char.race} {char.class}
                  </Text>
                </View>
                <Text style={styles.characterHp}>
                  {char.stats.hitPoints}/{char.stats.maxHitPoints} HP
                </Text>
              </Card>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: { color: Colors.textMuted, fontSize: Fonts.sizes.sm },
  username: { color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { flex: 1, alignItems: 'center', padding: Spacing.md },
  statNumber: { color: Colors.primary, fontSize: Fonts.sizes.xl, fontWeight: 'bold' },
  statLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionTitle: { color: Colors.text, fontSize: Fonts.sizes.lg, fontWeight: 'bold' },
  seeAll: { color: Colors.primary, fontSize: Fonts.sizes.sm },
  emptyText: { color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.sm },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  createButtonText: { color: Colors.white, fontWeight: '600' },
  gameCard: { marginBottom: Spacing.sm },
  gameCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  gameName: { color: Colors.text, fontSize: Fonts.sizes.md, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 12 },
  activeBadge: { backgroundColor: Colors.success + '33' },
  waitingBadge: { backgroundColor: Colors.warning + '33' },
  statusText: { fontSize: Fonts.sizes.xs, fontWeight: '600', color: Colors.text },
  gameDescription: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginBottom: 4 },
  gameInfo: { color: Colors.primary, fontSize: Fonts.sizes.xs },
  characterCard: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  characterInfo: { flex: 1 },
  characterName: { color: Colors.text, fontSize: Fonts.sizes.md, fontWeight: '600' },
  characterDetails: { color: Colors.textMuted, fontSize: Fonts.sizes.sm },
  characterHp: { color: Colors.success, fontSize: Fonts.sizes.sm, fontWeight: '600' },
});
