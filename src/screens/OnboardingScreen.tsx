import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { v4 as uuidv4 } from 'uuid';
import { Colors, Spacing, Fonts } from '../constants/theme';
import { Button } from '../components/common/Button';
import { useApp } from '../context/AppContext';
import { User } from '../types';

export const OnboardingScreen: React.FC = () => {
  const { setCurrentUser } = useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!username.trim() || !email.trim()) {
      Alert.alert('Required Fields', 'Please enter your username and email to continue.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const user: User = {
        id: uuidv4(),
        username: username.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        profilePic: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setCurrentUser(user);
    } catch {
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeIn.duration(800)} style={styles.heroSection}>
            <Text style={styles.dragon}>🐉</Text>
            <Text style={styles.title}>The Game</Text>
            <Text style={styles.subtitle}>A Multiplayer D&D Adventure</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.form}>
            <Text style={styles.formTitle}>Create Your Profile</Text>

            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. TheMightyPaladin"
              placeholderTextColor={Colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Phone Number (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={Colors.textMuted}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <Button
              title="Begin Your Adventure"
              onPress={handleStart}
              loading={loading}
              style={styles.startButton}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.lg, justifyContent: 'center' },
  heroSection: { alignItems: 'center', marginBottom: Spacing.xxl },
  dragon: { fontSize: 80 },
  title: { color: Colors.text, fontSize: 42, fontWeight: 'bold', marginTop: Spacing.md },
  subtitle: { color: Colors.primary, fontSize: Fonts.sizes.lg, marginTop: Spacing.xs },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    color: Colors.text, fontSize: Fonts.sizes.xl,
    fontWeight: 'bold', textAlign: 'center', marginBottom: Spacing.lg,
  },
  label: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: Fonts.sizes.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  startButton: { marginTop: Spacing.sm },
});
