import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {ITEM_TYPE_LABELS, TYPE_BADGES} from '../constants';
import {colors} from '../theme';
import {VaultItem} from '../types';
import {expirationLabel, reminderPriority} from '../utils/vault';
import {Card} from './Card';

export function VaultItemCard({
  item,
  onPress,
  onFavorite,
  onArchive,
}: {
  item: VaultItem;
  onPress: () => void;
  onFavorite?: () => void;
  onArchive?: () => void;
}) {
  const priority = reminderPriority(item);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${item.title}`}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{TYPE_BADGES[item.type]}</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.meta}>{ITEM_TYPE_LABELS[item.type]} · {item.categoryLabel}</Text>
            <Text style={[styles.status, priority === 'high' ? styles.high : null]}>
              {expirationLabel(item)}
            </Text>
            <View style={styles.flags}>
              {item.sensitive ? <Text style={styles.flag}>Sensitive</Text> : null}
              {item.favorite ? <Text style={styles.flagGold}>Favorite</Text> : null}
              {item.archived ? <Text style={styles.flag}>Archived</Text> : null}
            </View>
          </View>
        </View>
        {(onFavorite || onArchive) ? (
          <View style={styles.actions}>
            {onFavorite ? (
              <Pressable onPress={onFavorite} style={styles.actionButton}>
                <Text style={styles.actionText}>{item.favorite ? 'Unfavorite' : 'Favorite'}</Text>
              </Pressable>
            ) : null}
            {onArchive ? (
              <Pressable onPress={onArchive} style={styles.actionButton}>
                <Text style={styles.actionText}>{item.archived ? 'Unarchive' : 'Archive'}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.navy,
    fontWeight: '900',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    color: colors.slate,
    fontSize: 13,
  },
  status: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 13,
  },
  high: {
    color: colors.danger,
  },
  flags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  flag: {
    backgroundColor: colors.background,
    color: colors.slate,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '800',
  },
  flagGold: {
    backgroundColor: colors.goldSoft,
    color: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '800',
  },
});
