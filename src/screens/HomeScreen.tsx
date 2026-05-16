import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {EmptyState} from '../components/EmptyState';
import {Screen} from '../components/Screen';
import {VaultItemCard} from '../components/VaultItemCard';
import {useVault} from '../context/VaultContext';
import {callPythonInsights} from '../services/pythonInsightService';
import {colors} from '../theme';
import {InsightResult} from '../types';
import {calculateDaysUntil} from '../utils/date';
import {runCarryCheck} from '../utils/vault';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const {data, addUsageEvent} = useVault();
  const [insights, setInsights] = useState<InsightResult | null>(null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const activeItems = data.items.filter(item => !item.archived);

  useEffect(() => {
    let alive = true;
    callPythonInsights(data).then(result => {
      if (alive) {
        setInsights(result);
      }
    });
    return () => {
      alive = false;
    };
  }, [data]);

  const suggestedMode = useMemo(() => {
    const fromInsight = insights?.suggestedCarryModeId
      ? data.carryModes.find(mode => mode.id === insights.suggestedCarryModeId)
      : undefined;
    if (fromInsight) {
      return fromInsight;
    }
    const today = new Date().getDay();
    return data.carryModes.find(mode => mode.activeDays.includes(today)) ?? data.carryModes[0];
  }, [data.carryModes, insights?.suggestedCarryModeId]);

  const carryItems = suggestedMode ? runCarryCheck(activeItems, suggestedMode) : [];
  const expiringSoon = activeItems
    .filter(item => {
      const days = calculateDaysUntil(item.expirationDate);
      return days !== null && days <= 30;
    })
    .slice(0, 3);

  const completeCarryCheck = async () => {
    if (!suggestedMode) {
      return;
    }
    await addUsageEvent({
      carryModeId: suggestedMode.id,
      eventType: 'carry_check_completed',
      metadata: {checkedItemIds: checkedIds},
    });
    setCheckedIds([]);
  };

  if (activeItems.length === 0) {
    return (
      <Screen>
        <Card style={styles.hero}>
          <Text style={styles.greeting}>PocketVault AI</Text>
          <Text style={styles.heroText}>Your private offline vault for cards, IDs, documents, and renewal reminders.</Text>
        </Card>
        <EmptyState
          title="Start your vault"
          message="Start your vault by adding your first card or document reference."
          actionLabel="Add First Item"
          onAction={() => navigation.navigate('AddEditItem')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={styles.hero}>
        <Text style={styles.greeting}>Today in your vault</Text>
        <Text style={styles.heroText}>Keep important cards and document details organized, local, private, and easy to find when needed.</Text>
      </Card>
      <Card>
        <View style={styles.healthRow}>
          <View>
            <Text style={styles.sectionTitle}>Vault organization score</Text>
            <Text style={styles.helpText}>{insights?.vaultHealth.explanation ?? 'Calculating local insights...'}</Text>
          </View>
          <Text style={styles.score}>{insights?.vaultHealth.score ?? '--'}</Text>
        </View>
      </Card>
      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Today&apos;s Carry Check</Text>
          <Button label="Run" variant="secondary" onPress={() => navigation.navigate('CarryModes')} />
        </View>
        <Text style={styles.helpText}>{suggestedMode ? suggestedMode.name : 'No carry mode found'}</Text>
        {carryItems.length === 0 ? (
          <Text style={styles.emptyLine}>This carry mode has no matching saved items yet.</Text>
        ) : (
          carryItems.map(item => {
            const checked = checkedIds.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => setCheckedIds(ids => checked ? ids.filter(id => id !== item.id) : [...ids, item.id])}
                style={styles.checkRow}>
                <View style={[styles.checkBox, checked ? styles.checkBoxOn : null]}><Text style={styles.checkText}>{checked ? 'OK' : ''}</Text></View>
                <Text style={styles.checkLabel}>{item.title}</Text>
              </Pressable>
            );
          })
        )}
        <Button
          label="Mark carry check complete"
          disabled={!suggestedMode}
          onPress={completeCarryCheck}
          variant="secondary"
        />
      </Card>
      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Expiring soon</Text>
          <Pressable onPress={() => navigation.navigate('Reminders')}><Text style={styles.link}>View all</Text></Pressable>
        </View>
        {expiringSoon.length === 0 ? (
          <Text style={styles.emptyLine}>No expiration dates are coming up in the next 30 days.</Text>
        ) : (
          expiringSoon.map(item => (
            <VaultItemCard key={item.id} item={item} onPress={() => navigation.navigate('ItemDetail', {itemId: item.id})} />
          ))
        )}
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actions}>
          <Button label="Add item" onPress={() => navigation.navigate('AddEditItem')} />
          <Button label="Smart insights" variant="secondary" onPress={() => navigation.navigate('SmartInsights')} />
          <Button label="Backup" variant="secondary" onPress={() => navigation.navigate('BackupExport')} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.navy,
  },
  greeting: {
    color: colors.white,
    fontSize: 25,
    fontWeight: '900',
  },
  heroText: {
    color: colors.mist,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  score: {
    color: colors.teal,
    fontSize: 42,
    fontWeight: '900',
  },
  sectionTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '900',
  },
  helpText: {
    color: colors.slate,
    marginTop: 6,
    lineHeight: 21,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  link: {
    color: colors.teal,
    fontWeight: '900',
  },
  emptyLine: {
    color: colors.slate,
    marginVertical: 12,
    lineHeight: 21,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  checkBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: {
    backgroundColor: colors.teal,
  },
  checkText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 10,
  },
  checkLabel: {
    color: colors.navy,
    fontWeight: '700',
    flex: 1,
  },
  actions: {
    gap: 10,
    marginTop: 12,
  },
});
