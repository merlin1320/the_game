import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { Colors, Spacing, Fonts } from '../../constants/theme';
import { rollDice, DiceType, formatDiceRoll } from '../../utils/dice';
import { DiceRoll } from '../../types';

interface DiceRollerProps {
  onRoll?: (roll: DiceRoll) => void;
}

const DICE_TYPES: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

export const DiceRoller: React.FC<DiceRollerProps> = ({ onRoll }) => {
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [selectedDice, setSelectedDice] = useState<DiceType>('d20');
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleRoll = () => {
    rotation.value = withSequence(
      withTiming(360, { duration: 400 }),
      withTiming(0, { duration: 0 })
    );
    const roll = rollDice(selectedDice);
    setLastRoll(roll);
    onRoll?.(roll);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.diceSelector}>
        {DICE_TYPES.map((dice) => (
          <TouchableOpacity
            key={dice}
            style={[styles.diceButton, selectedDice === dice && styles.diceButtonSelected]}
            onPress={() => setSelectedDice(dice)}
          >
            <Text style={[styles.diceButtonText, selectedDice === dice && styles.diceButtonTextSelected]}>
              {dice.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity onPress={handleRoll} style={styles.rollButton}>
        <Animated.Text style={[styles.diceEmoji, animatedStyle]}>🎲</Animated.Text>
        <Text style={styles.rollText}>Roll {selectedDice.toUpperCase()}</Text>
      </TouchableOpacity>

      {lastRoll && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{formatDiceRoll(lastRoll)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  diceSelector: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  diceButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  diceButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  diceButtonText: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
  },
  diceButtonTextSelected: {
    color: Colors.white,
  },
  rollButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  diceEmoji: {
    fontSize: 48,
  },
  rollText: {
    color: Colors.text,
    fontSize: Fonts.sizes.md,
    marginTop: Spacing.xs,
  },
  resultContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  resultText: {
    color: Colors.accent,
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
  },
});
