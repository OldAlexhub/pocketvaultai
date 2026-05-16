import React, {useEffect, useState} from 'react';
import {Alert, StyleSheet, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {Screen} from '../components/Screen';
import {useVault} from '../context/VaultContext';
import {authenticateForAppLock, isDeviceLockAvailable} from '../services/appLockService';
import {colors} from '../theme';

export function AppLockSetupScreen() {
  const navigation = useNavigation<any>();
  const {data, updateSettings} = useVault();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    isDeviceLockAvailable().then(setAvailable);
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const result = await authenticateForAppLock(
        'Enable app lock',
        'Confirm your device screen lock to enable PocketVault AI app lock.',
      );
      if (!result.success) {
        Alert.alert('App lock not enabled', result.unavailable ? 'Set up a device screen lock first.' : 'Authentication did not complete.');
        return;
      }
      await updateSettings({appLockEnabled: true, requireUnlockOnLaunch: true});
      Alert.alert('App lock enabled', 'PocketVault AI will request local device authentication when needed.');
      navigation.navigate(data.settings.onboardingCompleted ? 'MainTabs' : 'Onboarding');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    await updateSettings({appLockEnabled: false});
    Alert.alert('App lock disabled', 'Your vault remains stored locally on this device.');
  };

  return (
    <Screen>
      <Card style={styles.header}>
        <Text style={styles.title}>Optional app lock</Text>
        <Text style={styles.body}>
          App lock uses your Android device authentication. PocketVault AI does not collect biometric data and does not store passwords.
        </Text>
      </Card>
      <Card>
        <Text style={styles.label}>Device lock status</Text>
        <Text style={styles.status}>
          {available === null ? 'Checking...' : available ? 'Available' : 'Not available. Set up a device screen lock in Android settings first.'}
        </Text>
      </Card>
      <Button label="Enable app lock" disabled={!available} loading={busy} onPress={enable} />
      {data.settings.appLockEnabled ? <Button label="Disable app lock" variant="danger" onPress={disable} /> : null}
      <Button label="Skip for now" variant="ghost" onPress={() => navigation.navigate('MainTabs')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy,
  },
  title: {
    color: colors.white,
    fontSize: 25,
    fontWeight: '900',
  },
  body: {
    color: colors.mist,
    lineHeight: 22,
    marginTop: 8,
  },
  label: {
    color: colors.navy,
    fontWeight: '900',
    fontSize: 17,
  },
  status: {
    color: colors.slate,
    marginTop: 8,
    lineHeight: 22,
  },
});
