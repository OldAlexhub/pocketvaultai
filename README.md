# PocketVault AI

PocketVault AI is a private offline vault for cards, IDs, document references, renewal dates, reminders, and daily carry checklists.

Package name: `com.oldalexhub.pocketvaultai`

Developer: Old Alex Hub

Tagline: Your private offline vault for cards, IDs, documents, and renewal reminders.

## What This App Is

PocketVault AI helps users organize personal cards, document reference copies, renewal dates, vehicle documents, memberships, warranty cards, emergency references, and daily carry checklists entirely on their Android device.

PocketVault AI stores personal reference copies only. It does not replace official physical documents, legal IDs, insurance cards, government records, or documents required by authorities.

## Version 1 Features

- Onboarding and required disclaimer acceptance
- Local encrypted vault storage
- Optional app lock using Android device authentication
- Home dashboard with vault organization score
- Vault list with search, filters, favorites, archive, and details
- Add and edit item forms with validation
- Optional front and back image selection through Android Photo Picker or system document picker
- Expiration and renewal reminders
- Daily Carry Check
- Carry Modes for driving, work, gym, medical visits, travel, school or kids, errands, and custom modes
- Smart Insights powered by local Python through Chaquopy
- JSON backup, CSV summary, text summary, import, and merge or replace flow
- Privacy policy and settings screens
- No account, no backend, no internet permission, no ads, no analytics

## Offline First

All data is created, stored, searched, analyzed, imported, and exported locally. The app does not request internet access. The Python insight engine runs inside the Android app and does not call a backend, external LLM, internet API, analytics service, or crash reporting service.

## No Login

PocketVault AI is a single-device local app. It does not include account creation, email registration, OAuth, Google sign-in, Apple sign-in, cloud sync, or remote identity.

## No Backend

The app has no server, no cloud database, no remote AI, and no shared data layer. Local Android storage and local Android system services are used for the selected version 1 scope.

## Local Storage

Structured vault data is saved as one encrypted local JSON blob through a native Android module. The module generates an AES key in the Android Keystore and encrypts the vault data using AES-GCM before saving it to private SharedPreferences.

Selected images are copied into Android private app storage under the app files directory. Export files are written to app-specific Android document storage and can also be saved through Android system document creation when the user chooses.

Sensitive fields are hidden in list and detail previews. Default exports exclude sensitive fields and image files. Sensitive export requires an explicit toggle and app lock confirmation when app lock is enabled.

## Sensitive Data Warning

PocketVault AI can store personal reference information. Users should protect their device, consider enabling app lock, and store exported files safely. Exported files are not encrypted by PocketVault AI.

Do not use this app to store full credit card numbers, debit card numbers, bank account credentials, crypto wallet credentials, payment credentials, or passwords.

## App Lock

App lock uses Android device authentication through the system device credential prompt where available. PocketVault AI does not collect biometric data, store biometric data, or transmit authentication data. App lock can be enabled, disabled, tested, and used before revealing sensitive fields or exporting sensitive data.

## Python AI and Chaquopy

The local insight engine lives at:

`android/app/src/main/python/vault_ai.py`

The native bridge lives in:

`android/app/src/main/java/com/oldalexhub/pocketvaultai/PocketVaultPythonModule.kt`

Chaquopy version used: `17.0.0`

Chaquopy 17.0.0 is used because the current Chaquopy documentation lists it as compatible with Android Gradle Plugin 7.3 through 9.2 and minSdk 24. This project uses minSdk 24 and the React Native Android Gradle setup generated for React Native 0.85.3.

The Python engine uses only the Python standard library. It handles empty data, invalid dates, unknown categories, duplicate names, no carry modes, no expiration dates, missing fields, and errors safely.

## Android Permissions

The app intentionally does not include `android.permission.INTERNET`.

Included permissions:

- `POST_NOTIFICATIONS`: used only for local reminders on Android 13 and higher after the user enables reminders.
- `RECEIVE_BOOT_COMPLETED`: used to reschedule already stored local reminder alarms after device reboot.

The app does not request location, contacts, microphone, SMS, call log, calendar, broad external storage, or manage external storage permissions.

Image selection uses Android Photo Picker on Android 13 and higher or the system document picker on older versions. It does not require broad media permissions.

## Run The App

Install dependencies:

```bash
npm install
```

Start Metro:

```bash
npm start
```

Run Android:

```bash
npm run android
```

## Build Debug

From the Android folder:

```bash
cd android
gradlew.bat assembleDebug
```

On macOS or Linux:

```bash
cd android
./gradlew assembleDebug
```

## Build Release

The preferred release path is the parent `release.py` script:

```bash
cd ..
python release.py
```

The AAB is the main artifact for Google Play production upload. The APK is kept for local testing.

## release.py

`release.py` is located outside the app directory at:

`../release.py`

Supported commands:

```bash
python release.py --check-env
python release.py --generate-key-only
python release.py
python release.py --skip-screenshots
python release.py --screenshots-only
python release.py --skip-build
python release.py --clean
python release.py --no-clean
```

The script:

- Locates the `pocketvaultai` Android project
- Detects Java from `JAVA_HOME` or Android Studio JDK/JBR
- Detects the Android SDK from environment variables, `local.properties`, or common Android Studio SDK locations
- Writes `android/local.properties` with `sdk.dir`
- Sets `ANDROID_HOME` and `ANDROID_SDK_ROOT` for the build process
- Prepares a release keystore and `android/keystore/keystore.properties` when missing
- Builds release APK and AAB
- Copies outputs into `../releases/builds`
- Captures emulator screenshots when requested
- Copies store assets, docs, privacy policy, branding assets, release notes, and signing notes into `../releases`

## Environment Check

If the build fails with "ANDROID_HOME is not set" or "SDK location not found," run:

```bash
python release.py --check-env
```

`release.py` should automatically detect the Android SDK from Android Studio, write `android/local.properties`, and set `ANDROID_HOME` and `ANDROID_SDK_ROOT` for the build process. If detection fails, manually install Android Studio and confirm the SDK exists under the normal Android SDK location.

## JAVA_HOME Troubleshooting

`release.py` first validates `JAVA_HOME`. If it is missing, it searches Android Studio bundled Java or JBR locations, including:

- `C:\Program Files\Android\Android Studio\jbr`
- `C:\Program Files\Android\Android Studio\jre`
- User-local Android Studio paths
- JetBrains Toolbox Android Studio paths when discoverable
- `/Applications/Android Studio.app/Contents/jbr/Contents/Home`
- Common Linux Android Studio paths

If Java cannot be found, install Android Studio or set `JAVA_HOME` to a valid JDK path.

## Android SDK Troubleshooting

`release.py` checks `ANDROID_HOME`, `ANDROID_SDK_ROOT`, existing `android/local.properties`, and common SDK locations. A valid SDK must include `platform-tools`, `platform-tools/adb`, `platforms`, and preferably `build-tools`.

The script writes:

```properties
sdk.dir=C:/Users/YourName/AppData/Local/Android/Sdk
```

Forward slashes are used even on Windows.

## Chaquopy Troubleshooting

If Gradle reports a Chaquopy compatibility issue, verify:

- `minSdkVersion` is at least 24
- Chaquopy Gradle plugin is `17.0.0`
- Android Gradle Plugin is within the Chaquopy supported range
- Python files are under `android/app/src/main/python`
- The app builds for `arm64-v8a` and `x86_64`

## Keystore Backup Warning

The release keystore is generated at:

`android/keystore/pocketvaultai-release.keystore`

Signing values are stored at:

`android/keystore/keystore.properties`

These files are local only and ignored by git. Back up the keystore and properties securely. Losing the release keystore can block future Google Play updates for this package name.

`release.py` copies only safe signing notes into `../releases/signing-info`. It does not copy the keystore or passwords into the release folder.

## Screenshots

Open an Android virtual device and open the app. Then run:

```bash
python release.py
```

The script asks you to open each screen, press Enter to capture, or type `q` to stop. Screenshots are saved into:

`../releases/screenshots`

## Google Play Upload Notes

Ready artifacts:

- `../releases/builds/PocketVaultAI-release.aab`: main Google Play upload artifact
- `../releases/builds/PocketVaultAI-release.apk`: local testing artifact
- `../releases/store-assets`: listing copy, release notes, data safety notes, captions
- `../releases/docs`: README and privacy policy
- `../releases/branding`: logo and launcher icons
- `../releases/signing-info`: safe signing backup notes

Suggested app category: Productivity

Monetization: One-time paid app. No subscriptions, no ads, no account, no cloud fees.
