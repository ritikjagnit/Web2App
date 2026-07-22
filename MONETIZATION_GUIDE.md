# AppOrbit AdMob Monetization System Guide

This guide describes how to configure and monetize your generated Android apps using the Google AdMob integration in AppOrbit.

---

## 1. How to Obtain Google AdMob IDs

To configure monetization, you must register your app in your personal Google AdMob Console.

### Step 1.1: Find Your AdMob App ID
1. Log in to the [Google AdMob Console](https://apps.admob.com/).
2. Navigate to **Apps** > **Add App** and follow the prompts to register your Android application.
3. Once registered, go to **App Settings**.
4. Copy the **App ID**. It will match this format:
   `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX` (with a tilde `~`).

### Step 1.2: Create Ad Unit IDs
Create the ad placements you want to display in your mobile app:
1. Inside your App dashboard in AdMob, navigate to **Ad units** > **Add ad unit**.
2. Create your desired placements:
   * **Banner:** Shown at the bottom of the layout (`ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`).
   * **Interstitial:** Full-screen ad loaded after a short initial delay (`ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`).
   * **Rewarded:** Full-screen reward ad (optional).
   * **Native:** Advanced custom-rendered format (optional).
   * **App Open:** Shown when the app launches (optional).
3. Copy the individual **Ad Unit IDs** (which feature a forward slash `/`).

---

## 2. Where to Paste AdMob IDs in AppOrbit

1. Open the AppOrbit **Website to App Converter**.
2. Scroll to the **Monetization Settings** section.
3. Select **Use My AdMob Account**.
4. Paste your **App ID** and **Ad Unit IDs** into the respective fields.
   * *Note: The system validates these inputs using strict format rules to prevent build crashes.*
5. Click **Generate App Package** to compile your APK/AAB with ads pre-injected.

---

## 3. How AppOrbit Injects Ads During Compilation

During the compilation process, AppOrbit automatically builds the Mobile Ads SDK directly into your application bundle:
1. **Manifest Configuration:** Injects the Google Application ID metadata tag directly inside `AndroidManifest.xml`.
2. **Gradle Dependencies:** Configures Gradle to pull `com.google.android.gms:play-services-ads` automatically.
3. **Initialization:** Spawns a singleton `AdManager` on app launch, linking it to the `AdMobProvider` interface class.
4. **Layout Integration:** Wraps the WebView in a vertical coordinator, instantiating the Banner Ad container at the bottom.

---

## 4. Common Troubleshooting

### "My ads are not displaying"
* **Check ID Formats:** Ensure your App ID contains a `~` (tilde) and your Ad Unit IDs contain a `/` (forward slash).
* **AdMob Account Status:** New accounts or new ad units require up to 24-48 hours to serve live ads.
* **Payment/Verification:** Ensure your AdMob account billing and PIN verification are fully completed.
* **Test Ad IDs:** During development or staging, we recommend using Google's official test ad units to verify logic.

### "My app crashes on start"
* If you did not supply a valid App ID, Google AdMob SDK throws a runtime exception. AppOrbit validates ID patterns during build configuration to prevent this.
