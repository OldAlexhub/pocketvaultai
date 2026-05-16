package com.oldalexhub.pocketvaultai

import android.Manifest
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PocketVaultNotificationModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "PocketVaultNotificationModule"

  @ReactMethod
  fun canPostNotifications(promise: Promise) {
    val allowed = if (Build.VERSION.SDK_INT >= 33) {
      ContextCompat.checkSelfPermission(reactContext, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
    } else {
      val manager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) manager.areNotificationsEnabled() else true
    }
    promise.resolve(allowed)
  }

  @ReactMethod
  fun scheduleNotification(id: String, title: String, message: String, timestampMillis: Double, promise: Promise) {
    try {
      PocketVaultNotificationHelper.schedule(reactContext, id, title, message, timestampMillis.toLong())
      promise.resolve(true)
    } catch (ex: Exception) {
      promise.reject("POCKETVAULT_SCHEDULE_FAILED", "Reminder could not be scheduled.", ex)
    }
  }

  @ReactMethod
  fun cancelNotification(id: String, promise: Promise) {
    PocketVaultNotificationHelper.cancel(reactContext, id)
    promise.resolve(true)
  }

  @ReactMethod
  fun cancelAllNotifications(promise: Promise) {
    PocketVaultNotificationHelper.cancelAll(reactContext)
    promise.resolve(true)
  }
}
