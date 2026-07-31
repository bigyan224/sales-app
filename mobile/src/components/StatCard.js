import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

export function StatCard({ label, value, accent = colors.primary }) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  value: {
    fontSize: typography.section,
    fontWeight: '800',
  },
  label: {
    fontSize: typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
