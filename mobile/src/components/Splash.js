import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

/** Shown while the SQLite database is initializing on first launch. */
export function Splash() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/splash-icon.png')}
        style={styles.image}
        resizeMode="contain"
      />
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
  image: {
    width: 120,
    height: 120,
    marginBottom: 16,
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
