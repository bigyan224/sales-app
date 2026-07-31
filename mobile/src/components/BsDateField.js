import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, inputHeight, radii, spacing, typography } from '../theme';
import { formatBsLong, todayBs, isSameBsDay } from '../services/nepaliDate';
import { BsDatePickerModal } from './BsDatePickerModal';

/** Tappable field that shows the BS date and opens the Nepali date picker. */
export function BsDateField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const isToday = isSameBsDay(value, todayBs());

  return (
    <View style={styles.container}>
      <Text style={styles.label}>BS Date</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
        accessibilityRole="button"
        accessibilityLabel="Change BS date"
      >
        <View style={styles.fieldLeft}>
          <Text style={styles.dateText} numberOfLines={1}>
            {formatBsLong(value)}
          </Text>
          {isToday ? <Text style={styles.todayBadge}>Today</Text> : null}
        </View>
        <Text style={styles.changeText}>Change</Text>
      </Pressable>

      <BsDatePickerModal
        visible={open}
        value={value}
        onChange={onChange}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: inputHeight,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  fieldPressed: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  fieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  dateText: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  todayBadge: {
    backgroundColor: colors.successSoft,
    color: colors.success,
    fontSize: typography.small,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    overflow: 'hidden',
    flexShrink: 0,
  },
  changeText: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.primary,
    flexShrink: 0,
    marginLeft: spacing.sm,
  },
});
