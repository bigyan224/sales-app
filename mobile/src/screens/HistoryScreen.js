import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { MonthSelector } from '../components/MonthSelector';
import { SaleRow } from '../components/SaleRow';
import { TextField } from '../components/TextField';
import { useSales } from '../hooks/useSales';
import {
  addDays,
  bsDateString,
  bsMonthKey,
  daysInBsMonth,
  formatBsLong,
  parseBsMonthKey,
  todayBs,
} from '../services/nepaliDate';
import { colors, radii, spacing, typography } from '../theme';
import { formatMoney } from '../utils/format';

export default function HistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sales, removeSale } = useSales();
  const [bsMonth, setBsMonth] = useState(() => bsMonthKey(todayBs()));
  const [selectedDay, setSelectedDay] = useState(() => todayBs());
  const [query, setQuery] = useState('');

  const handleMonthChange = (key) => {
    setBsMonth(key);
    const parsed = parseBsMonthKey(key);
    if (parsed) {
      const maxDay = daysInBsMonth(parsed.year, parsed.month);
      setSelectedDay((d) => ({
        year: parsed.year,
        month: parsed.month,
        day: Math.min(d.day, maxDay),
      }));
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return sales.filter(
        (s) =>
          (s.title?.toLowerCase().includes(q) ?? false) || s.bsDate.includes(q),
      );
    }
    const dayKey = bsDateString(selectedDay);
    return sales.filter((s) => s.bsDate === dayKey);
  }, [sales, bsMonth, selectedDay, query]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.adDate.localeCompare(a.adDate)),
    [filtered],
  );

  const dayTotal = useMemo(
    () => filtered.reduce((sum, s) => sum + s.salesAmount, 0),
    [filtered],
  );

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

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>History</Text>

      <View style={styles.controls}>
        <MonthSelector bsMonth={bsMonth} onChange={handleMonthChange} />

        <View style={styles.dayNav}>
          <Pressable
            style={({ pressed }) => [styles.navButton, pressed && styles.navPressed]}
            onPress={() => setSelectedDay((d) => addDays(d, -1))}
            accessibilityLabel="Previous day"
          >
            <Text style={styles.navArrow}>◀</Text>
          </Pressable>

          <View style={styles.dayLabelBox}>
            <Text style={styles.dayLabel} numberOfLines={1}>
              {formatBsLong(selectedDay)}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.navButton, pressed && styles.navPressed]}
            onPress={() => setSelectedDay((d) => addDays(d, 1))}
            accessibilityLabel="Next day"
          >
            <Text style={styles.navArrow}>▶</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.todayButton, pressed && styles.navPressed]}
            onPress={() => setSelectedDay(todayBs())}
            accessibilityLabel="Go to today"
          >
            <Text style={styles.todayText}>Today</Text>
          </Pressable>
        </View>

        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="Search title or BS date (e.g. 2081-05-15)"
          inputProps={{ autoCapitalize: 'none' }}
        />
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <SaleRow sale={item} onEdit={onEdit} onDelete={confirmDelete} />
        )}
        ListEmptyComponent={
          <EmptyState
            title={query ? 'No matching sales' : 'No sales on this day'}
            message={
              query
                ? 'Try a different search.'
                : 'Add a sale from the Home tab or pick another date.'
            }
          />
        }
        ListHeaderComponent={
          sorted.length > 0 && !query ? (
            <View style={styles.daySummary}>
              <Text style={styles.count}>
                {sorted.length} transaction{sorted.length === 1 ? '' : 's'}
              </Text>
              <Text style={styles.countTotal}>
                {formatMoney(dayTotal)}
              </Text>
            </View>
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
  controls: {
    marginBottom: spacing.md,
  },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
  },
  navPressed: {
    opacity: 0.7,
  },
  navArrow: {
    fontSize: typography.section,
    color: colors.primaryDark,
  },
  dayLabelBox: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: typography.label,
    fontWeight: '800',
    color: colors.text,
  },
  todayButton: {
    height: 44,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
  },
  todayText: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  daySummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  count: {
    fontSize: typography.small,
    color: colors.textMuted,
  },
  countTotal: {
    fontSize: typography.small,
    fontWeight: '700',
    color: colors.text,
  },
});
