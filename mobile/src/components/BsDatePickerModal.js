import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '../theme';
import { daysInBsMonth, formatBsNepali, todayBs } from '../services/nepaliDate';
import { Button } from './Button';

const YEAR_MIN = 2075;
const YEAR_MAX = 2090;

const MONTH_NAMES = [
  'Baisakh',
  'Jestha',
  'Asar',
  'Shrawan',
  'Bhadra',
  'Aswin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

/** Simple, dependency-free Nepali date picker using big +/- steppers. */
export function BsDatePickerModal({ visible, value, onChange, onClose }) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);
  const [month, setMonth] = useState(value.month);
  const [day, setDay] = useState(value.day);

  const open = (next) => {
    if (next) {
      setDraft(value);
      setMonth(value.month);
      setDay(value.day);
    }
  };

  const changeMonth = (delta) => {
    setMonth((m) => Math.min(Math.max(m + delta, 1), 12));
  };

  const clamped = () => {
    const m = Math.min(Math.max(month, 1), 12);
    const maxDay = daysInBsMonth(draft.year, m);
    return { year: draft.year, month: m, day: Math.min(Math.max(day, 1), maxDay) };
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => open(true)}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Text style={styles.title}>Select BS Date</Text>
          <Text style={styles.preview}>{formatBsNepali(clamped())}</Text>

          <View style={styles.wheels}>
            <View style={styles.wheel}>
              <Text style={styles.wheelLabel}>Year</Text>
              <Stepper
                label={String(draft.year)}
                onUp={() =>
                  setDraft((p) => ({ ...p, year: Math.min(p.year + 1, YEAR_MAX) }))
                }
                onDown={() =>
                  setDraft((p) => ({ ...p, year: Math.max(p.year - 1, YEAR_MIN) }))
                }
              />
            </View>

            <View style={styles.wheel}>
              <Text style={styles.wheelLabel}>Month</Text>
              <Stepper
                label={MONTH_NAMES[month - 1]}
                onUp={() => changeMonth(1)}
                onDown={() => changeMonth(-1)}
              />
            </View>

            <View style={styles.wheel}>
              <Text style={styles.wheelLabel}>Day</Text>
              <Stepper
                label={String(day)}
                onUp={() => setDay((d) => d + 1)}
                onDown={() => setDay((d) => d - 1)}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              label="Today"
              variant="ghost"
              onPress={() => {
                const t = todayBs();
                setDraft(t);
                setMonth(t.month);
                setDay(t.day);
              }}
              style={styles.actionButton}
              labelStyle={styles.actionLabel}
            />
            <Button
              label="Cancel"
              variant="secondary"
              onPress={onClose}
              style={styles.actionButton}
              labelStyle={styles.actionLabel}
            />
            <Button
              label="OK"
              onPress={() => {
                onChange(clamped());
                onClose();
              }}
              style={styles.actionButton}
              labelStyle={styles.actionLabel}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Stepper({ label, onUp, onDown }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.arrow} onPress={onUp} accessibilityLabel="increase">
        <Text style={styles.arrowText}>▲</Text>
      </Pressable>
      <Text style={styles.stepperLabel}>{label}</Text>
      <Pressable style={styles.arrow} onPress={onDown} accessibilityLabel="decrease">
        <Text style={styles.arrowText}>▼</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  preview: {
    fontSize: typography.body,
    color: colors.primaryDark,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  wheels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.lg,
  },
  wheel: {
    flex: 1,
    alignItems: 'center',
  },
  wheelLabel: {
    fontSize: typography.small,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  stepper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  arrow: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 14,
    color: colors.primary,
  },
  stepperLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    maxWidth: '100%',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    height: 44,
    paddingHorizontal: 0,
  },
  actionLabel: {
    fontSize: 15,
  },
});
