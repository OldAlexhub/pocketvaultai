import React, {useMemo, useState} from 'react';
import {Alert, StyleSheet, Text, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Button} from '../components/Button';
import {Chip} from '../components/Chip';
import {EmptyState} from '../components/EmptyState';
import {Screen} from '../components/Screen';
import {VaultItemCard} from '../components/VaultItemCard';
import {useVault} from '../context/VaultContext';
import {colors} from '../theme';
import {filterVaultItems, searchVaultItems} from '../utils/vault';

const FILTERS = ['All', 'Favorites', 'Expiring', 'Expired', 'Vehicle', 'Membership', 'Archived'];

export function VaultScreen() {
  const navigation = useNavigation<any>();
  const {data, archiveItem, toggleFavorite, deleteItem} = useVault();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const items = useMemo(() => {
    return filterVaultItems(searchVaultItems(data.items, query), filter);
  }, [data.items, filter, query]);

  const confirmDelete = (id: string) => {
    Alert.alert('Delete vault item?', 'This removes the item from this device.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => deleteItem(id)},
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Vault</Text>
          <Text style={styles.subtitle}>Search, filter, and manage your local references.</Text>
        </View>
        <Button label="Add" onPress={() => navigation.navigate('AddEditItem')} />
      </View>
      <TextInput
        accessibilityLabel="Search vault"
        value={query}
        onChangeText={setQuery}
        placeholder="Search cards, documents, tags, issuers"
        placeholderTextColor={colors.muted}
        style={styles.search}
      />
      <View style={styles.chips}>
        {FILTERS.map(item => (
          <Chip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} />
        ))}
      </View>
      {items.length === 0 ? (
        <EmptyState
          title="No items found"
          message={data.items.length === 0 ? 'No items yet. Add your first card or document reference.' : 'Try another search or filter.'}
          actionLabel="Add item"
          onAction={() => navigation.navigate('AddEditItem')}
        />
      ) : (
        <View style={styles.list}>
          {items.map(item => (
            <VaultItemCard
              key={item.id}
              item={item}
              onPress={() => navigation.navigate('ItemDetail', {itemId: item.id})}
              onFavorite={() => toggleFavorite(item.id)}
              onArchive={() => archiveItem(item.id, !item.archived)}
            />
          ))}
        </View>
      )}
      {filter === 'Archived' && items.length > 0 ? (
        <Button
          label="Delete first archived item"
          variant="danger"
          onPress={() => confirmDelete(items[0].id)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  search: {
    minHeight: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    color: colors.black,
    fontSize: 15,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  list: {
    gap: 12,
  },
});
