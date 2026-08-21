import React, { useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { TextField } from './TextField';
import { pickProductImage } from '../services/imageService';
import { colors, radii, spacing, typography } from '../theme';
import { parseMoney } from '../utils/format';

const UNIT_OPTIONS = ['piece', 'kg', 'g', 'packet', 'litre'];
const CATEGORY_OPTIONS = ['Puja', 'Utensils', 'Plastic', 'Other'];

/**
 * Shared create/edit form for products. In create mode the form clears after
 * each save (keeping unit + category) so a whole shelf of items can be entered
 * back-to-back; in edit mode the parent screen closes the modal.
 */
export function ProductForm({ initial, onSubmit, submitLabel = 'Save Product' }) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [unit, setUnit] = useState(initial?.unit ?? null);
  const [category, setCategory] = useState(initial?.category ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [localImageUri, setLocalImageUri] = useState(initial?.localImageUri ?? null);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef(null);

  const handlePickImage = async () => {
    const uri = await pickProductImage();
    if (!uri) return;
    setLocalImageUri(uri);
    setImageUrl(null); // force a fresh upload of the replacement photo
  };

  const handleRemoveImage = () => {
    Alert.alert('Remove Photo', 'Remove the photo for this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setLocalImageUri(null);
          setImageUrl(null);
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    const priceValue = parseMoney(price);
    if (!name.trim()) {
      setError('Please enter the product name.');
      return;
    }
    if (priceValue === null || priceValue <= 0) {
      setError('Please enter a price greater than zero.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        unit,
        price: priceValue,
        notes: notes.trim() || null,
        localImageUri,
        imageUrl,
      });
      if (!isEdit) {
        // Fast-seed mode: clear for the next item but keep unit + category.
        setName('');
        setPrice('');
        setNotes('');
        setLocalImageUri(null);
        setImageUrl(null);
        setError(null);
        if (nameRef.current) nameRef.current.focus();
      }
    } finally {
      setSaving(false);
    }
  };

  const shownImage = localImageUri ?? imageUrl;

  return (
    <View>
      <View style={styles.imageRow}>
        {shownImage ? (
          <Pressable onPress={handleRemoveImage} accessibilityLabel="Remove photo">
            <Image source={{ uri: shownImage }} style={styles.image} />
            <View style={styles.imageRemoveBadge}>
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </View>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.imageAdd, pressed && styles.pressed]}
            onPress={() => void handlePickImage()}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
          >
            <Ionicons name="camera-outline" size={24} color={colors.textMuted} />
            <Text style={styles.imageAddText}>Photo</Text>
          </Pressable>
        )}
        <Text style={styles.imageHint}>
          Optional. Saved on this phone and uploaded when online.
        </Text>
      </View>

      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Pital ko Lota / Agarbatti"
        inputProps={{ autoCapitalize: 'sentences' }}
        inputRef={nameRef}
      />

      <TextField
        label="Price"
        value={price}
        onChangeText={setPrice}
        placeholder="0"
        keyboardType="decimal-pad"
        prefix="रू"
        error={error}
      />

      <Text style={styles.chipLabel}>Unit (optional)</Text>
      <View style={styles.chipRow}>
        {UNIT_OPTIONS.map((option) => (
          <Pressable
            key={option}
            style={[styles.chip, unit === option && styles.chipActive]}
            onPress={() => setUnit(unit === option ? null : option)}
            accessibilityRole="button"
            accessibilityState={{ selected: unit === option }}
          >
            <Text style={[styles.chipText, unit === option && styles.chipTextActive]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.chipLabel}>Category (optional)</Text>
      <View style={styles.chipRow}>
        {CATEGORY_OPTIONS.map((option) => (
          <Pressable
            key={option}
            style={[styles.chip, category === option && styles.chipActive]}
            onPress={() => setCategory(category === option ? null : option)}
            accessibilityRole="button"
            accessibilityState={{ selected: category === option }}
          >
            <Text style={[styles.chipText, category === option && styles.chipTextActive]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextField
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. rate depends on daily silver price"
        inputProps={{ autoCapitalize: 'sentences' }}
      />

      <Button label={submitLabel} onPress={handleSubmit} loading={saving} style={styles.submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: radii.md,
    backgroundColor: colors.background,
  },
  imageRemoveBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageAdd: {
    width: 84,
    height: 84,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: colors.card,
  },
  imageAddText: {
    fontSize: typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  imageHint: {
    flex: 1,
    fontSize: typography.small,
    color: colors.textMuted,
  },
  chipLabel: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.small,
    fontWeight: '700',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.primaryDark,
  },
  submit: {
    marginTop: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
});
