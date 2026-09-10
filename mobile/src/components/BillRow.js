import React from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';
import { formatBsLong, parseBsDateString, todayBs } from '../services/nepaliDate';

/**
 * A bill row: photo thumbnail, store name and bill date. Tapping the row
 * opens the bill photo full-screen; editing happens only through the
 * pencil button.
 */
export function BillRow({ bill, onEdit, onDelete }) {
  const [viewerOpen, setViewerOpen] = React.useState(false);

  const imageSource = bill.localImageUri
    ? { uri: bill.localImageUri }
    : bill.imageUrl
      ? { uri: bill.imageUrl }
      : null;

  const parts = parseBsDateString(bill.bsDate) ?? todayBs();
  const dateLabel = formatBsLong(parts);

  const confirmDelete = () => {
    Alert.alert(
      'Delete Bill',
      `Remove the bill from "${bill.name}" (${bill.bsDate})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(bill),
        },
      ],
    );
  };

  return (
    <>
      <View style={styles.card}>
        <Pressable
          style={styles.main}
          onPress={() => imageSource && setViewerOpen(true)}
          accessibilityRole={imageSource ? 'imagebutton' : 'none'}
          accessibilityLabel={
            imageSource ? `View bill from ${bill.name}` : bill.name
          }
        >
          {imageSource ? (
            <Image source={imageSource} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]}>
              <Ionicons name="receipt-outline" size={22} color={colors.textMuted} />
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={2}>
              {bill.name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {dateLabel}
            </Text>
          </View>
          <Ionicons name="expand-outline" size={18} color={colors.textMuted} />
        </Pressable>
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={() => onEdit(bill)}
            accessibilityRole="button"
            accessibilityLabel={`Edit bill from ${bill.name}`}
          >
            <Ionicons name="pencil" size={18} color={colors.primaryDark} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={confirmDelete}
            accessibilityRole="button"
            accessibilityLabel={`Delete bill from ${bill.name}`}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={viewerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerOpen(false)}
      >
        <Pressable
          style={styles.viewerBackdrop}
          onPress={() => setViewerOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close bill photo"
        >
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          ) : null}
          <Text style={styles.viewerName}>{bill.name}</Text>
          <Text style={styles.viewerDate}>{dateLabel}</Text>
          <Text style={styles.viewerHint}>Tap anywhere to close</Text>
        </Pressable>
      </Modal>
    </>
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
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  viewerImage: {
    width: '100%',
    height: '68%',
  },
  viewerName: {
    fontSize: typography.section,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  viewerDate: {
    fontSize: typography.body,
    fontWeight: '700',
    color: '#7EB3FF',
    marginTop: spacing.xs,
  },
  viewerHint: {
    fontSize: typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: spacing.xl,
  },
});
