import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { formatBsMonthKey, shiftBsMonth } from '../services/nepaliDate';

/** Prev/next month navigator for the History screen. */
export function MonthSelector({ bsMonth, onChange }) {
  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={() => onChange(shiftBsMonth(bsMonth, -1))}
        accessibilityLabel="Previous month"
      >
        <Text style={styles.arrow}>◀</Text>
      </Pressable>

      <View style={styles.labelBox}>
        <Text style={styles.label}>{formatBsMonthKey(bsMonth)}</Text>
        <Text style={styles.sub}>Bikram Sambat</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={() => onChange(shiftBsMonth(bsMonth, 1))}
        accessibilityLabel="Next month"
      >
        <Text style={styles.arrow}>▶</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  arrow: {
    fontSize: typography.section,
    color: colors.primaryDark,
  },
  labelBox: {
    alignItems: 'center',
  },
  label: {
    fontSize: typography.section,
    fontWeight: '800',
    color: colors.text,
  },
  sub: {
    fontSize: typography.small,
    color: colors.textMuted,
  },
});
