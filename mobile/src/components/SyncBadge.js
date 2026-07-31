import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useSyncStore } from '../state/syncStore';

const STATUS = {
  idle: { icon: 'sync', color: colors.textMuted, bg: colors.border },
  syncing: { icon: 'sync', color: colors.warning, bg: colors.warningSoft },
  synced: { icon: 'checkmark-circle', color: colors.success, bg: colors.successSoft },
  error: { icon: 'alert-circle', color: colors.danger, bg: colors.dangerSoft },
  offline: { icon: 'cloud-offline', color: colors.offline, bg: colors.border },
};

const STATUS_TEXT = {
  idle: 'Ready',
  syncing: 'Syncing…',
  synced: 'All synced',
  error: 'Sync error',
  offline: 'Offline',
};

/** Compact tappable sync button shown in the Home header. */
export function SyncBadge() {
  const status = useSyncStore((s) => s.status);
  const isOnline = useSyncStore((s) => s.isOnline);
  const syncNow = useSyncStore((s) => s.syncNow);

  const effective = isOnline === false && status === 'idle' ? 'offline' : status;
  const meta = STATUS[effective] ?? STATUS.idle;
  const label = STATUS_TEXT[effective] ?? 'Ready';

  return (
    <Pressable
      onPress={() => void syncNow()}
      accessibilityRole="button"
      accessibilityLabel={`Sync status: ${label}. Tap to sync now.`}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: meta.bg },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={meta.icon} size={20} color={meta.color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
