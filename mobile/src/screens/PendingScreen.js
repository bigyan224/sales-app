import React, { useMemo } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { SaleRow } from '../components/SaleRow';
import { useSales } from '../hooks/useSales';
import { colors, radii, spacing, typography } from '../theme';
import { formatMoney } from '../utils/format';

export default function PendingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sales, removeSale, markPaid } = useSales();

  const pending = useMemo(() => {
    return sales
      .filter((s) => s.paymentStatus === 'pending')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [sales]);

  const totalOutstanding = useMemo(
    () => pending.reduce((sum, s) => sum + s.salesAmount, 0),
    [pending],
  );

  const confirmDelete = (sale) => {
    Alert.alert(
      'Delete Sale',
      `Delete the credit sale of ${sale.salesAmount} for ${sale.bsDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void removeSale(sale.id),
        },
      ],
    );
  };

  const confirmMarkPaid = (sale) => {
    Alert.alert(
      'Mark as Paid',
      `Mark "${sale.title ?? 'this sale'}" (${formatMoney(sale.salesAmount)}) as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Paid', onPress: () => void markPaid(sale.id) },
      ],
    );
  };

  const onEdit = (sale) => {
    navigation.navigate('EditSale', { saleId: sale.id });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>Pending</Text>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Total outstanding</Text>
          <Text style={styles.summaryValue}>{formatMoney(totalOutstanding)}</Text>
        </View>
        <Text style={styles.summaryCount}>
          {pending.length} credit sale{pending.length === 1 ? '' : 's'}
        </Text>
      </View>

      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <SaleRow
            sale={item}
            onEdit={onEdit}
            onDelete={confirmDelete}
            onMarkPaid={confirmMarkPaid}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No pending payments"
            message="Great — everyone has paid. New credit sales appear here."
          />
        }
        ListHeaderComponent={
          pending.length > 0 ? (
            <Text style={styles.hint}>Tap "Mark Paid" once a customer settles.</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: typography.section,
    fontWeight: '800',
    color: colors.danger,
    marginTop: spacing.xs,
  },
  summaryCount: {
    fontSize: typography.small,
    color: colors.textMuted,
    fontWeight: '700',
  },
  hint: {
    fontSize: typography.small,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
});
