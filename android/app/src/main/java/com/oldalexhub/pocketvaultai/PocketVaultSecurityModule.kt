package com.oldalexhub.pocketvaultai

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject

class PocketVaultSecurityModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  private var pendingPromise: Promise? = null

  private val listener: ActivityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != REQUEST_AUTH) {
        return
      }
      val promise = pendingPromise ?: return
      pendingPromise = null
      val result = JSONObject()
      result.put("success", resultCode == Activity.RESULT_OK)
      promise.resolve(result.toString())
    }
  }

  init {
    reactContext.addActivityEventListener(listener)
  }

  override fun getName(): String = "PocketVaultSecurityModule"

  @ReactMethod
  fun isDeviceLockAvailable(promise: Promise) {
    val keyguard = reactContext.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
    promise.resolve(keyguard.isDeviceSecure)
  }

  @ReactMethod
  fun authenticate(title: String, description: String, promise: Promise) {
    try {
      val activity = getCurrentActivity()
      val keyguard = reactContext.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
      if (activity == null || !keyguard.isDeviceSecure) {
        val result = JSONObject()
        result.put("success", false)
        result.put("unavailable", true)
        promise.resolve(result.toString())
        return
      }
      if (pendingPromise != null) {
        promise.reject("POCKETVAULT_AUTH_BUSY", "Another authentication request is already active.")
        return
      }
      val intent = keyguard.createConfirmDeviceCredentialIntent(title, description)
      if (intent == null) {
        val result = JSONObject()
        result.put("success", false)
        result.put("unavailable", true)
        promise.resolve(result.toString())
        return
      }
      pendingPromise = promise
      activity.startActivityForResult(intent, REQUEST_AUTH)
    } catch (ex: Exception) {
      pendingPromise = null
      promise.reject("POCKETVAULT_AUTH_FAILED", "Device authentication could not start.", ex)
    }
  }

  companion object {
    private const val REQUEST_AUTH = 7101
  }
}
