import React, {useEffect, useState} from 'react';
import {Alert, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {EmptyState} from '../components/EmptyState';
import {Screen} from '../components/Screen';
import {DISCLAIMER, ITEM_TYPE_LABELS, TYPE_BADGES} from '../constants';
import {useVault} from '../context/VaultContext';
import {authenticateForAppLock} from '../services/appLockService';
import {copyText, createDocument, writePrivateExport} from '../services/fileService';
import {generateSafeSummary} from '../services/exportService';
import {colors} from '../theme';
import {formatDate} from '../utils/date';
import {expirationLabel} from '../utils/vault';

export function ItemDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const {data, deleteItem, archiveItem, toggleFavorite, markItemUsed, addUsageEvent, saveItem} = useVault();
  const item = data.items.find(value => value.id === route.params?.itemId);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (item) {
      saveItem({...item, lastViewedAt: new Date().toISOString()}).catch(() => undefined);
    }
  }, []);

  if (!item) {
    return (
      <Screen>
        <EmptyState title="Item not found" message="This vault item may have been deleted." actionLabel="Back to vault" onAction={() => navigation.navigate('Vault')} />
      </Screen>
    );
  }

  const reveal = async () => {
    if (data.settings.appLockEnabled) {
      const result = await authenticateForAppLock('Reveal sensitive field', 'Confirm your device screen lock to show this value.');
      if (!result.success) {
        return;
      }
    }
    setRevealed(true);
  };

  const exportItemSummary = async () => {
    const summary = generateSafeSummary({...data, items: [item]});
    try {
      const fileName = `PocketVaultAI-${item.title.replace(/[^a-z0-9]+/gi, '-')}.txt`;
      const path = await writePrivateExport(fileName, summary);
      await createDocument(fileName, 'text/plain', summary).catch(() => path);
      await addUsageEvent({itemId: item.id, eventType: 'exported'});
      Alert.alert('Export created', `Saved a personal reference summary.\n${path}`);
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'The summary could not be exported.');
    }
  };

  const copyNonSensitive = async () => {
    const text = [
      item.title,
      `Type: ${ITEM_TYPE_LABELS[item.type]}`,
      `Category: ${item.categoryLabel}`,
      `Issuer: ${item.issuer || 'Not added'}`,
      `Expiration: ${item.expirationDate || 'Not added'}`,
      DISCLAIMER,
    ].join('\n');
    const copied = await copyText(text);
    Alert.alert(copied ? 'Copied' : 'Copy unavailable', copied ? 'Non-sensitive fields were copied.' : 'Clipboard service was unavailable.');
  };

  const confirmDelete = () => {
    Alert.alert('Delete vault item?', 'This removes the item from this device.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteItem(item.id);
        navigation.navigate('Vault');
      }},
    ]);
  };

  return (
    <Screen>
      <Card style={styles.header}>
        <View style={styles.badge}><Text style={styles.badgeText}>{TYPE_BADGES[item.type]}</Text></View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{ITEM_TYPE_LABELS[item.type]} · {item.categoryLabel}</Text>
          <Text style={styles.status}>{expirationLabel(item)}</Text>
        </View>
      </Card>
      {(item.frontImageUri || item.backImageUri) ? (
        <Card>
          <Text style={styles.sectionTitle}>Images</Text>
          <View style={styles.imageRow}>
            {item.frontImageUri ? <Image source={{uri: item.frontImageUri}} style={styles.image} /> : null}
            {item.backImageUri ? <Image source={{uri: item.backImageUri}} style={styles.image} /> : null}
          </View>
        </Card>
      ) : null}
      <Card>
        <Text style={styles.sectionTitle}>Key details</Text>
        <Detail label="Owner" value={item.ownerName} />
        <Detail label="Issuer" value={item.issuer} />
        <Detail label="Member number" value={item.memberNumber} />
        <Detail label="Issue date" value={formatDate(item.issueDate)} />
        <Detail label="Expiration date" value={formatDate(item.expirationDate)} />
        <Detail label="Renewal date" value={formatDate(item.renewalDate)} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Sensitive number</Text>
          {item.documentNumberSensitive ? (
            revealed ? <Text style={styles.detailValue}>{item.documentNumberSensitive}</Text> : <Button label="Reveal" variant="secondary" onPress={reveal} />
          ) : <Text style={styles.detailValue}>Not added</Text>}
        </View>
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Text style={styles.notes}>{item.notes || 'Not added'}</Text>
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Usage actions</Text>
        <View style={styles.actions}>
          <Button label="Edit" onPress={() => navigation.navigate('AddEditItem', {itemId: item.id})} />
          <Button label="Mark as used" variant="secondary" onPress={() => markItemUsed(item.id)} />
          <Button label={item.favorite ? 'Remove favorite' : 'Favorite'} variant="secondary" onPress={() => toggleFavorite(item.id)} />
          <Button label={item.archived ? 'Unarchive' : 'Archive'} variant="secondary" onPress={() => archiveItem(item.id, !item.archived)} />
          <Button label="Copy non-sensitive fields" variant="secondary" onPress={copyNonSensitive} />
          <Button label="Export text summary" variant="secondary" onPress={exportItemSummary} />
          <Button label="Delete" variant="danger" onPress={confirmDelete} />
        </View>
      </Card>
    </Screen>
  );
}

function Detail({label, value}: {label: string; value?: string}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'Not added'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.navy,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.navy,
    fontWeight: '900',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 22,
  },
  subtitle: {
    color: colors.mist,
  },
  status: {
    color: colors.goldSoft,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  image: {
    flex: 1,
    aspectRatio: 1.55,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    color: colors.slate,
    fontWeight: '800',
    flex: 1,
  },
  detailValue: {
    color: colors.navy,
    flex: 1.3,
    textAlign: 'right',
    fontWeight: '700',
  },
  notes: {
    color: colors.slate,
    lineHeight: 22,
  },
  actions: {
    gap: 10,
  },
});
