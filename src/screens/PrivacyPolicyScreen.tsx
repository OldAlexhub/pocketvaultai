import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {Card} from '../components/Card';
import {Screen} from '../components/Screen';
import {PRIVACY_POLICY_TEXT} from '../privacyText';
import {colors} from '../theme';

export function PrivacyPolicyScreen() {
  return (
    <Screen>
      <Card>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.body}>{PRIVACY_POLICY_TEXT.replace(/^# PocketVault AI Privacy Policy\n\n/, '')}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
  },
  body: {
    color: colors.slate,
    lineHeight: 23,
    fontSize: 15,
  },
});
