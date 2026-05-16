import {PocketVaultSecurityModule} from './nativeModules';

export async function isDeviceLockAvailable(): Promise<boolean> {
  if (!PocketVaultSecurityModule) {
    return false;
  }
  try {
    return await PocketVaultSecurityModule.isDeviceLockAvailable();
  } catch (error) {
    if (__DEV__) {
      console.warn('Device lock availability check failed', error);
    }
    return false;
  }
}

export async function authenticateForAppLock(
  title: string,
  description: string,
): Promise<{success: boolean; unavailable?: boolean; error?: string}> {
  if (!PocketVaultSecurityModule) {
    return {success: false, unavailable: true, error: 'Device authentication is unavailable.'};
  }
  try {
    const raw = await PocketVaultSecurityModule.authenticate(title, description);
    if (typeof raw === 'string') {
      return JSON.parse(raw);
    }
    return raw;
  } catch (error) {
    if (__DEV__) {
      console.warn('App lock authentication failed', error);
    }
    return {success: false, error: 'Authentication did not complete.'};
  }
}
