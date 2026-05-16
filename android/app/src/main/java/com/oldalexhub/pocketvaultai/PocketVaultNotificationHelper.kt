package com.oldalexhub.pocketvaultai

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject

object PocketVaultNotificationHelper {
  const val CHANNEL_ID = "pocketvaultai_reminders"
  private const val PREFS = "pocketvault_notification_store"
  private const val KEY_SCHEDULES = "schedules"

  fun createChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      val channel = NotificationChannel(
        CHANNEL_ID,
        "PocketVault AI reminders",
        NotificationManager.IMPORTANCE_DEFAULT,
      )
      channel.description = "Local renewal, expiration, and carry check reminders."
      manager.createNotificationChannel(channel)
    }
  }

  fun schedule(context: Context, id: String, title: String, message: String, timestampMillis: Long) {
    createChannel(context)
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pendingIntent = pendingIntent(context, id, title, message)
    alarmManager.set(AlarmManager.RTC_WAKEUP, timestampMillis, pendingIntent)
    saveSchedule(context, id, title, message, timestampMillis)
  }

  fun cancel(context: Context, id: String) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val intent = Intent(context, PocketVaultNotificationReceiver::class.java)
    val pending = PendingIntent.getBroadcast(context, id.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    alarmManager.cancel(pending)
    removeSchedule(context, id)
  }

  fun cancelAll(context: Context) {
    val schedules = readSchedules(context)
    schedules.forEach { cancel(context, it.optString("id")) }
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY_SCHEDULES).apply()
  }

  fun reschedulePersisted(context: Context) {
    val now = System.currentTimeMillis()
    readSchedules(context).forEach { schedule ->
      val timestamp = schedule.optLong("timestampMillis")
      if (timestamp > now) {
        schedule(context, schedule.optString("id"), schedule.optString("title"), schedule.optString("message"), timestamp)
      }
    }
  }

  private fun pendingIntent(context: Context, id: String, title: String, message: String): PendingIntent {
    val intent = Intent(context, PocketVaultNotificationReceiver::class.java).apply {
      putExtra("id", id)
      putExtra("title", title)
      putExtra("message", message)
    }
    return PendingIntent.getBroadcast(context, id.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun readSchedules(context: Context): MutableList<JSONObject> {
    val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_SCHEDULES, "[]") ?: "[]"
    val array = JSONArray(raw)
    return MutableList(array.length()) { index -> array.getJSONObject(index) }
  }

  private fun saveSchedule(context: Context, id: String, title: String, message: String, timestampMillis: Long) {
    val schedules = readSchedules(context).filter { it.optString("id") != id }.toMutableList()
    schedules.add(JSONObject().apply {
      put("id", id)
      put("title", title)
      put("message", message)
      put("timestampMillis", timestampMillis)
    })
    writeSchedules(context, schedules)
  }

  private fun removeSchedule(context: Context, id: String) {
    writeSchedules(context, readSchedules(context).filter { it.optString("id") != id })
  }

  private fun writeSchedules(context: Context, schedules: List<JSONObject>) {
    val array = JSONArray()
    schedules.forEach { array.put(it) }
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_SCHEDULES, array.toString()).apply()
  }
}
