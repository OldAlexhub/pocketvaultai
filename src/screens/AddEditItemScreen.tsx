import React, {useMemo, useState} from 'react';
import {Alert, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {Chip} from '../components/Chip';
import {FormField} from '../components/FormField';
import {Screen} from '../components/Screen';
import {DEFAULT_REMINDER_DAYS, ITEM_TYPE_LABELS, SENSITIVE_DEFAULT_TYPES} from '../constants';
import {useVault} from '../context/VaultContext';
import {pickImage} from '../services/fileService';
import {colors} from '../theme';
import {ITEM_TYPES, VaultItemType} from '../types';
import {parseReminderDays, sanitizeTags, validateVaultItem} from '../utils/validation';

export function AddEditItemScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {data, saveItem} = useVault();
  const itemId = route.params?.itemId as string | undefined;
  const existing = data.items.find(item => item.id === itemId);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [type, setType] = useState<VaultItemType>(existing?.type ?? 'custom');
  const [categoryLabel, setCategoryLabel] = useState(existing?.categoryLabel ?? ITEM_TYPE_LABELS[type]);
  const [ownerName, setOwnerName] = useState(existing?.ownerName ?? '');
  const [issuer, setIssuer] = useState(existing?.issuer ?? '');
  const [memberNumber, setMemberNumber] = useState(existing?.memberNumber ?? '');
  const [documentNumberSensitive, setDocumentNumberSensitive] = useState(existing?.documentNumberSensitive ?? '');
  const [issueDate, setIssueDate] = useState(existing?.issueDate ?? '');
  const [expirationDate, setExpirationDate] = useState(existing?.expirationDate ?? '');
  const [renewalDate, setRenewalDate] = useState(existing?.renewalDate ?? '');
  const [reminderDaysBefore, setReminderDaysBefore] = useState((existing?.reminderDaysBefore ?? DEFAULT_REMINDER_DAYS).join(', '));
  const [linkedVehicleId, setLinkedVehicleId] = useState(existing?.linkedVehicleId ?? '');
  const [tags, setTags] = useState(existing?.tags.join(', ') ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [favorite, setFavorite] = useState(existing?.favorite ?? false);
  const [sensitive, setSensitive] = useState(existing?.sensitive ?? SENSITIVE_DEFAULT_TYPES.includes(type));
  const [frontImageUri, setFrontImageUri] = useState(existing?.frontImageUri);
  const [backImageUri, setBackImageUri] = useState(existing?.backImageUri);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const draft = useMemo(
    () => ({
      id: existing?.id,
      title,
      type,
      categoryLabel,
      ownerName,
      issuer,
      memberNumber,
      documentNumberSensitive,
      issueDate: issueDate.trim() || undefined,
      expirationDate: expirationDate.trim() || undefined,
      renewalDate: renewalDate.trim() || undefined,
      reminderDaysBefore: parseReminderDays(reminderDaysBefore),
      linkedVehicleId: linkedVehicleId || undefined,
      tags: sanitizeTags(tags),
      notes,
      favorite,
      sensitive,
      frontImageUri,
      backImageUri,
      archived: existing?.archived ?? false,
    }),
    [
      backImageUri,
      categoryLabel,
      documentNumberSensitive,
      existing,
      expirationDate,
      favorite,
      frontImageUri,
      issueDate,
      issuer,
      linkedVehicleId,
      memberNumber,
      notes,
      ownerName,
      reminderDaysBefore,
      renewalDate,
      sensitive,
      tags,
      title,
      type,
    ],
  );

  const chooseImage = async (side: 'front' | 'back') => {
    try {
      const uri = await pickImage();
      if (side === 'front') {
        setFrontImageUri(uri);
      } else {
        setBackImageUri(uri);
      }
    } catch (error) {
      Alert.alert('Image not selected', error instanceof Error ? error.message : 'The image picker could not open.');
    }
  };

  const save = async () => {
    const validation = validateVaultItem(draft);
    setErrors(validation.errors);
    if (!validation.valid) {
      return;
    }
    setSaving(true);
    try {
      const saved = await saveItem(draft);
      Alert.alert('Saved to your vault.', 'Your item was saved locally on this device.');
      navigation.replace('ItemDetail', {itemId: saved.id});
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'The item could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const updateType = (nextType: VaultItemType) => {
    setType(nextType);
    setCategoryLabel(ITEM_TYPE_LABELS[nextType]);
    setSensitive(SENSITIVE_DEFAULT_TYPES.includes(nextType));
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>{existing ? 'Edit vault item' : 'Add vault item'}</Text>
        <Text style={styles.subtitle}>Use this for personal reference details only. Do not store payment card credentials.</Text>
      </Card>
      <FormField label="Title" value={title} onChangeText={setTitle} error={errors.title} placeholder="Auto insurance card" maxLength={80} />
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.chips}>
          {ITEM_TYPES.map(itemType => (
            <Chip key={itemType} label={ITEM_TYPE_LABELS[itemType]} selected={type === itemType} onPress={() => updateType(itemType)} />
          ))}
        </View>
        {errors.type ? <Text style={styles.error}>{errors.type}</Text> : null}
      </View>
      <FormField label="Category" value={categoryLabel} onChangeText={setCategoryLabel} placeholder="Vehicle documents" />
      <FormField label="Owner name" value={ownerName} onChangeText={setOwnerName} placeholder="Optional" />
      <FormField label="Issuer" value={issuer} onChangeText={setIssuer} placeholder="Issuer or provider" />
      <FormField label="Member number" value={memberNumber} onChangeText={setMemberNumber} error={errors.memberNumber} maxLength={80} placeholder="Reference number" />
      <FormField
        label="Sensitive document number"
        value={documentNumberSensitive}
        onChangeText={setDocumentNumberSensitive}
        error={errors.documentNumberSensitive}
        maxLength={120}
        placeholder="Hidden by default in details"
      />
      <View style={styles.dateRow}>
        <FormField label="Issue date" value={issueDate} onChangeText={setIssueDate} error={errors.issueDate} placeholder="YYYY-MM-DD" />
        <FormField label="Expiration date" value={expirationDate} onChangeText={setExpirationDate} error={errors.expirationDate} placeholder="YYYY-MM-DD" />
      </View>
      <FormField label="Renewal date" value={renewalDate} onChangeText={setRenewalDate} error={errors.renewalDate} placeholder="YYYY-MM-DD" />
      <FormField
        label="Reminder days before"
        value={reminderDaysBefore}
        onChangeText={setReminderDaysBefore}
        error={errors.reminderDaysBefore}
        placeholder="30, 14, 7, 1"
      />
      <FormField label="Linked vehicle ID" value={linkedVehicleId} onChangeText={setLinkedVehicleId} placeholder="Optional internal reference" />
      <FormField label="Tags" value={tags} onChangeText={setTags} error={errors.tags} placeholder="car, renewal, glovebox" />
      <FormField label="Notes" value={notes} onChangeText={setNotes} error={errors.notes} multiline maxLength={1500} placeholder="Private notes" />
      <Card>
        <Text style={styles.label}>Images</Text>
        <Text style={styles.help}>Images are copied into Android private app storage. Camera capture is not included in version 1.</Text>
        <View style={styles.imageRow}>
          <Pressable style={styles.imageBox} onPress={() => chooseImage('front')}>
            {frontImageUri ? <Image source={{uri: frontImageUri}} style={styles.image} /> : <Text style={styles.imageText}>Choose front image</Text>}
          </Pressable>
          <Pressable style={styles.imageBox} onPress={() => chooseImage('back')}>
            {backImageUri ? <Image source={{uri: backImageUri}} style={styles.image} /> : <Text style={styles.imageText}>Choose back image</Text>}
          </Pressable>
        </View>
      </Card>
      <Card>
        <Pressable style={styles.toggleRow} onPress={() => setFavorite(value => !value)}>
          <Text style={styles.toggleLabel}>Favorite</Text>
          <Text style={styles.toggleValue}>{favorite ? 'On' : 'Off'}</Text>
        </Pressable>
        <Pressable style={styles.toggleRow} onPress={() => setSensitive(value => !value)}>
          <Text style={styles.toggleLabel}>Sensitive item</Text>
          <Text style={styles.toggleValue}>{sensitive ? 'On' : 'Off'}</Text>
        </Pressable>
      </Card>
      <Button label="Save to vault" loading={saving} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.slate,
    marginTop: 6,
    lineHeight: 21,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: colors.navy,
    fontWeight: '900',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  dateRow: {
    gap: 12,
  },
  help: {
    color: colors.slate,
    marginTop: 6,
    lineHeight: 20,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  imageBox: {
    flex: 1,
    aspectRatio: 1.55,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageText: {
    color: colors.teal,
    fontWeight: '800',
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    color: colors.navy,
    fontWeight: '800',
  },
  toggleValue: {
    color: colors.teal,
    fontWeight: '900',
  },
});
