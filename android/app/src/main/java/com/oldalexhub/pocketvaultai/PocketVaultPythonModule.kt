package com.oldalexhub.pocketvaultai

import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject

class PocketVaultPythonModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "PocketVaultPythonModule"

  @ReactMethod
  fun analyzeVault(json: String, promise: Promise) {
    try {
      if (!Python.isStarted()) {
        Python.start(AndroidPlatform(reactContext))
      }
      val py = Python.getInstance()
      val module = py.getModule("vault_ai")
      val result = module.callAttr("analyze_vault", json).toString()
      promise.resolve(result)
    } catch (ex: Exception) {
      val safe = JSONObject()
      safe.put("ok", false)
      safe.put("source", "python")
      safe.put("error", "Smart insights are temporarily unavailable. Your vault still works offline.")
      promise.resolve(safe.toString())
    }
  }
}
