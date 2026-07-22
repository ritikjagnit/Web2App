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

    private boolean isAppOrbitProvider(Activity activity) {
        try {
            int providerResId = activity.getResources().getIdentifier("admob_provider", "string", activity.getPackageName());
            if (providerResId != 0) {
                String provider = activity.getString(providerResId);
                return "apporbit".equalsIgnoreCase(provider);
            }
        } catch (Exception e) {}
        return false;
    }

    @Override
    public void loadBanner(final Activity activity, final String adUnitId, final ViewGroup container) {
        if (container == null) return;
        
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (isAppOrbitProvider(activity) || (adUnitId != null && adUnitId.contains("apporbit"))) {
                        renderCustomAppOrbitAd(activity, container);
                        return;
                    }

                    if (adUnitId == null || adUnitId.trim().isEmpty()) return;

                    AdView adView = new AdView(activity);
                    adView.setAdSize(AdSize.BANNER);
                    adView.setAdUnitId(adUnitId.trim());
                    adView.setAdListener(new com.google.android.gms.ads.AdListener() {
                        @Override
                        public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                            Log.w(TAG, "AdMob Banner failed to load: " + loadAdError.getMessage() + ". Rendering SocialPlus promo fallback ad.");
                            renderCustomAppOrbitAd(activity, container);
                        }
                    });
                    
                    container.removeAllViews();
                    container.addView(adView);
                    
                    AdRequest adRequest = new AdRequest.Builder().build();
                    adView.loadAd(adRequest);
                    Log.d(TAG, "Banner Ad load requested for Unit ID: " + adUnitId);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to load banner ad: " + e.getMessage());
                    renderCustomAppOrbitAd(activity, container);
                }
            }
        });
    }

    private void renderCustomAppOrbitAd(final Activity activity, final ViewGroup container) {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    container.removeAllViews();
                    
                    // Main card container
                    android.widget.LinearLayout card = new android.widget.LinearLayout(activity);
                    card.setOrientation(android.widget.LinearLayout.HORIZONTAL);
                    card.setGravity(android.view.Gravity.CENTER_VERTICAL);
                    card.setPadding(dpToPx(activity, 12), dpToPx(activity, 8), dpToPx(activity, 12), dpToPx(activity, 8));
                    
                    // Gradient Card Background
                    android.graphics.drawable.GradientDrawable bg = new android.graphics.drawable.GradientDrawable();
                    bg.setColor(android.graphics.Color.parseColor("#1e1b4b"));
                    bg.setCornerRadius(dpToPx(activity, 12));
                    bg.setStroke(dpToPx(activity, 1), android.graphics.Color.parseColor("#4338ca"));
                    card.setBackground(bg);
                    
                    // App Logo Badge
                    android.widget.TextView iconBadge = new android.widget.TextView(activity);
                    iconBadge.setText("SP");
                    iconBadge.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 13);
                    iconBadge.setTypeface(null, android.graphics.Typeface.BOLD);
                    iconBadge.setTextColor(android.graphics.Color.WHITE);
                    iconBadge.setGravity(android.view.Gravity.CENTER);
                    
                    android.graphics.drawable.GradientDrawable iconBg = new android.graphics.drawable.GradientDrawable();
                    iconBg.setColor(android.graphics.Color.parseColor("#7c3aed"));
                    iconBg.setShape(android.graphics.drawable.GradientDrawable.OVAL);
                    iconBadge.setBackground(iconBg);
                    
                    android.widget.LinearLayout.LayoutParams iconParams = new android.widget.LinearLayout.LayoutParams(
                        dpToPx(activity, 34), dpToPx(activity, 34)
                    );
                    iconParams.setMargins(0, 0, dpToPx(activity, 10), 0);
                    card.addView(iconBadge, iconParams);
                    
                    // Text Details
                    android.widget.LinearLayout textLayout = new android.widget.LinearLayout(activity);
                    textLayout.setOrientation(android.widget.LinearLayout.VERTICAL);
                    
                    android.widget.TextView title = new android.widget.TextView(activity);
                    title.setText("SocialPlus 🚀");
                    title.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 13);
                    title.setTypeface(null, android.graphics.Typeface.BOLD);
                    title.setTextColor(android.graphics.Color.WHITE);
                    
                    android.widget.TextView subtitle = new android.widget.TextView(activity);
                    subtitle.setText("Boost Your Social Media Reach");
                    subtitle.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 10);
                    subtitle.setTextColor(android.graphics.Color.parseColor("#cbd5e1"));
                    
                    textLayout.addView(title);
                    textLayout.addView(subtitle);
                    
                    android.widget.LinearLayout.LayoutParams textParams = new android.widget.LinearLayout.LayoutParams(
                        0, android.widget.LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f
                    );
                    card.addView(textLayout, textParams);
                    
                    // Sponsored Tag
                    android.widget.TextView adTag = new android.widget.TextView(activity);
                    adTag.setText("Ad");
                    adTag.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 9);
                    adTag.setTextColor(android.graphics.Color.parseColor("#94a3b8"));
                    adTag.setPadding(0, 0, dpToPx(activity, 8), 0);
                    card.addView(adTag);
                    
                    // Action Pill Button
                    android.widget.TextView actionBtn = new android.widget.TextView(activity);
                    actionBtn.setText("Visit");
                    actionBtn.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 11);
                    actionBtn.setTypeface(null, android.graphics.Typeface.BOLD);
                    actionBtn.setTextColor(android.graphics.Color.WHITE);
                    actionBtn.setPadding(dpToPx(activity, 12), dpToPx(activity, 6), dpToPx(activity, 12), dpToPx(activity, 6));
                    
                    android.graphics.drawable.GradientDrawable btnBg = new android.graphics.drawable.GradientDrawable();
                    btnBg.setColor(android.graphics.Color.parseColor("#6d28d9"));
                    btnBg.setCornerRadius(dpToPx(activity, 20));
                    actionBtn.setBackground(btnBg);
                    
                    card.addView(actionBtn);
                    
                    // Open SocialPlus URL on click
                    card.setOnClickListener(new android.view.View.OnClickListener() {
                        @Override
                        public void onClick(android.view.View v) {
                            try {
                                android.content.Intent browserIntent = new android.content.Intent(
                                    android.content.Intent.ACTION_VIEW, 
                                    android.net.Uri.parse("http://socialplus.stufflas.com/")
                                );
                                activity.startActivity(browserIntent);
                            } catch (Exception e) {
                                Log.e(TAG, "Error launching SocialPlus ad link: " + e.getMessage());
                            }
                        }
                    });
                    
                    android.widget.FrameLayout.LayoutParams cardParams = new android.widget.FrameLayout.LayoutParams(
                        android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                        android.widget.FrameLayout.LayoutParams.WRAP_CONTENT
                    );
                    cardParams.setMargins(dpToPx(activity, 8), dpToPx(activity, 4), dpToPx(activity, 8), dpToPx(activity, 4));
                    container.addView(card, cardParams);
                    Log.d(TAG, "Successfully rendered custom AppOrbit SocialPlus promo ad card!");
                } catch (Exception e) {
                    Log.e(TAG, "Error rendering custom AppOrbit ad: " + e.getMessage());
                }
            }
        });
    }

    private static int dpToPx(Activity activity, int dp) {
        float density = activity.getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }

    @Override
    public void showInterstitial(final Activity activity, final String adUnitId, final AdCallback callback) {
        if (isAppOrbitProvider(activity)) {
            showSocialPlusDialogAd(activity, callback);
            return;
        }

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
                                showSocialPlusDialogAd(activity, callback);
                            }
                        });
                        
                        mInterstitialAd.show(activity);
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                        Log.e(TAG, "Interstitial ad failed to load: " + loadAdError.getMessage());
                        mInterstitialAd = null;
                        showSocialPlusDialogAd(activity, callback);
                    }
                });
            }
        });
    }

    private void showSocialPlusDialogAd(final Activity activity, final AdCallback callback) {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    android.app.AlertDialog.Builder builder = new android.app.AlertDialog.Builder(activity);
                    builder.setTitle("SocialPlus 🚀");
                    builder.setMessage("Boost your social media presence, engagement, and reach with SocialPlus!\n\nClick below to visit SocialPlus.");
                    builder.setPositiveButton("Visit SocialPlus", new android.content.DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(android.content.DialogInterface dialog, int which) {
                            try {
                                android.content.Intent intent = new android.content.Intent(
                                    android.content.Intent.ACTION_VIEW,
                                    android.net.Uri.parse("http://socialplus.stufflas.com/")
                                );
                                activity.startActivity(intent);
                            } catch (Exception e) {}
                            if (callback != null) callback.onAdDismissed();
                        }
                    });
                    builder.setNegativeButton("Close", new android.content.DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(android.content.DialogInterface dialog, int which) {
                            if (callback != null) callback.onAdDismissed();
                        }
                    });
                    builder.show();
                } catch (Exception e) {
                    if (callback != null) callback.onAdDismissed();
                }
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
                            if (callback != null) callback.onAdLoaded();
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
        renderCustomAppOrbitAd(activity, container);
    }

    @Override
    public void showAppOpenAd(final Activity activity, final String adUnitId) {
        if (isAppOrbitProvider(activity)) {
            showSocialPlusDialogAd(activity, null);
            return;
        }

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
