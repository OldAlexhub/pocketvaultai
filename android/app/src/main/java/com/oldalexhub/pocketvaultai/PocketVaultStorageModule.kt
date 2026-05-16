package com.oldalexhub.pocketvaultai

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class PocketVaultStorageModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  private val prefs = reactContext.getSharedPreferences("pocketvault_secure_store", Context.MODE_PRIVATE)

  override fun getName(): String = "PocketVaultStorageModule"

  @ReactMethod
  fun getVaultData(promise: Promise) {
    try {
      val cipherText = prefs.getString("vault_cipher", null)
      val ivText = prefs.getString("vault_iv", null)
      if (cipherText.isNullOrBlank() || ivText.isNullOrBlank()) {
        promise.resolve("")
        return
      }
      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), GCMParameterSpec(128, Base64.decode(ivText, Base64.NO_WRAP)))
      val plain = cipher.doFinal(Base64.decode(cipherText, Base64.NO_WRAP)).toString(Charsets.UTF_8)
      promise.resolve(plain)
    } catch (ex: Exception) {
      promise.reject("POCKETVAULT_DECRYPT_FAILED", "Vault data could not be decrypted.", ex)
    }
  }

  @ReactMethod
  fun saveVaultData(json: String, promise: Promise) {
    try {
      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
      val encrypted = cipher.doFinal(json.toByteArray(Charsets.UTF_8))
      prefs.edit()
        .putString("vault_cipher", Base64.encodeToString(encrypted, Base64.NO_WRAP))
        .putString("vault_iv", Base64.encodeToString(cipher.iv, Base64.NO_WRAP))
        .apply()
      promise.resolve(true)
    } catch (ex: Exception) {
      promise.reject("POCKETVAULT_ENCRYPT_FAILED", "Vault data could not be saved.", ex)
    }
  }

  @ReactMethod
  fun clearVaultData(promise: Promise) {
    prefs.edit().clear().apply()
    promise.resolve(true)
  }

  private fun getOrCreateKey(): SecretKey {
    val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    val existing = keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.SecretKeyEntry
    if (existing != null) {
      return existing.secretKey
    }
    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
    val spec = KeyGenParameterSpec.Builder(
      KEY_ALIAS,
      KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
    )
      .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
      .setRandomizedEncryptionRequired(true)
      .build()
    generator.init(spec)
    return generator.generateKey()
  }

  companion object {
    private const val KEY_ALIAS = "PocketVaultAI.LocalVaultKey"
  }
}
