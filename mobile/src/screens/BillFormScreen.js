import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BillForm } from '../components/BillForm';
import { useBills } from '../hooks/useBills';
import { colors, radii, spacing, typography } from '../theme';

/** Modal screen for adding/editing wholesale bills. Closes after saving. */
export default function BillFormScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { bills, addBill, updateBill, loading } = useBills();
  const billId = route.params?.billId;
  const bill = billId ? bills.find((b) => b.id === billId) : null;

  const close = () => navigation.goBack();

  if (billId && (loading || !bill)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const initial = bill
    ? {
        name: bill.name,
        bsDate: bill.bsDate,
        notes: bill.notes ?? '',
        localImageUri: bill.localImageUri,
        imageUrl: bill.imageUrl,
      }
    : null;

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{bill ? 'Edit Bill' : 'Add Bill'}</Text>
        <Pressable onPress={close} style={styles.closeButton} accessibilityLabel="Close">
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <BillForm
            initial={initial}
            submitLabel={bill ? 'Save Changes' : 'Save Bill'}
            onSubmit={async (input) => {
              if (bill) {
                await updateBill(bill.id, input);
              } else {
                await addBill(input);
              }
              close();
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.text,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.pill,
  },
  closeText: {
    fontSize: typography.section,
    color: colors.textMuted,
    fontWeight: '700',
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
  },
});
