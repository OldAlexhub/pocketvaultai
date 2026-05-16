# Google Play Data Safety Notes

Recommended answers based on the version 1 implementation:

## Data Collection

Data collected by developer: No.

Reason: PocketVault AI has no backend, no account system, no ads, no analytics, no remote crash reporting, and no internet permission.

## Data Sharing

Data shared with third parties: No.

## Data Processed Locally

User-created cards, document references, notes, dates, carry modes, reminders, images, exports, imports, and local insight inputs are processed on device.

The local Python engine runs inside the Android app through Chaquopy.

## Security Practices

Structured vault data is encrypted at rest using a key generated in the Android Keystore. Images are copied into Android private app storage. Optional app lock uses Android device authentication. Users can delete all local vault data in Settings.

Do not claim bank-level security. State that vault data is stored locally and encrypted at rest using Android Keystore-backed encryption.

## Permissions

- `POST_NOTIFICATIONS`: local reminders only when enabled by the user.
- `RECEIVE_BOOT_COMPLETED`: reschedules local reminder alarms after device reboot.
- Photo Picker or system document picker: used only when the user selects an image or backup file.

No internet permission, location, contacts, microphone, SMS, call log, calendar, broad media, or manage external storage permissions.

## Disclaimer

PocketVault AI stores personal reference copies only. It does not replace official physical documents, legal IDs, insurance cards, government records, or documents required by authorities.
