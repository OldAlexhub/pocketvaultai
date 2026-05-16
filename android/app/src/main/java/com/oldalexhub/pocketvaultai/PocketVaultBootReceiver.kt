package com.oldalexhub.pocketvaultai

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class PocketVaultBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
      PocketVaultNotificationHelper.reschedulePersisted(context)
    }
  }
}
