import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { formatMoneyCompact } from '../utils/format';

const CHART_HEIGHT = 150;

function BarValue({ value, height, color }) {
  const barHeight = value > 0 ? Math.max((value / height) * CHART_HEIGHT, 3) : 2;
  return (
    <View
      style={[
        styles.bar,
        {
          height: barHeight,
          backgroundColor: value > 0 ? color : colors.border,
        },
      ]}
    />
  );
}

/**
 * Horizontally scrollable grouped bar chart. Each bucket shows a sales bar
 * (primary) and, when present, a profit bar (success) side by side.
 */
export function BarChart({ data, compact = false }) {
  const max = Math.max(
    1,
    ...data.map((d) => Math.max(d.sales, d.profit ?? 0)),
  );
  const bucketWidth = compact ? 26 : 42;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {data.map((d) => {
        const hasProfit = d.profit != null && d.profit > 0;
        return (
          <View key={d.key} style={[styles.bucket, { width: bucketWidth }]}>
            <View style={styles.barsRow}>
              <BarValue value={d.sales} height={max} color={colors.primary} />
              {hasProfit ? (
                <BarValue value={d.profit} height={max} color={colors.success} />
              ) : null}
            </View>
            <Text style={styles.valueLabel} numberOfLines={1}>
              {d.sales > 0 ? formatMoneyCompact(d.sales) : ''}
            </Text>
            <Text style={styles.dayLabel} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

/** Small colored legend for chart series. */
export function ChartLegend() {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
        <Text style={styles.legendText}>Sales</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
        <Text style={styles.legendText}>Profit</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.sm,
  },
  bucket: {
    alignItems: 'center',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    gap: 3,
  },
  bar: {
    flex: 1,
    borderRadius: radii.sm,
    minWidth: 5,
  },
  valueLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  dayLabel: {
    fontSize: typography.small,
    color: colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
