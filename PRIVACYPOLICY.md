# PocketVault AI Privacy Policy

Developer: Old Alex Hub

Effective date: To be completed before publication

Contact: To be completed before publication

PocketVault AI is a private offline vault for organizing personal card and document reference copies, renewal dates, reminders, and carry checklists.

## Data Collection

PocketVault AI does not require an account.

PocketVault AI does not use a backend.

PocketVault AI does not collect user data to Old Alex Hub servers.

PocketVault AI does not sell data.

PocketVault AI does not share data with third parties.

PocketVault AI does not use ads or analytics in version 1.

## Local Storage

User-created vault data is stored locally on the device. Structured vault data is encrypted at rest using a key generated in the Android Keystore. Images selected by the user are copied into Android private app storage.

PocketVault AI does not send vault data to Old Alex Hub or any server.

## Internet Usage

PocketVault AI does not request internet access. The app is designed to work offline. The local Python insight engine runs inside the Android app and does not call a backend, external AI service, or internet API.

## Permissions

PocketVault AI uses only limited Android permissions:

- `POST_NOTIFICATIONS`: used only for local renewal, expiration, and daily carry check reminders on Android 13 and higher when the user enables reminders.
- `RECEIVE_BOOT_COMPLETED`: used to reschedule already stored local reminder alarms after device reboot.

PocketVault AI does not request location, contacts, microphone, SMS, call log, calendar, broad external storage, manage external storage, or internet permissions.

Image selection uses Android Photo Picker on Android 13 and higher or the system document picker on older versions. Images are copied into app private storage after the user selects them.

## Optional App Lock

PocketVault AI includes optional app lock using local device authentication where available. Authentication is handled by Android. PocketVault AI does not collect biometric data, store biometric data, transmit biometric data, or store app passwords.

App lock can be used on launch, before revealing sensitive fields, and before exporting sensitive data when enabled.

## Data Export Warning

Users can export JSON backups, CSV summaries, and text summaries. Exported files are created only when the user chooses to export.

Default exports exclude sensitive fields and image files. Users can explicitly choose to include sensitive fields. Exported files are not encrypted by PocketVault AI and are the user's responsibility to protect.

PocketVault AI does not export app lock secrets, encryption keys, or biometric data.

## Data Deletion

Users can delete all local vault data inside Settings by using the clear data option. Deleting the app may also remove app private storage, depending on Android device behavior.

Users should export a backup before deletion if they want to keep a personal copy.

## Children Privacy

PocketVault AI is not designed for children to publish, share, or communicate data. The app has no social features, no public user-generated content, no account system, and no tracking.

## Disclaimer

PocketVault AI stores personal reference copies only. It does not replace official physical documents, legal IDs, insurance cards, government records, or documents required by authorities.
