package com.oldalexhub.pocketvaultai

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class PocketVaultNativePackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(
      PocketVaultStorageModule(reactContext),
      PocketVaultPythonModule(reactContext),
      PocketVaultSecurityModule(reactContext),
      PocketVaultFileModule(reactContext),
      PocketVaultNotificationModule(reactContext),
    )

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
