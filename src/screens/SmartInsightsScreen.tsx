import React, {useEffect, useState} from 'react';
import {RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {EmptyState} from '../components/EmptyState';
import {useVault} from '../context/VaultContext';
import {callPythonInsights} from '../services/pythonInsightService';
import {colors} from '../theme';
import {InsightResult} from '../types';

export function SmartInsightsScreen() {
  const navigation = useNavigation<any>();
  const {data} = useVault();
  const [result, setResult] = useState<InsightResult | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setResult(await callPythonInsights(data));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [data]);

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Card style={styles.header}>
        <Text style={styles.headerTitle}>Smart local insights</Text>
        <Text style={styles.headerText}>
          Powered by the local Python engine inside the Android app. No backend, no remote AI, no internet.
        </Text>
      </Card>
      {result?.error ? (
        <Card style={styles.warning}><Text style={styles.warningText}>{result.error}</Text></Card>
      ) : null}
      <Card>
        <Text style={styles.title}>Vault organization score</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.score}>{result?.vaultHealth.score ?? '--'}</Text>
          <View style={styles.scoreBody}>
            <Text style={styles.scoreLabel}>{result?.vaultHealth.label ?? 'Calculating'}</Text>
            <Text style={styles.body}>{result?.vaultHealth.explanation ?? 'Running local analysis...'}</Text>
            <Text style={styles.source}>Source: {result?.source === 'python' ? 'On-device Python' : 'Local fallback'}</Text>
          </View>
        </View>
      </Card>
      {!result || result.insights.length <= 1 ? (
        <EmptyState
          title="Add more vault details"
          message="Add a few items and carry modes to unlock smarter local insights."
          actionLabel="Add item"
          onAction={() => navigation.navigate('AddEditItem')}
        />
      ) : (
        result.insights.map(insight => (
          <Card key={insight.id} style={insight.severity === 'high' ? styles.highCard : undefined}>
            <Text style={styles.insightType}>{insight.severity.toUpperCase()}</Text>
            <Text style={styles.title}>{insight.title}</Text>
            <Text style={styles.body}>{insight.message}</Text>
            <Text style={styles.explain}>{insight.explanation}</Text>
            {insight.itemIds[0] ? (
              <Button label="Open related item" variant="secondary" onPress={() => navigation.navigate('ItemDetail', {itemId: insight.itemIds[0]})} />
            ) : null}
          </Card>
        ))
      )}
      <Button label="Refresh insights" loading={loading} onPress={load} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    backgroundColor: colors.navy,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 25,
    fontWeight: '900',
  },
  headerText: {
    color: colors.mist,
    marginTop: 8,
    lineHeight: 22,
  },
  title: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '900',
  },
  body: {
    color: colors.slate,
    marginTop: 8,
    lineHeight: 22,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  score: {
    color: colors.teal,
    fontSize: 48,
    fontWeight: '900',
  },
  scoreBody: {
    flex: 1,
  },
  scoreLabel: {
    color: colors.navy,
    fontWeight: '900',
    fontSize: 16,
  },
  source: {
    color: colors.teal,
    fontWeight: '800',
    marginTop: 8,
  },
  warning: {
    backgroundColor: colors.warningSoft,
  },
  warningText: {
    color: colors.warning,
    fontWeight: '800',
  },
  highCard: {
    borderColor: colors.danger,
  },
  insightType: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
  },
  explain: {
    color: colors.navy,
    fontWeight: '700',
    marginTop: 10,
    lineHeight: 21,
  },
});
