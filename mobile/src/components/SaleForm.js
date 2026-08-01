import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { bsDateString, bsToAdString, parseBsDateString, todayBs } from '../services/nepaliDate';
import { parseMoney } from '../utils/format';
import { BsDateField } from './BsDateField';
import { Button } from './Button';
import { TextField } from './TextField';

/** Shared create/edit form used by Home and the Edit Sale screen. */
export function SaleForm({ initial, onSubmit, submitLabel = 'Save Sale' }) {
  const [bs, setBs] = useState(() =>
    initial ? parseBsDateString(initial.bsDate) ?? todayBs() : todayBs(),
  );
  const [title, setTitle] = useState(initial?.title ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.salesAmount) : '');
  const [profit, setProfit] = useState(initial?.profit != null ? String(initial.profit) : '');
  const [paymentStatus, setPaymentStatus] = useState(initial?.paymentStatus ?? 'paid');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const isCredit = paymentStatus === 'pending';

  const handleSubmit = async () => {
    const salesAmount = parseMoney(amount);
    if (salesAmount === null || salesAmount <= 0) {
      setError('Please enter a sales amount greater than zero.');
      return;
    }
    if (isCredit && !title.trim()) {
      setError('Enter the customer name and item for a credit sale.');
      return;
    }
    const profitValue = parseMoney(profit);

    setError(null);
    setSaving(true);
    try {
      const input = {
        bsDate: bsDateString(bs),
        adDate: bsToAdString(bs),
        title: title.trim() || null,
        salesAmount,
        profit: profitValue,
        paymentStatus,
      };
      await onSubmit(input);
      if (!initial) {
        // Reset the form after a fresh entry so the shop owner can enter the next sale.
        setTitle('');
        setAmount('');
        setProfit('');
        setPaymentStatus('paid');
        setBs(todayBs());
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <BsDateField value={bs} onChange={setBs} />

      <Text style={styles.fieldLabel}>Payment</Text>
      <View style={styles.segmented}>
        <Pressable
          style={[styles.segment, !isCredit && styles.segmentActive]}
          onPress={() => setPaymentStatus('paid')}
          accessibilityRole="button"
          accessibilityState={{ selected: !isCredit }}
        >
          <Text style={[styles.segmentText, !isCredit && styles.segmentTextActive]}>
            Cash
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, isCredit && styles.segmentActive]}
          onPress={() => setPaymentStatus('pending')}
          accessibilityRole="button"
          accessibilityState={{ selected: isCredit }}
        >
          <Text style={[styles.segmentText, isCredit && styles.segmentTextActive]}>
            Credit
          </Text>
        </Pressable>
      </View>
      {isCredit ? (
        <Text style={styles.creditHint}>
          Credit sales stay in the Pending tab until marked as paid.
        </Text>
      ) : null}

      <TextField
        label={isCredit ? 'Customer name + item' : 'Title (optional)'}
        value={title}
        onChangeText={setTitle}
        placeholder={isCredit ? 'e.g. Ram — 2 sacks of rice' : 'e.g. Customer name or item'}
        inputProps={{ autoCapitalize: 'sentences' }}
      />

      <TextField
        label="Sales Amount"
        value={amount}
        onChangeText={setAmount}
        placeholder="0"
        keyboardType="decimal-pad"
        prefix="रू"
        error={error}
      />

      <TextField
        label="Profit (optional)"
        value={profit}
        onChangeText={setProfit}
        placeholder="0"
        keyboardType="decimal-pad"
        prefix="रू"
      />

      <Button label={submitLabel} onPress={handleSubmit} loading={saving} style={styles.submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    padding: 3,
    marginBottom: spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  segmentActive: {
    backgroundColor: colors.card,
  },
  segmentText: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  creditHint: {
    fontSize: typography.small,
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  submit: {
    marginTop: spacing.sm,
  },
});
