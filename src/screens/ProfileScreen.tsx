import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Fonts } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { pickImage } from '../utils/fileUtils';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { currentUser, characters, games, updateUser } = useApp();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(currentUser?.username ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber ?? '');
  const [saving, setSaving] = useState(false);

  const handlePickProfilePic = async () => {
    const uri = await pickImage();
    if (uri) {
      await updateUser({ profilePic: uri });
    }
  };

  const handleSave = async () => {
    if (!username.trim() || !email.trim()) {
      Alert.alert('Error', 'Username and email are required.');
      return;
    }
    setSaving(true);
    try {
      await updateUser({ username: username.trim(), email: email.trim(), phoneNumber: phoneNumber.trim() });
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setUsername(currentUser?.username ?? '');
    setEmail(currentUser?.email ?? '');
    setPhoneNumber(currentUser?.phoneNumber ?? '');
    setEditing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickProfilePic}>
              <Avatar uri={currentUser?.profilePic} name={currentUser?.username} size={100} />
              <View style={styles.editAvatarBadge}>
                <Text style={styles.editAvatarText}>📷</Text>
              </View>
            </TouchableOpacity>
            {!editing && (
              <Text style={styles.displayName}>{currentUser?.username ?? 'Unknown'}</Text>
            )}
          </Animated.View>

          {/* Profile Fields */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Card style={styles.infoCard}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Username</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Username"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{currentUser?.username}</Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Email</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@example.com"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{currentUser?.email}</Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Phone</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{currentUser?.phoneNumber || 'Not set'}</Text>
                )}
              </View>
            </Card>
          </Animated.View>

          {/* Actions */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.actions}>
            {editing ? (
              <View style={styles.editActions}>
                <Button title="Save" onPress={handleSave} loading={saving} style={styles.actionBtn} />
                <Button title="Cancel" onPress={handleCancel} variant="outline" style={styles.actionBtn} />
              </View>
            ) : (
              <Button title="Edit Profile" onPress={() => setEditing(true)} variant="outline" />
            )}
          </Animated.View>

          {/* Characters Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Characters ({characters.length})</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Characters')}>
                <Text style={styles.seeAll}>View all</Text>
              </TouchableOpacity>
            </View>
            {characters.length === 0 ? (
              <Card><Text style={styles.emptyText}>No characters yet.</Text></Card>
            ) : (
              characters.map((char) => (
                <Card key={char.id} style={styles.listCard}>
                  <Avatar uri={char.avatarUrl} name={char.name} size={36} />
                  <View style={styles.listCardInfo}>
                    <Text style={styles.listCardTitle}>{char.name}</Text>
                    <Text style={styles.listCardSub}>Lvl {char.level} {char.race} {char.class}</Text>
                  </View>
                </Card>
              ))
            )}
          </Animated.View>

          {/* Games Section */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Games ({games.length})</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Games')}>
                <Text style={styles.seeAll}>View all</Text>
              </TouchableOpacity>
            </View>
            {games.length === 0 ? (
              <Card><Text style={styles.emptyText}>No games yet.</Text></Card>
            ) : (
              games.map((game) => (
                <Card key={game.id} style={styles.listCard}>
                  <View style={styles.listCardInfo}>
                    <Text style={styles.listCardTitle}>{game.name}</Text>
                    <Text style={styles.listCardSub}>{game.status} · {game.playerIds.length} players</Text>
                  </View>
                </Card>
              ))
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.lg },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarText: { fontSize: 16 },
  displayName: { color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: 'bold', marginTop: Spacing.sm },
  infoCard: { marginBottom: Spacing.md },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  fieldLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, width: 80 },
  fieldValue: { color: Colors.text, fontSize: Fonts.sizes.md, flex: 1, textAlign: 'right' },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: Fonts.sizes.md,
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    paddingVertical: 4,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  actions: { marginBottom: Spacing.lg },
  editActions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionTitle: { color: Colors.text, fontSize: Fonts.sizes.lg, fontWeight: 'bold' },
  seeAll: { color: Colors.primary, fontSize: Fonts.sizes.sm },
  emptyText: { color: Colors.textMuted, textAlign: 'center' },
  listCard: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  listCardInfo: { flex: 1 },
  listCardTitle: { color: Colors.text, fontSize: Fonts.sizes.md, fontWeight: '600' },
  listCardSub: { color: Colors.textMuted, fontSize: Fonts.sizes.sm },
});
