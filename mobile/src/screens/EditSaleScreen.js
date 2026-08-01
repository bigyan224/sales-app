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
import { SaleForm } from '../components/SaleForm';
import { useSales } from '../hooks/useSales';
import { colors, radii, spacing, typography } from '../theme';

/** Modal screen for editing an existing sale. */
export default function EditSaleScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { sales, updateSale, loading } = useSales();
  const sale = sales.find((s) => s.id === route.params.saleId);

  const close = () => navigation.goBack();

  if (loading || !sale) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const initial = {
    bsDate: sale.bsDate,
    adDate: sale.adDate,
    title: sale.title ?? '',
    salesAmount: sale.salesAmount,
    profit: sale.profit,
    paymentStatus: sale.paymentStatus ?? 'paid',
  };

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Sale</Text>
        <Pressable onPress={close} style={styles.closeButton} accessibilityLabel="Close">
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <SaleForm
            initial={initial}
            submitLabel="Save Changes"
            onSubmit={async (input) => {
              await updateSale(sale.id, input);
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
