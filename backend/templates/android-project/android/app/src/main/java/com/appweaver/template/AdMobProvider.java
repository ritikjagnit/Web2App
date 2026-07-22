package com.appweaver.template;

import android.app.Activity;
import android.util.Log;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.initialization.InitializationStatus;
import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.gms.ads.appopen.AppOpenAd;

public class AdMobProvider implements AdProvider {
    private static final String TAG = "AdMobProvider";
    private boolean isInitialized = false;
    private InterstitialAd mInterstitialAd;
    private RewardedAd mRewardedAd;
    private AppOpenAd mAppOpenAd;
    private boolean isAppOpenAdLoading = false;

    @Override
    public void initialize(Activity activity, String appId, final AdCallback callback) {
        try {
            MobileAds.initialize(activity, new OnInitializationCompleteListener() {
                @Override
                public void onInitializationComplete(@NonNull InitializationStatus initializationStatus) {
                    isInitialized = true;
                    Log.d(TAG, "AdMob Initialized successfully");
                    if (callback != null) {
                        callback.onAdLoaded();
                    }
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error during AdMob initialization: " + e.getMessage());
            if (callback != null) {
                callback.onAdFailed(e.getMessage());
            }
        }
    }

    @Override
    public void loadBanner(final Activity activity, final String adUnitId, final ViewGroup container) {
        if (adUnitId == null || adUnitId.trim().isEmpty() || container == null) return;
        
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    AdView adView = new AdView(activity);
                    adView.setAdSize(AdSize.BANNER);
                    adView.setAdUnitId(adUnitId.trim());
                    
                    container.removeAllViews();
                    container.addView(adView);
                    
                    AdRequest adRequest = new AdRequest.Builder().build();
                    adView.loadAd(adRequest);
                    Log.d(TAG, "Banner Ad load requested for Unit ID: " + adUnitId);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to load banner ad: " + e.getMessage());
                }
            }
        });
    }

    @Override
    public void showInterstitial(final Activity activity, final String adUnitId, final AdCallback callback) {
        if (adUnitId == null || adUnitId.trim().isEmpty()) return;

        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                AdRequest adRequest = new AdRequest.Builder().build();
                InterstitialAd.load(activity, adUnitId.trim(), adRequest, new InterstitialAdLoadCallback() {
                    @Override
                    public void onAdLoaded(@NonNull InterstitialAd interstitialAd) {
                        mInterstitialAd = interstitialAd;
                        Log.d(TAG, "Interstitial ad loaded");
                        
                        mInterstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                            @Override
                            public void onAdDismissedFullScreenContent() {
                                Log.d(TAG, "Interstitial ad dismissed");
                                mInterstitialAd = null;
                                if (callback != null) callback.onAdDismissed();
                            }

                            @Override
                            public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                                Log.e(TAG, "Interstitial ad failed to show: " + adError.getMessage());
                                mInterstitialAd = null;
                                if (callback != null) callback.onAdFailed(adError.getMessage());
                            }
                        });
                        
                        mInterstitialAd.show(activity);
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                        Log.e(TAG, "Interstitial ad failed to load: " + loadAdError.getMessage());
                        mInterstitialAd = null;
                        if (callback != null) callback.onAdFailed(loadAdError.getMessage());
                    }
                });
            }
        });
    }

    @Override
    public void showRewarded(final Activity activity, final String adUnitId, final AdCallback callback) {
        if (adUnitId == null || adUnitId.trim().isEmpty()) return;

        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                AdRequest adRequest = new AdRequest.Builder().build();
                RewardedAd.load(activity, adUnitId.trim(), adRequest, new RewardedAdLoadCallback() {
                    @Override
                    public void onAdLoaded(@NonNull RewardedAd rewardedAd) {
                        mRewardedAd = rewardedAd;
                        Log.d(TAG, "Rewarded ad loaded");
                        
                        mRewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                            @Override
                            public void onAdDismissedFullScreenContent() {
                                Log.d(TAG, "Rewarded ad dismissed");
                                mRewardedAd = null;
                                if (callback != null) callback.onAdDismissed();
                            }

                            @Override
                            public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                                Log.e(TAG, "Rewarded ad failed to show: " + adError.getMessage());
                                mRewardedAd = null;
                                if (callback != null) callback.onAdFailed(adError.getMessage());
                            }
                        });
                        
                        mRewardedAd.show(activity, rewardItem -> {
                            Log.d(TAG, "User earned reward: " + rewardItem.getAmount() + " " + rewardItem.getType());
                            if (callback != null) callback.onAdLoaded(); // Used as success trigger
                        });
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                        Log.e(TAG, "Rewarded ad failed to load: " + loadAdError.getMessage());
                        mRewardedAd = null;
                        if (callback != null) callback.onAdFailed(loadAdError.getMessage());
                    }
                });
            }
        });
    }

    @Override
    public void loadNative(Activity activity, String adUnitId, ViewGroup container) {
        // Native ads require custom UI layouts. We initialize a fallback view or a placeholder container.
        Log.d(TAG, "Native ad loading requested (Placeholder implementation for container: " + container + ")");
    }

    @Override
    public void showAppOpenAd(final Activity activity, final String adUnitId) {
        if (adUnitId == null || adUnitId.trim().isEmpty() || isAppOpenAdLoading) return;

        isAppOpenAdLoading = true;
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                AdRequest adRequest = new AdRequest.Builder().build();
                AppOpenAd.load(activity, adUnitId.trim(), adRequest, new AppOpenAd.AppOpenAdLoadCallback() {
                    @Override
                    public void onAdLoaded(@NonNull AppOpenAd appOpenAd) {
                        mAppOpenAd = appOpenAd;
                        isAppOpenAdLoading = false;
                        Log.d(TAG, "App Open ad loaded successfully");
                        
                        mAppOpenAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                            @Override
                            public void onAdDismissedFullScreenContent() {
                                mAppOpenAd = null;
                                Log.d(TAG, "App Open ad dismissed");
                            }

                            @Override
                            public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                                mAppOpenAd = null;
                                Log.e(TAG, "App Open ad failed to show: " + adError.getMessage());
                            }
                        });
                        mAppOpenAd.show(activity);
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                        isAppOpenAdLoading = false;
                        Log.e(TAG, "App Open ad failed to load: " + loadAdError.getMessage());
                    }
                });
            }
        });
    }
}
