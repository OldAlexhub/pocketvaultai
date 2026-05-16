package com.oldalexhub.pocketvaultai

import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.webkit.MimeTypeMap
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.util.UUID

class PocketVaultFileModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  private var pendingPromise: Promise? = null
  private var pendingContent: String? = null
  private var pendingMimeType: String? = null

  private val listener: ActivityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      val promise = pendingPromise ?: return
      if (resultCode != Activity.RESULT_OK) {
        clearPending()
        promise.reject("POCKETVAULT_CANCELLED", "The action was cancelled.")
        return
      }
      try {
        when (requestCode) {
          REQUEST_CREATE_DOCUMENT -> {
            val uri = data?.data ?: throw IllegalStateException("No document destination was selected.")
            reactContext.contentResolver.openOutputStream(uri)?.use { stream ->
              stream.write((pendingContent ?: "").toByteArray(Charsets.UTF_8))
            } ?: throw IllegalStateException("Could not open the selected document.")
            clearPending()
            promise.resolve(uri.toString())
          }
          REQUEST_OPEN_DOCUMENT -> {
            val uri = data?.data ?: throw IllegalStateException("No document was selected.")
            val text = reactContext.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
              ?: throw IllegalStateException("Could not read the selected document.")
            clearPending()
            promise.resolve(text)
          }
          REQUEST_PICK_IMAGE -> {
            val uri = data?.data ?: throw IllegalStateException("No image was selected.")
            val copied = copyImageToPrivateStorage(uri)
            clearPending()
            promise.resolve(copied)
          }
          else -> {
            clearPending()
            promise.reject("POCKETVAULT_UNKNOWN_REQUEST", "Unknown file request.")
          }
        }
      } catch (ex: Exception) {
        clearPending()
        promise.reject("POCKETVAULT_FILE_FAILED", ex.message ?: "File action failed.", ex)
      }
    }
  }

  init {
    reactContext.addActivityEventListener(listener)
  }

  override fun getName(): String = "PocketVaultFileModule"

  @ReactMethod
  fun writePrivateExport(fileName: String, content: String, promise: Promise) {
    try {
      val safeName = sanitizeFileName(fileName)
      val dir = File(reactContext.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS), "PocketVaultAI")
      if (!dir.exists()) {
        dir.mkdirs()
      }
      val file = File(dir, safeName)
      file.writeText(content, Charsets.UTF_8)
      promise.resolve(file.absolutePath)
    } catch (ex: Exception) {
      promise.reject("POCKETVAULT_PRIVATE_EXPORT_FAILED", "Private export could not be written.", ex)
    }
  }

  @ReactMethod
  fun createDocument(fileName: String, mimeType: String, content: String, promise: Promise) {
    try {
      val activity = getCurrentActivity() ?: throw IllegalStateException("No active Android activity.")
      if (pendingPromise != null) {
        promise.reject("POCKETVAULT_FILE_BUSY", "Another file action is active.")
        return
      }
      pendingPromise = promise
      pendingContent = content
      pendingMimeType = mimeType
      val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = mimeType
        putExtra(Intent.EXTRA_TITLE, sanitizeFileName(fileName))
      }
      activity.startActivityForResult(intent, REQUEST_CREATE_DOCUMENT)
    } catch (ex: Exception) {
      clearPending()
      promise.reject("POCKETVAULT_CREATE_DOCUMENT_FAILED", "Document export could not start.", ex)
    }
  }

  @ReactMethod
  fun openDocument(mimeType: String, promise: Promise) {
    try {
      val activity = getCurrentActivity() ?: throw IllegalStateException("No active Android activity.")
      if (pendingPromise != null) {
        promise.reject("POCKETVAULT_FILE_BUSY", "Another file action is active.")
        return
      }
      pendingPromise = promise
      val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = mimeType.ifBlank { "application/json" }
      }
      activity.startActivityForResult(intent, REQUEST_OPEN_DOCUMENT)
    } catch (ex: Exception) {
      clearPending()
      promise.reject("POCKETVAULT_OPEN_DOCUMENT_FAILED", "Document import could not start.", ex)
    }
  }

  @ReactMethod
  fun pickImage(promise: Promise) {
    try {
      val activity = getCurrentActivity() ?: throw IllegalStateException("No active Android activity.")
      if (pendingPromise != null) {
        promise.reject("POCKETVAULT_FILE_BUSY", "Another file action is active.")
        return
      }
      pendingPromise = promise
      val intent = if (Build.VERSION.SDK_INT >= 33) {
        Intent(MediaStore.ACTION_PICK_IMAGES).apply { type = "image/*" }
      } else {
        Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
          addCategory(Intent.CATEGORY_OPENABLE)
          type = "image/*"
        }
      }
      activity.startActivityForResult(intent, REQUEST_PICK_IMAGE)
    } catch (ex: Exception) {
      clearPending()
      promise.reject("POCKETVAULT_IMAGE_PICK_FAILED", "Image picker could not start.", ex)
    }
  }

  @ReactMethod
  fun copyText(text: String, promise: Promise) {
    val clipboard = reactContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    clipboard.setPrimaryClip(ClipData.newPlainText("PocketVault AI", text))
    promise.resolve(true)
  }

  private fun copyImageToPrivateStorage(uri: Uri): String {
    val resolver = reactContext.contentResolver
    val extension = extensionForUri(resolver, uri)
    val dir = File(reactContext.filesDir, "vault_images")
    if (!dir.exists()) {
      dir.mkdirs()
    }
    val outFile = File(dir, "${UUID.randomUUID()}.$extension")
    resolver.openInputStream(uri)?.use { input ->
      outFile.outputStream().use { output -> input.copyTo(output) }
    } ?: throw IllegalStateException("Could not copy image.")
    return Uri.fromFile(outFile).toString()
  }

  private fun extensionForUri(resolver: ContentResolver, uri: Uri): String {
    val type = resolver.getType(uri) ?: return "jpg"
    return MimeTypeMap.getSingleton().getExtensionFromMimeType(type) ?: "jpg"
  }

  private fun sanitizeFileName(fileName: String): String =
    fileName.replace(Regex("[^A-Za-z0-9._-]+"), "-").trim('-').ifBlank { "PocketVaultAI-export.txt" }

  private fun clearPending() {
    pendingPromise = null
    pendingContent = null
    pendingMimeType = null
  }

  companion object {
    private const val REQUEST_CREATE_DOCUMENT = 7201
    private const val REQUEST_OPEN_DOCUMENT = 7202
    private const val REQUEST_PICK_IMAGE = 7203
  }
}
