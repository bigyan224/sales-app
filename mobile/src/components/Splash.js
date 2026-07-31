import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

/** Shown while the SQLite database is initializing on first launch. */
export function Splash() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sales Tracker</Text>
      <ActivityIndicator color={colors.primary} size="large" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.primary,
  },
  spinner: {
    marginTop: 24,
  },
});
