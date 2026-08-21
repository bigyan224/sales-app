import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { MostSoldList } from '../components/MostSoldList';
import { ProductRow } from '../components/ProductRow';
import { TextField } from '../components/TextField';
import { useProducts } from '../hooks/useProducts';
import { useSales } from '../hooks/useSales';
import { colors, spacing, typography } from '../theme';

/** Search-first price lookup for every product in the shop. */
export default function ProductsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { products, removeProduct } = useProducts();
  const { sales } = useSales();
  const [query, setQuery] = useState('');

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

  const onDelete = (product) => {
    void removeProduct(product.id);
  };

  const onEdit = (product) => {
    navigation.navigate('EditProduct', { productId: product.id });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <Button
          label="+ Add"
          variant="secondary"
          onPress={() => navigation.navigate('EditProduct', {})}
          style={styles.addButton}
          labelStyle={styles.addButtonLabel}
        />
      </View>

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
          <ProductRow product={item} onEdit={onEdit} onDelete={onDelete} />
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
    </View>
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
