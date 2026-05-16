import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {AppState, StatusBar, StyleSheet, Text, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {VaultProvider, useVault} from './src/context/VaultContext';
import {OnboardingScreen} from './src/screens/OnboardingScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {VaultScreen} from './src/screens/VaultScreen';
import {AddEditItemScreen} from './src/screens/AddEditItemScreen';
import {ItemDetailScreen} from './src/screens/ItemDetailScreen';
import {CarryModesScreen} from './src/screens/CarryModesScreen';
import {RemindersScreen} from './src/screens/RemindersScreen';
import {SmartInsightsScreen} from './src/screens/SmartInsightsScreen';
import {BackupExportScreen} from './src/screens/BackupExportScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {PrivacyPolicyScreen} from './src/screens/PrivacyPolicyScreen';
import {AppLockSetupScreen} from './src/screens/AppLockSetupScreen';
import {Button} from './src/components/Button';
import {colors} from './src/theme';
import {authenticateForAppLock, isDeviceLockAvailable} from './src/services/appLockService';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  AddEditItem: {itemId?: string} | undefined;
  ItemDetail: {itemId: string};
  CarryModes: undefined;
  Reminders: undefined;
  SmartInsights: undefined;
  BackupExport: undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  AppLockSetup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Vault: undefined;
  Carry: undefined;
  Insights: undefined;
  SettingsTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{tabBarLabel: 'Home'}} />
      <Tab.Screen name="Vault" component={VaultScreen} options={{tabBarLabel: 'Vault'}} />
      <Tab.Screen name="Carry" component={CarryModesScreen} options={{tabBarLabel: 'Carry'}} />
      <Tab.Screen name="Insights" component={SmartInsightsScreen} options={{tabBarLabel: 'Insights'}} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{tabBarLabel: 'Settings'}} />
    </Tab.Navigator>
  );
}

function LockedView({onUnlock}: {onUnlock: () => Promise<void>}) {
  return (
    <View style={styles.locked}>
      <Text style={styles.lockTitle}>PocketVault AI is locked</Text>
      <Text style={styles.lockBody}>
        Use your device screen lock to open your private reference vault.
      </Text>
      <Button label="Unlock" onPress={onUnlock} />
    </View>
  );
}

function AppNavigator() {
  const {data, updateSettings, loading} = useVault();
  const [locked, setLocked] = useState(false);
  const [lastBackgroundAt, setLastBackgroundAt] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const checkInitialLock = async () => {
      if (!data.settings.appLockEnabled || !data.settings.requireUnlockOnLaunch) {
        setLocked(false);
        return;
      }
      const available = await isDeviceLockAvailable();
      if (alive) {
        setLocked(available);
      }
    };
    checkInitialLock();
    return () => {
      alive = false;
    };
  }, [data.settings.appLockEnabled, data.settings.requireUnlockOnLaunch]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (!data.settings.appLockEnabled) {
        return;
      }
      if (state === 'background' || state === 'inactive') {
        setLastBackgroundAt(Date.now());
      }
      if (state === 'active' && lastBackgroundAt) {
        const elapsedMinutes = (Date.now() - lastBackgroundAt) / 60000;
        if (elapsedMinutes >= data.settings.lockAfterMinutes) {
          setLocked(true);
        }
      }
    });
    return () => sub.remove();
  }, [data.settings.appLockEnabled, data.settings.lockAfterMinutes, lastBackgroundAt]);

  const unlock = useCallback(async () => {
    const result = await authenticateForAppLock(
      'Unlock PocketVault AI',
      'Confirm your device screen lock to continue.',
    );
    if (result.success) {
      setLocked(false);
      if (!data.settings.appLockEnabled) {
        await updateSettings({appLockEnabled: true, requireUnlockOnLaunch: true});
      }
    }
  }, [data.settings.appLockEnabled, updateSettings]);

  const initialRouteName = useMemo(
    () => (data.settings.onboardingCompleted ? 'MainTabs' : 'Onboarding'),
    [data.settings.onboardingCompleted],
  );

  if (loading) {
    return (
      <View style={styles.boot}>
        <Text style={styles.bootTitle}>PocketVault AI</Text>
        <Text style={styles.bootBody}>Opening your local vault...</Text>
      </View>
    );
  }

  if (locked) {
    return <LockedView onUnlock={unlock} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={initialRouteName}
        initialRouteName={initialRouteName}
        screenOptions={{
          headerStyle: {backgroundColor: colors.navy},
          headerTintColor: colors.white,
          headerTitleStyle: {fontWeight: '700'},
          contentStyle: {backgroundColor: colors.background},
        }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{headerShown: false}} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{headerShown: false}} />
        <Stack.Screen name="AddEditItem" component={AddEditItemScreen} options={{title: 'Vault item'}} />
        <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{title: 'Item details'}} />
        <Stack.Screen name="CarryModes" component={CarryModesScreen} options={{title: 'Carry modes'}} />
        <Stack.Screen name="Reminders" component={RemindersScreen} options={{title: 'Reminders'}} />
        <Stack.Screen name="SmartInsights" component={SmartInsightsScreen} options={{title: 'Smart insights'}} />
        <Stack.Screen name="BackupExport" component={BackupExportScreen} options={{title: 'Backup and export'}} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{title: 'Settings'}} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{title: 'Privacy policy'}} />
        <Stack.Screen name="AppLockSetup" component={AppLockSetupScreen} options={{title: 'App lock'}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      <VaultProvider>
        <AppNavigator />
      </VaultProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopColor: colors.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    padding: 28,
  },
  bootTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  bootBody: {
    color: colors.mist,
    marginTop: 8,
    fontSize: 15,
  },
  locked: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    backgroundColor: colors.background,
  },
  lockTitle: {
    color: colors.navy,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
  },
  lockBody: {
    color: colors.slate,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 24,
  },
});

export default App;
