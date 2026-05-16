import React, {useState} from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Card} from '../components/Card';
import {Button} from '../components/Button';
import {Screen} from '../components/Screen';
import {DISCLAIMER, PRIMARY_TAGLINE} from '../constants';
import {useVault} from '../context/VaultContext';
import {colors} from '../theme';

export function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const {updateSettings} = useVault();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const continueApp = async (setupLock: boolean) => {
    setSaving(true);
    setError('');
    try {
      await updateSettings({disclaimerAccepted: true, onboardingCompleted: true});
      if (setupLock) {
        navigation.replace('AppLockSetup');
      } else {
        navigation.replace('MainTabs');
      }
    } catch {
      setError('Settings could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.name}>PocketVault AI</Text>
        <Text style={styles.tagline}>{PRIMARY_TAGLINE}</Text>
      </View>
      <View style={styles.cards}>
        <Card><Text style={styles.cardTitle}>Store reference copies locally</Text><Text style={styles.cardText}>Keep card and document details organized on your device.</Text></Card>
        <Card><Text style={styles.cardTitle}>Get renewal reminders</Text><Text style={styles.cardText}>Track expiration and renewal dates with local notifications.</Text></Card>
        <Card><Text style={styles.cardTitle}>Run a daily carry check</Text><Text style={styles.cardText}>Review what you want to carry for driving, work, errands, travel, and more.</Text></Card>
      </View>
      <Card style={styles.privacyCard}>
        <Text style={styles.privacyTitle}>Private by design</Text>
        <Text style={styles.privacyText}>Your vault stays on your device. No account. No cloud. No tracking.</Text>
      </Card>
      <Card style={styles.disclaimerCard}>
        <Text style={styles.disclaimerTitle}>Important boundary</Text>
        <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{checked: accepted}}
          onPress={() => setAccepted(value => !value)}
          style={styles.checkboxRow}>
          <View style={[styles.checkbox, accepted ? styles.checkboxOn : null]}>
            <Text style={styles.checkboxMark}>{accepted ? 'OK' : ''}</Text>
          </View>
          <Text style={styles.checkboxText}>I understand</Text>
        </Pressable>
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label="Continue" disabled={!accepted} loading={saving} onPress={() => continueApp(false)} />
      <Button
        label="Continue and set up app lock"
        variant="secondary"
        disabled={!accepted}
        loading={saving}
        onPress={() => continueApp(true)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 22,
  },
  name: {
    marginTop: 14,
    fontSize: 30,
    fontWeight: '900',
    color: colors.navy,
  },
  tagline: {
    marginTop: 8,
    color: colors.slate,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 23,
  },
  cards: {
    gap: 12,
  },
  cardTitle: {
    color: colors.navy,
    fontWeight: '900',
    fontSize: 16,
  },
  cardText: {
    color: colors.slate,
    marginTop: 6,
    lineHeight: 21,
  },
  privacyCard: {
    backgroundColor: colors.tealSoft,
  },
  privacyTitle: {
    color: colors.navy,
    fontWeight: '900',
    fontSize: 17,
  },
  privacyText: {
    color: colors.navy,
    marginTop: 6,
    lineHeight: 22,
  },
  disclaimerCard: {
    gap: 12,
  },
  disclaimerTitle: {
    color: colors.navy,
    fontWeight: '900',
    fontSize: 17,
  },
  disclaimer: {
    color: colors.slate,
    lineHeight: 22,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.teal,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  checkboxText: {
    color: colors.navy,
    fontWeight: '800',
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
  },
});
