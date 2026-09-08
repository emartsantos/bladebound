import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { theme } from '../theme';

interface BigButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Mobile-first action button with large touch target (>=44px).
 */
export function BigButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  testID,
}: BigButtonProps) {
  const bg =
    variant === 'primary'
      ? theme.colors.accent
      : variant === 'danger'
        ? theme.colors.danger
        : theme.colors.secondary;

  const fg =
    variant === 'primary'
      ? theme.colors.onAccent
      : variant === 'danger'
        ? theme.colors.onSecondary
        : theme.colors.onSecondary;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        pressed && !disabled && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={[styles.text, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

interface CardProps {
  children: React.ReactNode;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Surface card.
 */
export function Card({ children, padded = true, style }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>{children}</View>
  );
}

interface ResourceBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
}

/**
 * Progress-style resource bar (health, xp, etc).
 */
export function ResourceBar({ label, value, max, color }: ResourceBarProps) {
  const safeMax = max > 0 ? max : 1;
  const ratio = Math.max(0, Math.min(1, value / safeMax));
  return (
    <View style={styles.resourceRow}>
      <Text style={styles.resourceLabel}>{label}</Text>
      <View style={styles.resourceTrack}>
        <View
          style={[
            styles.resourceFill,
            { width: `${ratio * 100}%`, backgroundColor: color ?? theme.colors.accent },
          ]}
        />
      </View>
      <Text style={styles.resourceValue}>
        {Math.round(value)}/{Math.round(max)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: theme.touchTarget.minWidth,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  text: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  padded: {
    padding: theme.spacing.lg,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  resourceLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
    width: 52,
  },
  resourceTrack: {
    flex: 1,
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.iron,
    overflow: 'hidden',
  },
  resourceFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
  },
  resourceValue: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    width: 64,
    textAlign: 'right',
  },
});
