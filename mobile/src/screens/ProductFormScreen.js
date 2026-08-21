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
import { ProductForm } from '../components/ProductForm';
import { useProducts } from '../hooks/useProducts';
import { colors, radii, spacing, typography } from '../theme';

/**
 * Modal screen for adding/editing products. When adding, the form stays open
 * after each save (fast-seed mode) so many items can be entered in a row —
 * close with ✕ when done.
 */
export default function ProductFormScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { products, addProduct, updateProduct, loading } = useProducts();
  const productId = route.params?.productId;
  const product = productId ? products.find((p) => p.id === productId) : null;

  const close = () => navigation.goBack();

  if (productId && (loading || !product)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const initial = product
    ? {
        name: product.name,
        category: product.category,
        unit: product.unit,
        price: product.price,
        notes: product.notes ?? '',
        localImageUri: product.localImageUri,
        imageUrl: product.imageUrl,
      }
    : null;

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{product ? 'Edit Product' : 'Add Product'}</Text>
        <Pressable onPress={close} style={styles.closeButton} accessibilityLabel="Close">
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <ProductForm
            initial={initial}
            submitLabel={product ? 'Save Changes' : 'Save Product'}
            onSubmit={async (input) => {
              if (product) {
                await updateProduct(product.id, input);
                close();
              } else {
                await addProduct(input);
              }
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
