import React, {useState} from 'react';
import {Alert, Pressable, StyleSheet, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {FormField} from '../components/FormField';
import {Screen} from '../components/Screen';
import {APP_VERSION, DISCLAIMER} from '../constants';
import {useVault} from '../context/VaultContext';
import {authenticateForAppLock} from '../services/appLockService';
import {colors} from '../theme';

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const {data, updateSettings, clearAllData} = useVault();
  const [confirmText, setConfirmText] = useState('');

  const testLock = async () => {
    const result = await authenticateForAppLock('Test app lock', 'Confirm your device screen lock to test app lock.');
    Alert.alert(result.success ? 'App lock works' : 'Authentication did not complete');
  };

  const clear = async () => {
    if (confirmText !== 'DELETE') {
      Alert.alert('Confirmation required', 'Type DELETE before clearing local data.');
      return;
    }
    Alert.alert('Delete all local vault data from this device?', 'This cannot be undone.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => {
        await clearAllData();
        setConfirmText('');
      }},
    ]);
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.body}>Manage local vault preferences. There are no account, cloud sync, or payment settings.</Text>
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>App lock</Text>
        <SettingRow label="App lock" value={data.settings.appLockEnabled ? 'On' : 'Off'} onPress={() => navigation.navigate('AppLockSetup')} />
        <SettingRow
          label="Require unlock on launch"
          value={data.settings.requireUnlockOnLaunch ? 'On' : 'Off'}
          onPress={() => updateSettings({requireUnlockOnLaunch: !data.settings.requireUnlockOnLaunch})}
        />
        <Button label="Test app lock" variant="secondary" onPress={testLock} />
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Notifications and carry check</Text>
        <SettingRow label="Notifications" value={data.settings.notificationsEnabled ? 'On' : 'Off'} onPress={() => navigation.navigate('Reminders')} />
        <SettingRow
          label="Daily Carry Check"
          value={data.settings.dailyCarryCheckEnabled ? 'On' : 'Off'}
          onPress={() => updateSettings({dailyCarryCheckEnabled: !data.settings.dailyCarryCheckEnabled})}
        />
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Privacy and disclaimer</Text>
        <Text style={styles.body}>{DISCLAIMER}</Text>
        <Button label="View privacy policy" variant="secondary" onPress={() => navigation.navigate('PrivacyPolicy')} />
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Export and backup</Text>
        <Button label="Open backup and export" variant="secondary" onPress={() => navigation.navigate('BackupExport')} />
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Theme</Text>
        <SettingRow label="Theme mode" value={data.settings.themeMode} onPress={() => updateSettings({themeMode: data.settings.themeMode === 'light' ? 'dark' : data.settings.themeMode === 'dark' ? 'system' : 'light'})} />
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Clear all data</Text>
        <Text style={styles.body}>Delete all local vault data from this device?</Text>
        <FormField label="Type DELETE to confirm" value={confirmText} onChangeText={setConfirmText} autoCapitalize="characters" />
        <Button label="Delete all local data" variant="danger" onPress={clear} />
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.body}>PocketVault AI version {APP_VERSION}</Text>
        <Text style={styles.body}>Developer: Old Alex Hub</Text>
        <Button label="Reset onboarding" variant="secondary" onPress={() => updateSettings({onboardingCompleted: false, disclaimerAccepted: false})} />
      </Card>
    </Screen>
  );
}

function SettingRow({label, value, onPress}: {label: string; value: string; onPress: () => void | Promise<void>}) {
  return (
    <Pressable style={styles.settingRow} onPress={onPress}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.navy,
    fontSize: 28,
    fontWeight: '900',
  },
  sectionTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  body: {
    color: colors.slate,
    lineHeight: 22,
    marginTop: 6,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    color: colors.navy,
    fontWeight: '800',
    flex: 1,
  },
  settingValue: {
    color: colors.teal,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
});
