import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

const RANK_COLORS = ['#EAB308', '#9CA3AF', '#C47F3E']; // gold, silver, bronze

/**
 * Ranked list of the items that appear in the most sales (based on the
 * product links tagged while entering a sale).
 */
export function MostSoldList({ items }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Most Sold</Text>
      <Text style={styles.subtitle}>Items tagged in your sales, ranked</Text>
      {items.map(({ product, count }, index) => (
        <View key={product.id} style={styles.row}>
          <View
            style={[
              styles.rank,
              { backgroundColor: RANK_COLORS[index] ?? colors.border },
            ]}
          >
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.count}>
            {count} sale{count === 1 ? '' : 's'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.section,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.small,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: typography.small,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    flex: 1,
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.text,
  },
  count: {
    fontSize: typography.small,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
