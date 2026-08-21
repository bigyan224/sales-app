import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, inputHeight, radii, spacing, typography } from '../theme';

/**
 * Free-text title field with product suggestions. Typing shows matching items
 * (name or category); tapping one appends its name to the text — the price is
 * never applied automatically — and records a structured link so sales can be
 * analysed per item later. Linked items appear as removable chips.
 */
export function SaleItemInput({
  label,
  value,
  onChangeText,
  placeholder,
  products,
  selectedIds,
  onLink,
  onUnlink,
  error,
  inputProps,
}) {
  const [focused, setFocused] = useState(false);

  // Match against the last comma-separated segment the user is typing.
  const query = useMemo(() => {
    const parts = value.split(',');
    return parts[parts.length - 1].trim().toLowerCase();
  }, [value]);

  const suggestions = useMemo(() => {
    if (!focused || !query) return [];
    const linked = new Set(selectedIds);
    return products
      .filter(
        (p) =>
          !linked.has(p.id) &&
          (p.name.toLowerCase().includes(query) ||
            (p.category?.toLowerCase().includes(query) ?? false)),
      )
      .slice(0, 5);
  }, [products, query, focused, selectedIds]);

  const handleSelect = (product) => {
    // Replace the partially-typed keyword at the end of the text with the
    // full item name. The longest word-boundary-aligned suffix wins, so
    // "cha" -> "Chair" and "2 x pital" -> "2 x Pital ko Lota" both work,
    // while unrelated words like "Sita" are kept and appended after a comma.
    const t = value.trimEnd();
    const lowerT = t.toLowerCase();
    const lowerName = product.name.toLowerCase();
    let base = null;
    for (let len = Math.min(t.length, lowerName.length); len >= 3; len--) {
      if (lowerT.endsWith(lowerName.slice(0, len))) {
        const before = t.slice(0, t.length - len);
        if (before.length === 0 || /[\s,;:\u2014-]$/.test(before)) {
          base = before;
          break;
        }
      }
    }
    if (base !== null) {
      // Keep whatever preceded the keyword exactly as typed (e.g. "2 x ").
      onChangeText(`${base}${product.name}`);
    } else {
      const separator =
        t.length === 0 ? '' : /,\s*$/.test(t) ? ' ' : ', ';
      onChangeText(`${t}${separator}${product.name}`);
    }
    onLink(product.id);
  };

  const linkedProducts = useMemo(
    () =>
      selectedIds
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean),
    [selectedIds, products],
  );

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.relative}>
        <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...inputProps}
          />
        </View>

        {suggestions.length > 0 ? (
          <View style={styles.dropdown}>
            {suggestions.map((product) => (
              <Pressable
                key={product.id}
                style={({ pressed }) => [
                  styles.suggestion,
                  pressed && styles.suggestionPressed,
                ]}
                onPress={() => handleSelect(product)}
                onPressIn={() => setFocused(true)}
              >
                <Ionicons name="pricetag-outline" size={16} color={colors.textMuted} />
                <Text style={styles.suggestionName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.suggestionPrice} numberOfLines={1}>
                  रू{product.price}
                  {product.unit ? `/${product.unit}` : ''}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {linkedProducts.length > 0 ? (
        <View style={styles.chipRow}>
          {linkedProducts.map((product) => (
            <Pressable
              key={product.id}
              style={styles.chip}
              onPress={() => onUnlink(product.id)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${product.name} link`}
            >
              <Text style={styles.chipText} numberOfLines={1}>
                {product.name}
              </Text>
              <Ionicons name="close" size={14} color={colors.primaryDark} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  relative: {
    position: 'relative',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: inputHeight,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    fontSize: typography.body,
    color: colors.text,
    paddingVertical: 0,
  },
  dropdown: {
    position: 'absolute',
    top: inputHeight + spacing.xs,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 20,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  suggestionPressed: {
    backgroundColor: colors.primarySoft,
  },
  suggestionName: {
    flex: 1,
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.text,
  },
  suggestionPrice: {
    fontSize: typography.small,
    fontWeight: '700',
    color: colors.primary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    fontSize: typography.small,
    fontWeight: '700',
    color: colors.primaryDark,
    flexShrink: 1,
  },
  error: {
    color: colors.danger,
    fontSize: typography.small,
    marginTop: spacing.xs,
  },
});
