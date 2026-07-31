import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../theme';
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
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const salesAmount = parseMoney(amount);
    if (salesAmount === null || salesAmount <= 0) {
      setError('Please enter a sales amount greater than zero.');
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
      };
      await onSubmit(input);
      if (!initial) {
        // Reset the form after a fresh entry so the shop owner can enter the next sale.
        setTitle('');
        setAmount('');
        setProfit('');
        setBs(todayBs());
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <BsDateField value={bs} onChange={setBs} />

      <TextField
        label="Title (optional)"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Customer name or item"
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
  submit: {
    marginTop: spacing.sm,
  },
});
