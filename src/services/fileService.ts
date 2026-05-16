import {PocketVaultFileModule} from './nativeModules';

export async function writePrivateExport(fileName: string, content: string): Promise<string> {
  if (!PocketVaultFileModule) {
    throw new Error('File export is unavailable on this device.');
  }
  return PocketVaultFileModule.writePrivateExport(fileName, content);
}

export async function createDocument(fileName: string, mimeType: string, content: string): Promise<string> {
  if (!PocketVaultFileModule) {
    throw new Error('Document export is unavailable on this device.');
  }
  return PocketVaultFileModule.createDocument(fileName, mimeType, content);
}

export async function openDocument(mimeType = 'application/json'): Promise<string> {
  if (!PocketVaultFileModule) {
    throw new Error('Document import is unavailable on this device.');
  }
  return PocketVaultFileModule.openDocument(mimeType);
}

export async function pickImage(): Promise<string> {
  if (!PocketVaultFileModule) {
    throw new Error('Image selection is unavailable on this device.');
  }
  return PocketVaultFileModule.pickImage();
}

export async function copyText(text: string): Promise<boolean> {
  if (!PocketVaultFileModule) {
    return false;
  }
  return PocketVaultFileModule.copyText(text);
}
