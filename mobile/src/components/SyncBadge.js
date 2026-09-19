import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useServerStore } from '../state/serverStore';
import { useSyncStore } from '../state/syncStore';
import { ServerStatus } from './ServerStatus';

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

/** Compact tappable server/sync button shown in the Home header. Opens server picker. */
export function SyncBadge() {
  const status = useSyncStore((s) => s.status);
  const isOnline = useSyncStore((s) => s.isOnline);
  const [open, setOpen] = useState(false);

  const effective = isOnline === false && status === 'idle' ? 'offline' : status;
  const meta = STATUS[effective] ?? STATUS.idle;
  const label = STATUS_TEXT[effective] ?? 'Ready';
  const active = useServerStore((s) => s.active);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Server: ${active ?? 'offline'}. Sync status: ${label}. Tap to change server.`}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: meta.bg },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </Pressable>
      <ServerStatus visible={open} onClose={() => setOpen(false)} />
    </>
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
