import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {colors} from '../theme';

export function Chip({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected: !!selected, disabled: !!disabled}}
      disabled={disabled}
      onPress={onPress}
      style={[styles.chip, selected ? styles.selected : null, disabled ? styles.disabled : null]}>
      <Text style={[styles.label, selected ? styles.selectedLabel : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.slate,
    fontWeight: '700',
    fontSize: 13,
  },
  selectedLabel: {
    color: colors.white,
  },
});
