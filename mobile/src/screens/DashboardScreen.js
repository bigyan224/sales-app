import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart, ChartLegend } from '../components/BarChart';
import { EmptyState } from '../components/EmptyState';
import { MonthSelector } from '../components/MonthSelector';
import { SaleRow } from '../components/SaleRow';
import { StatCard } from '../components/StatCard';
import { TextField } from '../components/TextField';
import { useSales } from '../hooks/useSales';
import {
  bsDateString,
  bsMonthKey,
  bsToDate,
  daysInBsMonth,
  formatBsLong,
  formatBsMonthKey,
  parseBsMonthKey,
  todayBs,
} from '../services/nepaliDate';
import { colors, radii, spacing, typography } from '../theme';
import { formatMoney } from '../utils/format';

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WHITE = [255, 255, 255];
const GREEN = [22, 128, 60];

function mix(a, b, t) {
  return Math.round(a + (b - a) * t);
}

/** Heatmap fill from white (no sales) to green (max sales). */
function heatColor(t) {
  return `rgb(${mix(WHITE[0], GREEN[0], t)}, ${mix(WHITE[1], GREEN[1], t)}, ${mix(
    WHITE[2],
    GREEN[2],
    t,
  )})`;
}

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sales, removeSale, markPaid } = useSales();
  const [monthKey, setMonthKey] = useState(() => bsMonthKey(todayBs()));
  const [selectedDay, setSelectedDay] = useState(null);
  const [query, setQuery] = useState('');

  const handleMonthChange = (key) => {
    setMonthKey(key);
    setSelectedDay(null);
  };

  const month = useMemo(() => {
    const parsed = parseBsMonthKey(monthKey);
    if (!parsed) return null;
    const maxDay = daysInBsMonth(parsed.year, parsed.month);
    const daily = {};
    for (let day = 1; day <= maxDay; day++) {
      daily[day] = { sales: 0, profit: 0, count: 0 };
    }
    const startPrefix = bsDateString({ year: parsed.year, month: parsed.month, day: 1 }).slice(0, 8);
    let outstanding = 0;
    for (const s of sales) {
      if (!s.bsDate.startsWith(startPrefix)) continue;
      const day = Number(s.bsDate.slice(8, 10));
      if (daily[day]) {
        daily[day].sales += s.salesAmount;
        daily[day].profit += s.profit ?? 0;
        daily[day].count += 1;
        if (s.paymentStatus === 'pending') outstanding += s.salesAmount;
      }
    }
    const maxSales = Math.max(1, ...Object.values(daily).map((d) => d.sales));
    const totalSales = Object.values(daily).reduce((sum, d) => sum + d.sales, 0);
    const totalProfit = Object.values(daily).reduce((sum, d) => sum + d.profit, 0);
    const count = Object.values(daily).reduce((sum, d) => sum + d.count, 0);
    return {
      ...parsed,
      maxDay,
      daily,
      maxSales,
      totalSales,
      totalProfit,
      count,
      outstanding,
      collected: totalSales - outstanding,
    };
  }, [sales, monthKey]);

  const chartData = useMemo(() => {
    if (!month) return [];
    const buckets = [];
    for (let day = 1; day <= month.maxDay; day++) {
      buckets.push({
        key: bsDateString({ year: month.year, month: month.month, day }),
        label: String(day),
        ...month.daily[day],
      });
    }
    return buckets;
  }, [month]);

  const today = useMemo(() => todayBs(), []);

  const cells = useMemo(() => {
    if (!month) return [];
    const firstWeekday = bsToDate({ year: month.year, month: month.month, day: 1 }).getDay();
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= month.maxDay; day++) {
      cells.push(day);
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [month]);

  const daySales = useMemo(() => {
    if (!selectedDay) return [];
    const dayKey = bsDateString(selectedDay);
    return sales
      .filter((s) => s.bsDate === dayKey)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [sales, selectedDay]);

  const daySummary = useMemo(() => {
    return daySales.reduce(
      (acc, s) => {
        acc.totalSales += s.salesAmount;
        acc.totalProfit += s.profit ?? 0;
        acc.count += 1;
        if (s.paymentStatus === 'pending') acc.outstanding += s.salesAmount;
        return acc;
      },
      { totalSales: 0, totalProfit: 0, count: 0, outstanding: 0 },
    );
  }, [daySales]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return sales
      .filter(
        (s) =>
          (s.title?.toLowerCase().includes(q) ?? false) || s.bsDate.includes(q),
      )
      .sort((a, b) => b.adDate.localeCompare(a.adDate));
  }, [sales, query]);

  const searching = query.trim().length > 0;

  const toggleDay = (day) => {
    const next = { year: month.year, month: month.month, day };
    setSelectedDay((cur) =>
      cur && cur.year === next.year && cur.month === next.month && cur.day === next.day
        ? null
        : next,
    );
  };

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

  const renderCell = (day, index) => {
    if (day == null) {
      return <View key={`blank-${index}`} style={styles.cell} />;
    }
    const info = month.daily[day];
    const t = Math.sqrt(info.sales / month.maxSales);
    const isToday = today.month === month.month && today.year === month.year && today.day === day;
    const isSelected =
      selectedDay &&
      selectedDay.year === month.year &&
      selectedDay.month === month.month &&
      selectedDay.day === day;
    const hasSales = info.sales > 0;
    return (
      <Pressable
        key={`day-${day}`}
        style={styles.cell}
        onPress={() => toggleDay(day)}
        accessibilityRole="button"
        accessibilityLabel={`View sales for ${formatBsLong({
          year: month.year,
          month: month.month,
          day,
        })}`}
      >
        <View
          style={[
            styles.circle,
            { backgroundColor: hasSales ? heatColor(t) : colors.card },
            hasSales ? styles.circleFilled : styles.circleEmpty,
            isToday && styles.circleToday,
            isSelected && styles.circleSelected,
          ]}
        >
          <Text
            style={[
              styles.dayNumber,
              { color: hasSales && t > 0.45 ? '#FFFFFF' : colors.text },
              isToday && styles.dayNumberToday,
            ]}
          >
            {day}
          </Text>
        </View>
      </Pressable>
    );
  };

  const weekRows = [];
  for (let i = 0; i < cells.length; i += 7) {
    weekRows.push(cells.slice(i, i + 7));
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Dashboard</Text>

      <MonthSelector bsMonth={monthKey} onChange={handleMonthChange} />

      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Search title or BS date (e.g. 2081-05-15)"
        inputProps={{ autoCapitalize: 'none' }}
      />

      {searching ? (
        <View>
          <Text style={styles.sectionTitle}>
            Search results ({searchResults.length})
          </Text>
          {searchResults.length === 0 ? (
            <EmptyState
              title="No matching sales"
              message="Try a different search."
            />
          ) : (
            searchResults.map((sale) => (
              <SaleRow
                key={sale.id}
                sale={sale}
                onEdit={onEdit}
                onDelete={confirmDelete}
                onMarkPaid={confirmMarkPaid}
              />
            ))
          )}
        </View>
      ) : month ? (
        <>
          <View style={styles.calendarCard}>
            <Text style={styles.cardTitle}>{formatBsMonthKey(monthKey)}</Text>
            <View style={styles.weekdayRow}>
              {WEEKDAY_HEADERS.map((w) => (
                <Text key={w} style={styles.weekday}>
                  {w}
                </Text>
              ))}
            </View>
            {weekRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.weekRow}>
                {row.map((day, index) => renderCell(day, index))}
              </View>
            ))}

            <View style={styles.legendRow}>
              <Text style={styles.legendLabel}>Less</Text>
              <LinearGradient
                colors={['#FFFFFF', '#16803C']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.legendBar}
              />
              <Text style={styles.legendLabel}>More</Text>
            </View>
          </View>

          {selectedDay ? (
            <View>
              <View style={styles.dayHeaderRow}>
                <Text style={styles.dayTitle}>{formatBsLong(selectedDay)}</Text>
                <Pressable
                  style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
                  onPress={() => setSelectedDay(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Back to month view"
                >
                  <Text style={styles.clearText}>✕ Month view</Text>
                </Pressable>
              </View>

              <View style={styles.summaryRow}>
                <StatCard
                  label="Total Sales"
                  value={formatMoney(daySummary.totalSales)}
                  accent={colors.primary}
                />
                <StatCard
                  label="Total Profit"
                  value={formatMoney(daySummary.totalProfit)}
                  accent={colors.success}
                />
              </View>
              <View style={styles.summaryRow}>
                <StatCard
                  label="Transactions"
                  value={String(daySummary.count)}
                  accent={colors.warning}
                />
                <StatCard
                  label="Outstanding"
                  value={formatMoney(daySummary.outstanding)}
                  accent={colors.danger}
                />
              </View>

              <Text style={styles.sectionTitle}>Day's Entries</Text>
              {daySales.length === 0 ? (
                <Text style={styles.emptyText}>No sales on this day.</Text>
              ) : (
                daySales.map((sale) => (
                  <SaleRow
                    key={sale.id}
                    sale={sale}
                    onEdit={onEdit}
                    onDelete={confirmDelete}
                    onMarkPaid={confirmMarkPaid}
                  />
                ))
              )}
            </View>
          ) : (
            <>
              <View style={styles.summaryRow}>
                <StatCard
                  label="Total Sales"
                  value={formatMoney(month.totalSales)}
                  accent={colors.primary}
                />
                <StatCard
                  label="Total Profit"
                  value={formatMoney(month.totalProfit)}
                  accent={colors.success}
                />
              </View>
              <View style={styles.summaryRow}>
                <StatCard
                  label="Transactions"
                  value={String(month.count)}
                  accent={colors.warning}
                />
                <StatCard
                  label="Avg per Sale"
                  value={formatMoney(month.count > 0 ? month.totalSales / month.count : 0)}
                  accent={colors.offline}
                />
              </View>
              <View style={styles.summaryRow}>
                <StatCard
                  label="Outstanding"
                  value={formatMoney(month.outstanding)}
                  accent={colors.danger}
                />
                <StatCard
                  label="Collected"
                  value={formatMoney(month.collected)}
                  accent={colors.success}
                />
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.cardTitle}>Daily breakdown</Text>
                <ChartLegend />
                <BarChart data={chartData} compact />
              </View>
            </>
          )}
        </>
      ) : null}
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
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.text,
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
  calendarCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.section,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.small,
    color: colors.textMuted,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleFilled: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  circleEmpty: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  circleToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  circleSelected: {
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  dayNumber: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  dayNumberToday: {
    color: colors.primary,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  legendBar: {
    width: 120,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dayTitle: {
    fontSize: typography.section,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
  },
  clearText: {
    fontSize: typography.small,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  pressed: {
    opacity: 0.7,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
});
