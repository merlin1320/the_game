import { DiceRoll } from '../types';

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

const DICE_SIDES: Record<DiceType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

export const rollDice = (diceType: DiceType, count = 1, modifier = 0): DiceRoll => {
  const sides = DICE_SIDES[diceType];
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    results.push(Math.floor(Math.random() * sides) + 1);
  }
  const total = results.reduce((sum, r) => sum + r, 0);
  return {
    diceType,
    count,
    results,
    total,
    modifier,
    finalTotal: total + modifier,
  };
};

export const formatDiceRoll = (roll: DiceRoll): string => {
  let modStr = '';
  if (roll.modifier > 0) {
    modStr = ` + ${roll.modifier}`;
  } else if (roll.modifier < 0) {
    modStr = ` - ${Math.abs(roll.modifier)}`;
  }
  return `${roll.count}${roll.diceType}${modStr} = ${roll.results.join(' + ')}${modStr} = **${roll.finalTotal}**`;
};
