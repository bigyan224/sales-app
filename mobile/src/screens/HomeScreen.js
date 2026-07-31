import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SaleForm } from '../components/SaleForm';
import { SaleRow } from '../components/SaleRow';
import { StatCard } from '../components/StatCard';
import { SyncBadge } from '../components/SyncBadge';
import { useSales } from '../hooks/useSales';
import { bsDateString, todayBs } from '../services/nepaliDate';
import { useSyncStore } from '../state/syncStore';
import { colors, radii, spacing, typography } from '../theme';
import { formatMoney } from '../utils/format';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sales, todaySummary, addSale, removeSale, loading } = useSales();
  const syncStatus = useSyncStore((s) => s.status);
  const isOnline = useSyncStore((s) => s.isOnline);
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const syncNow = useSyncStore((s) => s.syncNow);

  const todaySales = useMemo(() => {
    const dayKey = bsDateString(todayBs());
    return sales
      .filter((s) => s.bsDate === dayKey)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 8);
  }, [sales]);

  const confirmDelete = (sale) => {
    Alert.alert(
      'Delete Sale',
      `Delete the sale of ${sale.salesAmount} for ${sale.bsDate}?`,
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

  const onEdit = (sale) => {
    navigation.navigate('EditSale', { saleId: sale.id });
  };

  const isOffline = isOnline === false;
  const showBanner =
    syncStatus === 'error' || (isOffline && pendingCount > 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Today's Sales</Text>
          <Text style={styles.title}>Sales Tracker</Text>
        </View>
        <SyncBadge />
      </View>

      {showBanner ? (
        <View
          style={[
            styles.banner,
            syncStatus === 'error' ? styles.bannerError : styles.bannerOffline,
          ]}
        >
          <Text
            style={[
              styles.bannerText,
              syncStatus === 'error' ? styles.bannerTextError : styles.bannerTextOffline,
            ]}
          >
            {syncStatus === 'error'
              ? 'Sync failed — data saved offline'
              : 'Offline — changes will sync automatically'}
          </Text>
          <Pressable
            onPress={() => void syncNow()}
            accessibilityRole="button"
            accessibilityLabel="Retry sync"
            style={({ pressed }) => [styles.bannerButton, pressed && styles.pressed]}
          >
            <Text
              style={[
                styles.bannerButtonText,
                syncStatus === 'error' ? styles.bannerTextError : styles.bannerTextOffline,
              ]}
            >
              Retry
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.formCard}>
        <SaleForm
          onSubmit={async (input) => {
            await addSale(input);
          }}
        />
      </View>

      {!loading ? (
        <View style={styles.summary}>
          <StatCard
            label="Total Sales"
            value={formatMoney(todaySummary.totalSales)}
            accent={colors.primary}
          />
          <StatCard
            label="Total Profit"
            value={formatMoney(todaySummary.totalProfit)}
            accent={colors.success}
          />
          <StatCard
            label="Transactions"
            value={String(todaySummary.count)}
            accent={colors.warning}
          />
        </View>
      ) : (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      <Text style={styles.sectionTitle}>Today's Entries</Text>
      {todaySales.length === 0 ? (
        <Text style={styles.emptyText}>No sales recorded yet today.</Text>
      ) : (
        todaySales.map((sale) => (
          <SaleRow key={sale.id} sale={sale} onEdit={onEdit} onDelete={confirmDelete} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  eyebrow: {
    fontSize: typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.text,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerError: {
    backgroundColor: colors.dangerSoft,
  },
  bannerOffline: {
    backgroundColor: colors.warningSoft,
  },
  bannerText: {
    fontSize: typography.small,
    fontWeight: '600',
    flexShrink: 1,
  },
  bannerTextError: {
    color: colors.danger,
  },
  bannerTextOffline: {
    color: colors.warning,
  },
  bannerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginLeft: spacing.sm,
  },
  bannerButtonText: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summary: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  loadingRow: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
});
