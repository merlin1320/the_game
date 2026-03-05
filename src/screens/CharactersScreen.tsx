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
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Character, CharacterStats } from '../types';
import { saveCharacter, deleteCharacter } from '../database/gameRepository';
import { pickImage } from '../utils/fileUtils';

const DEFAULT_STATS: CharacterStats = {
  strength: 10, dexterity: 10, constitution: 10,
  intelligence: 10, wisdom: 10, charisma: 10,
  hitPoints: 10, maxHitPoints: 10, armorClass: 10,
};

const RACES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling', 'Dragonborn'];
const CLASSES = ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Ranger', 'Paladin', 'Barbarian', 'Bard', 'Druid', 'Sorcerer', 'Warlock', 'Monk'];

interface CharactersScreenProps {
  navigation: any;
}

export const CharactersScreen: React.FC<CharactersScreenProps> = ({ navigation }) => {
  const { currentUser, characters, refreshCharacters } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [race, setRace] = useState(RACES[0]);
  const [charClass, setCharClass] = useState(CLASSES[0]);
  const [backstory, setBackstory] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Character name is required.');
      return;
    }
    if (!currentUser) return;
    setSaving(true);
    try {
      const character: Character = {
        id: uuidv4(),
        userId: currentUser.id,
        name: name.trim(),
        race,
        class: charClass,
        level: 1,
        stats: { ...DEFAULT_STATS },
        backstory: backstory.trim(),
        avatarUrl: avatarUri,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveCharacter(character);
      await refreshCharacters();
      setModalVisible(false);
      setName('');
      setBackstory('');
      setAvatarUri(null);
    } catch {
      Alert.alert('Error', 'Failed to create character.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAvatar = async (char: Character) => {
    const uri = await pickImage();
    if (uri) {
      await saveCharacter({ ...char, avatarUrl: uri });
      await refreshCharacters();
    }
  };


  const handleDelete = (characterId: string, characterName: string) => {
    Alert.alert('Delete Character', `Are you sure you want to delete ${characterName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteCharacter(characterId);
          await refreshCharacters();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>Characters</Text>
          <Button title="+ New" onPress={() => setModalVisible(true)} style={styles.newBtn} />
        </Animated.View>

        {characters.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>⚔️</Text>
              <Text style={styles.emptyTitle}>No Characters Yet</Text>
              <Text style={styles.emptyText}>Create your first D&D character to get started.</Text>
              <Button title="Create Character" onPress={() => setModalVisible(true)} style={{ marginTop: Spacing.md }} />
            </Card>
          </Animated.View>
        ) : (
          characters.map((char, idx) => (
            <Animated.View key={char.id} entering={FadeInDown.delay(idx * 80).duration(400)}>
              <Card style={styles.characterCard}>
                <TouchableOpacity onPress={() => handleUpdateAvatar(char)}>
                  <Avatar uri={char.avatarUrl} name={char.name} size={64} />
                </TouchableOpacity>
                <View style={styles.characterBody}>
                  <Text style={styles.characterName}>{char.name}</Text>
                  <Text style={styles.characterDetails}>Lvl {char.level} {char.race} {char.class}</Text>
                  <View style={styles.statsRow}>
                    <Text style={styles.statText}>HP: {char.stats.hitPoints}/{char.stats.maxHitPoints}</Text>
                    <Text style={styles.statText}>AC: {char.stats.armorClass}</Text>
                  </View>
                  {char.backstory ? (
                    <Text style={styles.backstory} numberOfLines={2}>{char.backstory}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => handleDelete(char.id, char.name)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
              </Card>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Create Character Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Character</Text>

            <TouchableOpacity style={styles.avatarPicker} onPress={() => pickImage().then(setAvatarUri)}>
              <Avatar uri={avatarUri} name={name || '?'} size={72} />
              <Text style={styles.avatarPickerText}>Tap to set avatar</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Character Name"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.selectLabel}>Race</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {RACES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, race === r && styles.chipSelected]}
                  onPress={() => setRace(r)}
                >
                  <Text style={[styles.chipText, race === r && styles.chipTextSelected]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.selectLabel}>Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {CLASSES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, charClass === c && styles.chipSelected]}
                  onPress={() => setCharClass(c)}
                >
                  <Text style={[styles.chipText, charClass === c && styles.chipTextSelected]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Backstory (optional)"
              placeholderTextColor={Colors.textMuted}
              value={backstory}
              onChangeText={setBackstory}
              multiline
              numberOfLines={3}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { color: Colors.text, fontSize: Fonts.sizes.xxl, fontWeight: 'bold' },
  newBtn: { paddingHorizontal: Spacing.md },
  emptyCard: { alignItems: 'center', padding: Spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: 'bold', marginBottom: Spacing.sm },
  emptyText: { color: Colors.textMuted, textAlign: 'center' },
  characterCard: { flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.md, alignItems: 'flex-start' },
  characterBody: { flex: 1 },
  characterName: { color: Colors.text, fontSize: Fonts.sizes.lg, fontWeight: 'bold' },
  characterDetails: { color: Colors.primary, fontSize: Fonts.sizes.sm, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  statText: { color: Colors.textMuted, fontSize: Fonts.sizes.xs },
  backstory: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginTop: Spacing.xs, fontStyle: 'italic' },
  deleteBtn: { padding: Spacing.xs },
  deleteText: { fontSize: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  modalTitle: { color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: 'bold', marginBottom: Spacing.md, textAlign: 'center' },
  avatarPicker: { alignItems: 'center', marginBottom: Spacing.md },
  avatarPickerText: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginTop: Spacing.xs },
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
  selectLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginBottom: Spacing.xs },
  chipRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    marginRight: Spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textMuted, fontSize: Fonts.sizes.sm },
  chipTextSelected: { color: Colors.white },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  modalBtn: { flex: 1 },
});
