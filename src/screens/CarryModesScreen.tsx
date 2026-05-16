import React, {useMemo, useState} from 'react';
import {Alert, Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {Chip} from '../components/Chip';
import {FormField} from '../components/FormField';
import {Screen} from '../components/Screen';
import {ITEM_TYPE_LABELS} from '../constants';
import {useVault} from '../context/VaultContext';
import {colors} from '../theme';
import {CarryMode, ITEM_TYPES, VaultItemType} from '../types';
import {validateCarryMode} from '../utils/validation';
import {calculateExpirationStatus, runCarryCheck} from '../utils/vault';

const DAYS = [
  {label: 'Sun', value: 0},
  {label: 'Mon', value: 1},
  {label: 'Tue', value: 2},
  {label: 'Wed', value: 3},
  {label: 'Thu', value: 4},
  {label: 'Fri', value: 5},
  {label: 'Sat', value: 6},
];

export function CarryModesScreen() {
  const navigation = useNavigation<any>();
  const {data, saveCarryMode, deleteCarryMode, duplicateCarryMode, addUsageEvent} = useVault();
  const [editing, setEditing] = useState<CarryMode | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const openEditor = (mode?: CarryMode) => {
    setEditing(mode ?? null);
    setShowEditor(true);
  };

  const runNow = async (mode: CarryMode) => {
    await addUsageEvent({carryModeId: mode.id, eventType: 'carry_check_completed', metadata: {manual: true}});
    Alert.alert('Carry check logged', `${mode.name} was marked complete for today.`);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Carry Modes</Text>
          <Text style={styles.subtitle}>Define what you want to carry for common situations.</Text>
        </View>
        <Button label="Create" onPress={() => openEditor()} />
      </View>
      {data.carryModes.map(mode => {
        const matches = runCarryCheck(data.items, mode);
        const expired = matches.filter(item => calculateExpirationStatus(item) === 'expired');
        const missingTypes = mode.requiredItemTypes.filter(type => !data.items.some(item => !item.archived && item.type === type));
        return (
          <Card key={mode.id}>
            <View style={styles.modeHeader}>
              <View style={styles.modeBadge}><Text style={styles.modeBadgeText}>{mode.icon}</Text></View>
              <View style={styles.modeBody}>
                <Text style={styles.modeTitle}>{mode.name}</Text>
                <Text style={styles.modeText}>{mode.description || 'No description added.'}</Text>
                <Text style={styles.modeText}>{matches.length} matching item{matches.length === 1 ? '' : 's'}</Text>
                {missingTypes.length > 0 ? <Text style={styles.warn}>Missing saved item type: {missingTypes.map(type => ITEM_TYPE_LABELS[type]).join(', ')}</Text> : null}
                {expired.length > 0 ? <Text style={styles.warn}>{expired.length} reference date passed based on entered dates.</Text> : null}
              </View>
            </View>
            <View style={styles.actions}>
              <Button label="Run check now" variant="secondary" onPress={() => runNow(mode)} />
              <Button label="Edit" variant="secondary" onPress={() => openEditor(mode)} />
              <Button label="Duplicate" variant="secondary" onPress={() => duplicateCarryMode(mode.id)} />
              {!mode.id.startsWith('mode-') ? <Button label="Delete" variant="danger" onPress={() => deleteCarryMode(mode.id)} /> : null}
            </View>
          </Card>
        );
      })}
      <CarryModeEditor
        visible={showEditor}
        mode={editing}
        onClose={() => setShowEditor(false)}
        onSave={async input => {
          await saveCarryMode(input);
          setShowEditor(false);
        }}
      />
      <Button label="Reminder settings" variant="secondary" onPress={() => navigation.navigate('Reminders')} />
    </Screen>
  );
}

function CarryModeEditor({
  visible,
  mode,
  onClose,
  onSave,
}: {
  visible: boolean;
  mode: CarryMode | null;
  onClose: () => void;
  onSave: (mode: Partial<CarryMode>) => Promise<void>;
}) {
  const [name, setName] = useState(mode?.name ?? '');
  const [description, setDescription] = useState(mode?.description ?? '');
  const [icon, setIcon] = useState(mode?.icon ?? 'CM');
  const [requiredItemTypes, setRequiredItemTypes] = useState<VaultItemType[]>(mode?.requiredItemTypes ?? []);
  const [reminderEnabled, setReminderEnabled] = useState(mode?.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(mode?.reminderTime ?? '08:00');
  const [activeDays, setActiveDays] = useState<number[]>(mode?.activeDays ?? [1, 2, 3, 4, 5]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    setName(mode?.name ?? '');
    setDescription(mode?.description ?? '');
    setIcon(mode?.icon ?? 'CM');
    setRequiredItemTypes(mode?.requiredItemTypes ?? []);
    setReminderEnabled(mode?.reminderEnabled ?? false);
    setReminderTime(mode?.reminderTime ?? '08:00');
    setActiveDays(mode?.activeDays ?? [1, 2, 3, 4, 5]);
    setErrors({});
  }, [mode, visible]);

  const toggleType = (type: VaultItemType) => {
    setRequiredItemTypes(current => current.includes(type) ? current.filter(value => value !== type) : [...current, type]);
  };

  const toggleDay = (day: number) => {
    setActiveDays(current => current.includes(day) ? current.filter(value => value !== day) : [...current, day].sort());
  };

  const save = async () => {
    const validation = validateCarryMode(name, reminderTime);
    setErrors(validation.errors);
    if (!validation.valid) {
      return;
    }
    if (requiredItemTypes.length === 0) {
      Alert.alert('Empty carry mode', 'This mode has no required item types. It can still be saved.');
    }
    await onSave({
      id: mode?.id,
      name,
      description,
      icon,
      requiredItemTypes,
      requiredItemIds: mode?.requiredItemIds ?? [],
      reminderEnabled,
      reminderTime,
      activeDays,
    });
  };

  const typeChips = useMemo(
    () => ITEM_TYPES.map(type => <Chip key={type} label={ITEM_TYPE_LABELS[type]} selected={requiredItemTypes.includes(type)} onPress={() => toggleType(type)} />),
    [requiredItemTypes],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Screen>
        <Text style={styles.title}>{mode ? 'Edit carry mode' : 'Create carry mode'}</Text>
        <FormField label="Name" value={name} onChangeText={setName} error={errors.name} placeholder="Driving" />
        <FormField label="Icon label" value={icon} onChangeText={setIcon} maxLength={2} placeholder="DR" />
        <FormField label="Description" value={description} onChangeText={setDescription} placeholder="What this carry mode is for" />
        <Text style={styles.sectionLabel}>Required item types</Text>
        <View style={styles.chips}>{typeChips}</View>
        <Pressable style={styles.toggleRow} onPress={() => setReminderEnabled(value => !value)}>
          <Text style={styles.toggleText}>Daily reminder</Text>
          <Text style={styles.toggleValue}>{reminderEnabled ? 'On' : 'Off'}</Text>
        </Pressable>
        <FormField label="Reminder time" value={reminderTime} onChangeText={setReminderTime} error={errors.reminderTime} placeholder="08:00" />
        <Text style={styles.sectionLabel}>Active days</Text>
        <View style={styles.chips}>
          {DAYS.map(day => <Chip key={day.value} label={day.label} selected={activeDays.includes(day.value)} onPress={() => toggleDay(day.value)} />)}
        </View>
        <Button label="Save carry mode" onPress={save} />
        <Button label="Cancel" variant="ghost" onPress={onClose} />
      </Screen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: colors.navy,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.slate,
    marginTop: 4,
    lineHeight: 20,
  },
  modeHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  modeBadge: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBadgeText: {
    color: colors.warning,
    fontWeight: '900',
  },
  modeBody: {
    flex: 1,
    gap: 5,
  },
  modeTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '900',
  },
  modeText: {
    color: colors.slate,
    lineHeight: 20,
  },
  warn: {
    color: colors.danger,
    fontWeight: '700',
  },
  actions: {
    gap: 8,
    marginTop: 14,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionLabel: {
    color: colors.navy,
    fontWeight: '900',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  toggleText: {
    color: colors.navy,
    fontWeight: '800',
  },
  toggleValue: {
    color: colors.teal,
    fontWeight: '900',
  },
});
