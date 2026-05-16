import {NativeModules} from 'react-native';

export const PocketVaultStorageModule = NativeModules.PocketVaultStorageModule as
  | {
      getVaultData(): Promise<string>;
      saveVaultData(json: string): Promise<boolean>;
      clearVaultData(): Promise<boolean>;
    }
  | undefined;

export const PocketVaultPythonModule = NativeModules.PocketVaultPythonModule as
  | {
      analyzeVault(json: string): Promise<string>;
    }
  | undefined;

export const PocketVaultSecurityModule = NativeModules.PocketVaultSecurityModule as
  | {
      isDeviceLockAvailable(): Promise<boolean>;
      authenticate(title: string, description: string): Promise<{success: boolean; unavailable?: boolean; error?: string}>;
    }
  | undefined;

export const PocketVaultFileModule = NativeModules.PocketVaultFileModule as
  | {
      writePrivateExport(fileName: string, content: string): Promise<string>;
      createDocument(fileName: string, mimeType: string, content: string): Promise<string>;
      openDocument(mimeType: string): Promise<string>;
      pickImage(): Promise<string>;
      copyText(text: string): Promise<boolean>;
    }
  | undefined;

export const PocketVaultNotificationModule = NativeModules.PocketVaultNotificationModule as
  | {
      canPostNotifications(): Promise<boolean>;
      scheduleNotification(id: string, title: string, message: string, timestampMillis: number): Promise<boolean>;
      cancelNotification(id: string): Promise<boolean>;
      cancelAllNotifications(): Promise<boolean>;
    }
  | undefined;
