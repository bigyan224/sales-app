import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart, ChartLegend } from '../components/BarChart';
import { MonthSelector } from '../components/MonthSelector';
import { StatCard } from '../components/StatCard';
import { useSales } from '../hooks/useSales';
import {
  bsDateString,
  bsMonthKey,
  bsToDate,
  daysInBsMonth,
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

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { sales } = useSales();
  const [monthKey, setMonthKey] = useState(() => bsMonthKey(todayBs()));

  const month = useMemo(() => {
    const parsed = parseBsMonthKey(monthKey);
    if (!parsed) return null;
    const maxDay = daysInBsMonth(parsed.year, parsed.month);
    const daily = {};
    for (let day = 1; day <= maxDay; day++) {
      daily[day] = { sales: 0, profit: 0, count: 0 };
    }
    const startPrefix = bsDateString({ year: parsed.year, month: parsed.month, day: 1 }).slice(0, 8);
    for (const s of sales) {
      if (!s.bsDate.startsWith(startPrefix)) continue;
      const day = Number(s.bsDate.slice(8, 10));
      if (daily[day]) {
        daily[day].sales += s.salesAmount;
        daily[day].profit += s.profit ?? 0;
        daily[day].count += 1;
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

  const renderCell = (day, index) => {
    if (day == null) {
      return <View key={`blank-${index}`} style={styles.cell} />;
    }
    const info = month.daily[day];
    const t = Math.sqrt(info.sales / month.maxSales);
    const isToday = today.month === month.month && today.year === month.year && today.day === day;
    const hasSales = info.sales > 0;
    return (
      <View key={`day-${day}`} style={styles.cell}>
        <View
          style={[
            styles.circle,
            { backgroundColor: hasSales ? heatColor(t) : colors.card },
            hasSales ? styles.circleFilled : styles.circleEmpty,
            isToday && styles.circleToday,
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
      </View>
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
    >
      <Text style={styles.title}>Dashboard</Text>

      <MonthSelector bsMonth={monthKey} onChange={setMonthKey} />

      {month ? (
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

          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Daily breakdown</Text>
            <ChartLegend />
            <BarChart data={chartData} compact />
          </View>
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
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
});
