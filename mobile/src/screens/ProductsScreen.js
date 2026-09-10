import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BillRow } from '../components/BillRow';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { MostSoldList } from '../components/MostSoldList';
import { ProductRow } from '../components/ProductRow';
import { TextField } from '../components/TextField';
import { useBills } from '../hooks/useBills';
import { useProducts } from '../hooks/useProducts';
import { useSales } from '../hooks/useSales';
import { colors, radii, spacing, typography } from '../theme';

/**
 * Price lookup for shop items plus the wholesale bills archive. The Items and
 * Bills sides are fully independent: each has its own search, list and add
 * form — they only share this screen and the sync engine.
 */
export default function ProductsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('items');
  const [itemQuery, setItemQuery] = useState('');
  const [billQuery, setBillQuery] = useState('');

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <Button
          label="+ Add"
          variant="secondary"
          onPress={() =>
            navigation.navigate(mode === 'items' ? 'EditProduct' : 'EditBill', {})
          }
          style={styles.addButton}
          labelStyle={styles.addButtonLabel}
        />
      </View>

      <View style={styles.segmented}>
        <Pressable
          style={[styles.segment, mode === 'items' && styles.segmentActive]}
          onPress={() => setMode('items')}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'items' }}
        >
          <Text style={[styles.segmentText, mode === 'items' && styles.segmentTextActive]}>
            Items
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, mode === 'bills' && styles.segmentActive]}
          onPress={() => setMode('bills')}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'bills' }}
        >
          <Text style={[styles.segmentText, mode === 'bills' && styles.segmentTextActive]}>
            Bills
          </Text>
        </Pressable>
      </View>

      {mode === 'items' ? (
        <ItemsList navigation={navigation} query={itemQuery} setQuery={setItemQuery} />
      ) : (
        <BillsList navigation={navigation} query={billQuery} setQuery={setBillQuery} />
      )}
    </View>
  );
}

function ItemsList({ navigation, query, setQuery }) {
  const { products, removeProduct } = useProducts();
  const { sales } = useSales();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category?.toLowerCase().includes(q) ?? false),
    );
  }, [products, query]);

  // Rank products by how many sales they were tagged in.
  const mostSold = useMemo(() => {
    const counts = new Map();
    for (const sale of sales) {
      if (!Array.isArray(sale.productIds)) continue;
      for (const id of sale.productIds) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return products
      .map((p) => ({ product: p, count: counts.get(p.id) ?? 0 }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count || a.product.name.localeCompare(b.product.name))
      .slice(0, 10);
  }, [products, sales]);

  return (
    <>
      <View style={styles.controls}>
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="Search name or category…"
          inputProps={{ autoCapitalize: 'none' }}
        />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ProductRow
            product={item}
            onEdit={(p) => navigation.navigate('EditProduct', { productId: p.id })}
            onDelete={(p) => void removeProduct(p.id)}
          />
        )}
        ListHeaderComponent={
          <>
            {!query && mostSold.length > 0 ? (
              <MostSoldList items={mostSold} />
            ) : null}
            {visible.length > 0 ? (
              <Text style={styles.count}>
                {visible.length} item{visible.length === 1 ? '' : 's'}
              </Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title={query ? 'No matching products' : 'No products yet'}
            message={
              query
                ? 'Try a different search.'
                : 'Tap "+ Add" and enter your items with prices — they sync to every phone.'
            }
          />
        }
      />
    </>
  );
}

function BillsList({ navigation, query, setQuery }) {
  const { bills, removeBill } = useBills();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bills;
    return bills.filter(
      (b) => b.name.toLowerCase().includes(q) || b.bsDate.includes(q),
    );
  }, [bills, query]);

  return (
    <>
      <View style={styles.controls}>
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="Search shop name or bill date…"
          inputProps={{ autoCapitalize: 'none' }}
        />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <BillRow
            bill={item}
            onEdit={(b) => navigation.navigate('EditBill', { billId: b.id })}
            onDelete={(b) => void removeBill(b.id)}
          />
        )}
        ListHeaderComponent={
          visible.length > 0 ? (
            <Text style={styles.count}>
              {visible.length} bill{visible.length === 1 ? '' : 's'}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title={query ? 'No matching bills' : 'No bills yet'}
            message={
              query
                ? 'Try a different search.'
                : 'Tap "+ Add" and photograph a wholesale bill — it syncs to every phone.'
            }
          />
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.text,
  },
  addButton: {
    height: 44,
    paddingHorizontal: spacing.lg,
  },
  addButtonLabel: {
    fontSize: typography.label,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    padding: 3,
    marginBottom: spacing.lg,
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
  controls: {
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  count: {
    fontSize: typography.small,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});
