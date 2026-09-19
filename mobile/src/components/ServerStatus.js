import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_FALLBACK_URL, API_PRIMARY_URL } from '../config';
import { useServerStore } from '../state/serverStore';
import { colors, radii, spacing, typography } from '../theme';

function shortHost(url) {
  try {
    return String(url).replace(/^https?:\/\//, '').replace(/\/api\/?$/, '');
  } catch {
    return url;
  }
}

function StatusDot({ online }) {
  const color =
    online === null || online === undefined
      ? colors.textMuted
      : online
        ? colors.success
        : colors.danger;
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

function OptionRow({ selected, title, subtitle, online, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.pressed]}
    >
      <StatusDot online={online} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
      ) : (
        <Ionicons name="ellipse-outline" size={22} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

/**
 * Server picker shown from the Home header (where SyncBadge sits).
 * Rows are tappable — no Switch component. Manual choice persists and pins
 * api.js; Auto keeps primary-first with Render fallback.
 */
export function ServerStatus({ visible, onClose }) {
  const mode = useServerStore((s) => s.mode);
  const active = useServerStore((s) => s.active);
  const primaryOnline = useServerStore((s) => s.primaryOnline);
  const fallbackOnline = useServerStore((s) => s.fallbackOnline);
  const checking = useServerStore((s) => s.checking);
  const select = useServerStore((s) => s.select);
  const refresh = useServerStore((s) => s.refresh);

  const connectedLabel =
    active === 'primary'
      ? 'Laptop'
      : active === 'fallback'
        ? 'Render'
        : 'Offline';

  const statusWord = (online) =>
    online === null || online === undefined ? 'Checking…' : online ? 'Online' : 'Offline';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close server settings">
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Server</Text>
            <Pressable onPress={onClose} accessibilityLabel="Close" style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.connected}>
            Connected to: <Text style={styles.connectedValue}>{connectedLabel}</Text>
          </Text>

          {checking ? (
            <View style={styles.checkingRow}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.checkingText}>Checking servers…</Text>
            </View>
          ) : null}

          <OptionRow
            selected={mode === 'auto'}
            title="Auto (recommended)"
            subtitle={`Laptop first, Render fallback · now: ${connectedLabel}`}
            online={active !== null}
            onPress={() => void select('auto')}
          />
          <OptionRow
            selected={mode === 'primary'}
            title={`Laptop · ${statusWord(primaryOnline)}`}
            subtitle={shortHost(API_PRIMARY_URL)}
            online={primaryOnline}
            onPress={() => void select('primary')}
          />
          <OptionRow
            selected={mode === 'fallback'}
            title={`Render · ${statusWord(fallbackOnline)}`}
            subtitle={shortHost(API_FALLBACK_URL)}
            online={fallbackOnline}
            onPress={() => void select('fallback')}
          />

          <Pressable
            onPress={() => void refresh()}
            accessibilityRole="button"
            accessibilityLabel="Check servers again"
            style={({ pressed }) => [styles.checkButton, pressed && styles.pressed]}
          >
            <Text style={styles.checkButtonText}>Check again</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.section,
    fontWeight: '800',
    color: colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.pill,
  },
  closeText: {
    fontSize: typography.label,
    color: colors.textMuted,
    fontWeight: '700',
  },
  connected: {
    fontSize: typography.small,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  connectedValue: {
    fontWeight: '800',
    color: colors.text,
  },
  checkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkingText: {
    fontSize: typography.small,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  checkButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  checkButtonText: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  pressed: {
    opacity: 0.7,
  },
});
