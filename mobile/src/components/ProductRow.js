import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';
import { formatMoney } from '../utils/format';

/** A product row in the Products list: photo, name, category/unit and price. */
export function ProductRow({ product, onEdit, onDelete }) {
  const imageSource = product.localImageUri
    ? { uri: product.localImageUri }
    : product.imageUrl
      ? { uri: product.imageUrl }
      : null;

  const confirmDelete = () => {
    Alert.alert(
      'Delete Product',
      `Remove "${product.name}" from the product list? Sales history is not affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(product),
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <Pressable style={styles.main} onPress={() => onEdit(product)}>
        {imageSource ? (
          <Image source={imageSource} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <Ionicons name="image-outline" size={22} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          {product.category || product.unit ? (
            <Text style={styles.meta} numberOfLines={1}>
              {[product.category, product.unit].filter(Boolean).join(' • ')}
            </Text>
          ) : null}
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.price}>{formatMoney(product.price)}</Text>
          {product.unit ? <Text style={styles.unit}>/{product.unit}</Text> : null}
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          onPress={() => onEdit(product)}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${product.name}`}
        >
          <Ionicons name="pencil" size={18} color={colors.primaryDark} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          onPress={confirmDelete}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${product.name}`}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
  },
  thumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: typography.small,
    color: colors.textMuted,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: typography.section,
    fontWeight: '800',
    color: colors.primary,
  },
  unit: {
    fontSize: typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  actions: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.background,
  },
  pressed: {
    opacity: 0.6,
  },
});
