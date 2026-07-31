import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { buttonHeight, colors, radii, typography } from '../theme';

const variants = {
  primary: { bg: colors.primary, text: '#FFFFFF' },
  secondary: { bg: colors.primarySoft, text: colors.primaryDark },
  danger: { bg: colors.danger, text: '#FFFFFF' },
  ghost: { bg: 'transparent', text: colors.primary },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  labelStyle,
}) {
  const palette = variants[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text style={[styles.label, { color: palette.text }, labelStyle]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: buttonHeight,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '700',
  },
});
