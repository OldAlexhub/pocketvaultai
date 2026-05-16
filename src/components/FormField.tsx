import React from 'react';
import {StyleSheet, Text, TextInput, TextInputProps, View} from 'react-native';
import {colors} from '../theme';

export function FormField({
  label,
  error,
  inputStyle,
  ...props
}: TextInputProps & {label: string; error?: string; inputStyle?: TextInputProps['style']}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, props.multiline ? styles.multiline : null, inputStyle]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    color: colors.navy,
    fontWeight: '800',
    fontSize: 14,
  },
  input: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    color: colors.black,
    backgroundColor: colors.surface,
    fontSize: 15,
  },
  multiline: {
    minHeight: 104,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
});
