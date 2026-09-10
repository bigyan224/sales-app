import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BsDateField } from './BsDateField';
import { Button } from './Button';
import { TextField } from './TextField';
import { pickProductImage } from '../services/imageService';
import { bsDateString, bsToAdString, parseBsDateString, todayBs } from '../services/nepaliDate';
import { colors, radii, spacing, typography } from '../theme';

/** Shared create/edit form for wholesale bills. The photo is required. */
export function BillForm({ initial, onSubmit, submitLabel = 'Save Bill' }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [bs, setBs] = useState(() =>
    initial ? parseBsDateString(initial.bsDate) ?? todayBs() : todayBs(),
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [localImageUri, setLocalImageUri] = useState(initial?.localImageUri ?? null);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handlePickImage = async () => {
    const uri = await pickProductImage();
    if (!uri) return;
    setLocalImageUri(uri);
    setImageUrl(null); // force a fresh upload of the replacement photo
  };

  const handleRemoveImage = () => {
    setLocalImageUri(null);
    setImageUrl(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter the shop or supplier name.');
      return;
    }
    if (!localImageUri && !imageUrl) {
      setError('Please add a photo of the bill.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        bsDate: bsDateString(bs),
        adDate: bsToAdString(bs),
        notes: notes.trim() || null,
        localImageUri,
        imageUrl,
      });
    } finally {
      setSaving(false);
    }
  };

  const shownImage = localImageUri ?? imageUrl;

  return (
    <View>
      <Text style={styles.fieldLabel}>Bill photo (required)</Text>
      <View style={styles.imageRow}>
        {shownImage ? (
          <View>
            <Image source={{ uri: shownImage }} style={styles.image} />
            <Pressable
              style={styles.imageChangeBadge}
              onPress={() => void handlePickImage()}
              accessibilityRole="button"
              accessibilityLabel="Replace photo"
            >
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </Pressable>
            <Pressable
              style={styles.imageRemoveBadge}
              onPress={handleRemoveImage}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
            >
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.imageAdd, pressed && styles.pressed]}
            onPress={() => void handlePickImage()}
            accessibilityRole="button"
            accessibilityLabel="Add bill photo"
          >
            <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
            <Text style={styles.imageAddText}>Camera / Gallery</Text>
          </Pressable>
        )}
        <Text style={styles.imageHint}>
          Saved on this phone instantly, uploaded when online.
        </Text>
      </View>

      <TextField
        label="Shop / supplier name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Shree Suppliers, Asan"
        inputProps={{ autoCapitalize: 'sentences' }}
      />

      <BsDateField value={bs} onChange={setBs} />

      <TextField
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. copper utensils lot"
        inputProps={{ autoCapitalize: 'sentences' }}
        error={error}
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
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: radii.md,
    backgroundColor: colors.background,
  },
  imageChangeBadge: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 120,
    height: 120,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
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
  submit: {
    marginTop: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
});
