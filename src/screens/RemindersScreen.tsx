import React, {useEffect, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {EmptyState} from '../components/EmptyState';
import {Screen} from '../components/Screen';
import {useVault} from '../context/VaultContext';
import {buildReminderPlan, canPostNotifications, requestNotificationPermission, rescheduleAllReminders} from '../services/notificationService';
import {colors} from '../theme';
import {formatDateTime} from '../utils/date';

export function RemindersScreen() {
  const navigation = useNavigation<any>();
  const {data, updateSettings, addUsageEvent} = useVault();
  const [permission, setPermission] = useState<boolean | null>(null);
  const reminders = buildReminderPlan(data).slice(0, 30);

  useEffect(() => {
    canPostNotifications().then(setPermission);
  }, [data.settings.notificationsEnabled]);

  const enable = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted);
    await updateSettings({notificationsEnabled: granted});
    if (granted) {
      await rescheduleAllReminders({...data, settings: {...data.settings, notificationsEnabled: true}});
      Alert.alert('Reminders enabled', 'PocketVault AI will schedule local reminders on this device.');
    } else {
      Alert.alert('Notifications not enabled', 'You can keep using the vault offline without reminder notifications.');
    }
  };

  const disable = async () => {
    await updateSettings({notificationsEnabled: false});
    await rescheduleAllReminders({...data, settings: {...data.settings, notificationsEnabled: false}});
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>Reminder status</Text>
        <Text style={styles.body}>
          Notifications are used only for local renewal, expiration, and carry check reminders.
        </Text>
        <Text style={styles.status}>Permission: {permission ? 'Allowed' : 'Not allowed or not requested'}</Text>
        <Text style={styles.status}>In-app setting: {data.settings.notificationsEnabled ? 'On' : 'Off'}</Text>
        <View style={styles.actions}>
          <Button label="Enable notifications" onPress={enable} />
          <Button label="Turn off reminders" variant="secondary" onPress={disable} />
        </View>
      </Card>
      <Card>
        <Text style={styles.title}>Daily Carry Check</Text>
        <Text style={styles.body}>Daily carry checks are {data.settings.dailyCarryCheckEnabled ? 'enabled' : 'disabled'}.</Text>
        <Button
          label={data.settings.dailyCarryCheckEnabled ? 'Disable daily carry check' : 'Enable daily carry check'}
          variant="secondary"
          onPress={() => updateSettings({dailyCarryCheckEnabled: !data.settings.dailyCarryCheckEnabled})}
        />
      </Card>
      <Card>
        <View style={styles.row}>
          <Text style={styles.title}>Upcoming reminders</Text>
          <Button label="Carry modes" variant="secondary" onPress={() => navigation.navigate('CarryModes')} />
        </View>
        {reminders.length === 0 ? (
          <EmptyState title="No reminders scheduled" message="Add expiration or renewal dates, or enable carry mode reminders." />
        ) : (
          reminders.map(reminder => (
            <View key={reminder.id} style={styles.reminderRow}>
              <View style={styles.reminderBody}>
                <Text style={styles.reminderTitle}>{reminder.title}</Text>
                <Text style={styles.reminderText}>{reminder.message}</Text>
                <Text style={styles.reminderTime}>{formatDateTime(reminder.scheduledDateTime)}</Text>
              </View>
              <View style={styles.reminderActions}>
                <Button
                  label="Done"
                  variant="secondary"
                  onPress={() => addUsageEvent({itemId: reminder.itemId, carryModeId: reminder.carryModeId, eventType: 'reminder_completed'})}
                />
                <Button
                  label="Dismiss"
                  variant="ghost"
                  onPress={() => addUsageEvent({itemId: reminder.itemId, carryModeId: reminder.carryModeId, eventType: 'reminder_dismissed'})}
                />
              </View>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '900',
  },
  body: {
    color: colors.slate,
    marginTop: 8,
    lineHeight: 22,
  },
  status: {
    color: colors.navy,
    fontWeight: '800',
    marginTop: 8,
  },
  actions: {
    gap: 10,
    marginTop: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  reminderRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 12,
    gap: 10,
  },
  reminderBody: {
    gap: 4,
  },
  reminderTitle: {
    color: colors.navy,
    fontWeight: '900',
  },
  reminderText: {
    color: colors.slate,
  },
  reminderTime: {
    color: colors.teal,
    fontWeight: '800',
  },
  reminderActions: {
    gap: 8,
  },
});
