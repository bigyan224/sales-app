import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { formatBsLong, parseBsDateString } from '../services/nepaliDate';
import { formatMoney } from '../utils/format';

export function SaleRow({ sale, onEdit, onDelete, onMarkPaid }) {
  const parts = parseBsDateString(sale.bsDate);
  const dateLabel = parts ? formatBsLong(parts) : sale.bsDate;
  const isCredit = sale.paymentStatus === 'pending';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.date}>{dateLabel}</Text>
          {isCredit ? <Text style={styles.creditBadge}>Credit</Text> : null}
        </View>
        <Text style={styles.amount}>{formatMoney(sale.salesAmount)}</Text>
      </View>

      {sale.title ? <Text style={styles.title}>{sale.title}</Text> : null}

      {sale.profit != null ? (
        <Text style={styles.profit}>
          Profit: <Text style={styles.profitValue}>{formatMoney(sale.profit)}</Text>
        </Text>
      ) : null}

      {isCredit ? (
        <Text style={styles.pendingNote}>Payment pending</Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.action, styles.editAction, pressed && styles.pressed]}
          onPress={() => onEdit(sale)}
        >
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
        {isCredit && onMarkPaid ? (
          <Pressable
            style={({ pressed }) => [styles.action, styles.paidAction, pressed && styles.pressed]}
            onPress={() => onMarkPaid(sale)}
          >
            <Text style={styles.paidText}>Mark Paid</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={({ pressed }) => [styles.action, styles.deleteAction, pressed && styles.pressed]}
          onPress={() => onDelete(sale)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  date: {
    fontSize: typography.small,
    color: colors.textMuted,
    flexShrink: 1,
  },
  creditBadge: {
    backgroundColor: colors.warningSoft,
    color: colors.warning,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  amount: {
    fontSize: typography.section,
    fontWeight: '800',
    color: colors.text,
  },
  title: {
    fontSize: typography.body,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  profit: {
    fontSize: typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  profitValue: {
    fontWeight: '700',
    color: colors.success,
  },
  pendingNote: {
    fontSize: typography.small,
    color: colors.warning,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  action: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
  },
  editAction: {
    backgroundColor: colors.primarySoft,
  },
  paidAction: {
    backgroundColor: colors.successSoft,
  },
  deleteAction: {
    backgroundColor: colors.dangerSoft,
  },
  editText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: '700',
  },
  paidText: {
    color: colors.success,
    fontSize: typography.label,
    fontWeight: '700',
  },
  deleteText: {
    color: colors.danger,
    fontSize: typography.label,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
