import React, {useState} from 'react';
import {Alert, Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {Screen} from '../components/Screen';
import {useVault} from '../context/VaultContext';
import {authenticateForAppLock} from '../services/appLockService';
import {backupToJson, generateSafeSummary, validateBackup, vaultToCsv} from '../services/exportService';
import {createDocument, openDocument, writePrivateExport} from '../services/fileService';
import {colors} from '../theme';
import {BackupFile} from '../types';

export function BackupExportScreen() {
  const {data, importBackup, updateSettings} = useVault();
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [preview, setPreview] = useState<BackupFile | null>(null);
  const [busy, setBusy] = useState(false);

  const ensureSensitiveAllowed = async () => {
    if (!includeSensitive) {
      return true;
    }
    if (!data.settings.backupWarningAccepted) {
      await updateSettings({backupWarningAccepted: true});
    }
    if (data.settings.appLockEnabled) {
      const result = await authenticateForAppLock('Export sensitive data', 'Confirm your device screen lock to export sensitive fields.');
      return result.success;
    }
    return true;
  };

  const exportFile = async (kind: 'json' | 'csv' | 'txt') => {
    const allowed = await ensureSensitiveAllowed();
    if (!allowed) {
      return;
    }
    if (includeSensitive) {
      Alert.alert('Sensitive export warning', 'This export may contain private personal information. Store it safely.');
    }
    setBusy(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const content =
        kind === 'json' ? backupToJson(data, includeSensitive) :
        kind === 'csv' ? vaultToCsv(data) :
        generateSafeSummary(data);
      const fileName = `PocketVaultAI-${stamp}.${kind}`;
      const mimeType = kind === 'json' ? 'application/json' : kind === 'csv' ? 'text/csv' : 'text/plain';
      const path = await writePrivateExport(fileName, content);
      await createDocument(fileName, mimeType, content).catch(() => path);
      Alert.alert('Export ready', `A local export was created.\n${path}`);
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'The export could not be created.');
    } finally {
      setBusy(false);
    }
  };

  const importFile = async () => {
    setBusy(true);
    try {
      const raw = await openDocument('application/json');
      const validation = validateBackup(raw);
      if (!validation.valid || !validation.backup) {
        Alert.alert('Import failed', validation.message);
        return;
      }
      setPreview(validation.backup);
    } catch (error) {
      Alert.alert('Import failed', error instanceof Error ? error.message : 'The backup could not be opened.');
    } finally {
      setBusy(false);
    }
  };

  const completeImport = async (mode: 'replace' | 'merge') => {
    if (!preview) {
      return;
    }
    await importBackup(preview, mode);
    setPreview(null);
    Alert.alert('Import complete', mode === 'replace' ? 'Your local vault was replaced.' : 'The backup was merged into your local vault.');
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>Backup and export</Text>
        <Text style={styles.body}>
          Exports are created locally. Default exports exclude sensitive fields and image files.
        </Text>
      </Card>
      <Card style={includeSensitive ? styles.warning : undefined}>
        <Pressable style={styles.toggleRow} onPress={() => setIncludeSensitive(value => !value)}>
          <View>
            <Text style={styles.toggleTitle}>Include sensitive fields</Text>
            <Text style={styles.body}>Requires explicit choice. App lock is required when enabled.</Text>
          </View>
          <Text style={styles.toggleValue}>{includeSensitive ? 'On' : 'Off'}</Text>
        </Pressable>
      </Card>
      <Card>
        <Text style={styles.title}>Export options</Text>
        <View style={styles.actions}>
          <Button label="Export JSON backup" loading={busy} onPress={() => exportFile('json')} />
          <Button label="Export CSV summary" loading={busy} variant="secondary" onPress={() => exportFile('csv')} />
          <Button label="Export text summary" loading={busy} variant="secondary" onPress={() => exportFile('txt')} />
        </View>
      </Card>
      <Card>
        <Text style={styles.title}>Import backup</Text>
        <Text style={styles.body}>Import a JSON backup created by PocketVault AI. You can preview counts before replacing or merging.</Text>
        <Button label="Choose JSON backup" loading={busy} variant="secondary" onPress={importFile} />
      </Card>
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>Import preview</Text>
            <Text style={styles.body}>Items: {preview?.items.length ?? 0}</Text>
            <Text style={styles.body}>Carry modes: {preview?.carryModes.length ?? 0}</Text>
            <Text style={styles.body}>Reminders: {preview?.reminders.length ?? 0}</Text>
            <Button label="Merge with current vault" onPress={() => completeImport('merge')} />
            <Button label="Replace current vault" variant="danger" onPress={() => completeImport('replace')} />
            <Button label="Cancel" variant="ghost" onPress={() => setPreview(null)} />
          </View>
        </View>
      </Modal>
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
  warning: {
    backgroundColor: colors.warningSoft,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleTitle: {
    color: colors.navy,
    fontWeight: '900',
    fontSize: 16,
  },
  toggleValue: {
    color: colors.teal,
    fontWeight: '900',
  },
  actions: {
    gap: 10,
    marginTop: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 20,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 18,
    gap: 10,
  },
});
