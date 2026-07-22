package com.appweaver.template;

import android.app.Activity;
import android.util.Log;
import android.view.ViewGroup;

public class AdManager {
    private static final String TAG = "AdManager";
    private static AdManager instance;
    private AdProvider provider;
    private boolean initialized = false;

    public static synchronized AdManager getInstance() {
        if (instance == null) {
            instance = new AdManager();
        }
        return instance;
    }

    public void setup(Activity activity, String providerName, String appId) {
        Log.d(TAG, "Setting up AdManager with provider: " + providerName);
        if ("admob".equalsIgnoreCase(providerName) || "apporbit".equalsIgnoreCase(providerName)) {
            provider = new AdMobProvider();
        }

        if (provider != null && appId != null && !appId.trim().isEmpty()) {
            provider.initialize(activity, appId, new AdCallback() {
                @Override
                public void onAdLoaded() {
                    initialized = true;
                    Log.d(TAG, "Ad provider initialized successfully");
                }

                @Override
                public void onAdFailed(String error) {
                    Log.e(TAG, "Ad provider initialization failed: " + error);
                }

                @Override
                public void onAdDismissed() {}
            });
        }
    }

    public void loadBanner(Activity activity, String adUnitId, ViewGroup container) {
        if (provider != null && adUnitId != null && !adUnitId.trim().isEmpty()) {
            provider.loadBanner(activity, adUnitId, container);
        } else {
            Log.w(TAG, "Cannot load banner: provider is null or adUnitId is empty");
        }
    }

    public void showInterstitial(Activity activity, String adUnitId) {
        if (provider != null && adUnitId != null && !adUnitId.trim().isEmpty()) {
            provider.showInterstitial(activity, adUnitId, null);
        } else {
            Log.w(TAG, "Cannot show interstitial: provider is null or adUnitId is empty");
        }
    }

    public void showRewarded(Activity activity, String adUnitId, AdCallback callback) {
        if (provider != null && adUnitId != null && !adUnitId.trim().isEmpty()) {
            provider.showRewarded(activity, adUnitId, callback);
        } else {
            Log.w(TAG, "Cannot show rewarded: provider is null or adUnitId is empty");
        }
    }

    public void loadNative(Activity activity, String adUnitId, ViewGroup container) {
        if (provider != null && adUnitId != null && !adUnitId.trim().isEmpty()) {
            provider.loadNative(activity, adUnitId, container);
        }
    }

    public void showAppOpenAd(Activity activity, String adUnitId) {
        if (provider != null && adUnitId != null && !adUnitId.trim().isEmpty()) {
            provider.showAppOpenAd(activity, adUnitId);
        }
    }

    public boolean isInitialized() {
        return initialized;
    }
}
