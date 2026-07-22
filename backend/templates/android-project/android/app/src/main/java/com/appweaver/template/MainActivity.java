package com.appweaver.template;

import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.WebView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.ImageView;
import android.widget.FrameLayout;
import android.view.Gravity;
import android.content.res.ColorStateList;
import android.graphics.Color;
import org.json.JSONArray;
import org.json.JSONObject;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        final WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.post(new Runnable() {
                @Override
                public void run() {
                    setupLayoutAndAds(webView);
                }
            });
        }
    }
    
    private void setupLayoutAndAds(final WebView webView) {
        // 1. Read monetization config from resources
        int resIdAdsEnabled = getResources().getIdentifier("admob_enabled", "string", getPackageName());
        boolean adsEnabled = false;
        if (resIdAdsEnabled != 0) {
            adsEnabled = Boolean.parseBoolean(getString(resIdAdsEnabled));
        }

        String providerName = "";
        String appId = "";
        String bannerId = "";
        String interstitialId = "";
        String rewardedId = "";
        String nativeId = "";
        String appOpenId = "";

        if (adsEnabled) {
            int providerResId = getResources().getIdentifier("admob_provider", "string", getPackageName());
            int appIdResId = getResources().getIdentifier("admob_app_id", "string", getPackageName());
            int bannerResId = getResources().getIdentifier("admob_banner_id", "string", getPackageName());
            int interstitialResId = getResources().getIdentifier("admob_interstitial_id", "string", getPackageName());
            int rewardedResId = getResources().getIdentifier("admob_rewarded_id", "string", getPackageName());
            int nativeResId = getResources().getIdentifier("admob_native_id", "string", getPackageName());
            int appOpenResId = getResources().getIdentifier("admob_app_open_id", "string", getPackageName());

            providerName = providerResId != 0 ? getString(providerResId) : "admob";
            appId = appIdResId != 0 ? getString(appIdResId) : "";
            bannerId = bannerResId != 0 ? getString(bannerResId) : "";
            interstitialId = interstitialResId != 0 ? getString(interstitialResId) : "";
            rewardedId = rewardedResId != 0 ? getString(rewardedResId) : "";
            nativeId = nativeResId != 0 ? getString(nativeResId) : "";
            appOpenId = appOpenResId != 0 ? getString(appOpenResId) : "";

            Log.d(TAG, "Monetization enabled. Provider: " + providerName + ", App ID: " + appId);
            
            // Initialize AdManager
            try {
                AdManager.getInstance().setup(this, providerName, appId);
                if (appOpenId != null && !appOpenId.trim().isEmpty()) {
                    AdManager.getInstance().showAppOpenAd(this, appOpenId);
                }
            } catch (Throwable t) {
                Log.e(TAG, "AdManager setup error: " + t.getMessage());
            }
        }

        // 2. Read Bottom Nav config
        int resIdShow = getResources().getIdentifier("show_bottom_nav", "string", getPackageName());
        boolean showBottomNav = false;
        if (resIdShow != 0) {
            showBottomNav = Boolean.parseBoolean(getString(resIdShow));
        }
        
        // If neither ads nor bottom nav is enabled, leave the webview alone
        if (!showBottomNav && (!adsEnabled || bannerId.isEmpty())) {
            return;
        }
        
        android.view.ViewGroup parent = (android.view.ViewGroup) webView.getParent();
        if (parent == null) return;
        
        if (parent.getId() == 998877) {
            return;
        }
        
        int index = parent.indexOfChild(webView);
        
        // Create the container layout wrapper
        LinearLayout mainContainer = new LinearLayout(this);
        mainContainer.setId(998877);
        mainContainer.setOrientation(LinearLayout.VERTICAL);
        mainContainer.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
        ));
        
        parent.removeView(webView);
        
        LinearLayout.LayoutParams webViewParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1.0f
        );
        webView.setLayoutParams(webViewParams);
        mainContainer.addView(webView);

        // Inject Banner Ad if enabled
        if (adsEnabled && !bannerId.trim().isEmpty()) {
            try {
                FrameLayout adContainer = new FrameLayout(this);
                adContainer.setId(887766);
                LinearLayout.LayoutParams adParams = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                );
                adContainer.setLayoutParams(adParams);
                mainContainer.addView(adContainer);
                
                AdManager.getInstance().loadBanner(this, bannerId, adContainer);
                Log.d(TAG, "Loaded banner into container layout");
            } catch (Throwable t) {
                Log.e(TAG, "Error injecting Banner Ad: " + t.getMessage());
            }
        }
        
        // Inject Bottom Navigation if enabled
        if (showBottomNav) {
            setupBottomNavigation(mainContainer);
        }
        
        parent.addView(mainContainer, index);

        // Periodically trigger Interstitial Ads on user navigation or after delay as a future ready option
        if (adsEnabled && !interstitialId.isEmpty()) {
            final String finalInterstitialId = interstitialId;
            webView.postDelayed(new Runnable() {
                @Override
                public void run() {
                    try {
                        AdManager.getInstance().showInterstitial(MainActivity.this, finalInterstitialId);
                    } catch (Throwable t) {
                        Log.e(TAG, "Error showing interstitial: " + t.getMessage());
                    }
                }
            }, 10000); // Show interstitial after 10 seconds of app load
        }
    }
    
    private void setupBottomNavigation(LinearLayout mainContainer) {
        LinearLayout bottomNav = new LinearLayout(this);
        bottomNav.setOrientation(LinearLayout.HORIZONTAL);
        bottomNav.setGravity(Gravity.CENTER_VERTICAL);
        bottomNav.setBackgroundColor(Color.parseColor("#121212"));
        
        LinearLayout.LayoutParams navParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                (int) (56 * getResources().getDisplayMetrics().density)
        );
        bottomNav.setLayoutParams(navParams);
        
        int resIdJson = getResources().getIdentifier("custom_navigation_json", "string", getPackageName());
        String customNavJson = "";
        if (resIdJson != 0) {
            customNavJson = getString(resIdJson);
        }
        
        final WebView webView = getBridge().getWebView();
        
        if (customNavJson != null && !customNavJson.trim().isEmpty() && !customNavJson.equals("none")) {
            try {
                JSONArray jsonArray = new JSONArray(customNavJson);
                for (int i = 0; i < jsonArray.length(); i++) {
                    JSONObject item = jsonArray.getJSONObject(i);
                    final String label = item.optString("label", "");
                    final String url = item.optString("url", "");
                    String iconName = item.optString("icon", "home");
                    
                    LinearLayout itemLayout = new LinearLayout(this);
                    itemLayout.setOrientation(LinearLayout.VERTICAL);
                    itemLayout.setGravity(Gravity.CENTER);
                    
                    LinearLayout.LayoutParams layoutParams = new LinearLayout.LayoutParams(
                            0,
                            LinearLayout.LayoutParams.MATCH_PARENT,
                            1.0f
                    );
                    itemLayout.setLayoutParams(layoutParams);
                    itemLayout.setClickable(true);
                    itemLayout.setFocusable(true);
                    
                    int[] attrs = new int[]{android.R.attr.selectableItemBackground};
                    android.content.res.TypedArray ta = obtainStyledAttributes(attrs);
                    int rippleRes = ta.getResourceId(0, 0);
                    ta.recycle();
                    if (rippleRes != 0) {
                        itemLayout.setBackgroundResource(rippleRes);
                    }
                    
                    ImageView imageView = new ImageView(this);
                    int iconDimen = (int) (24 * getResources().getDisplayMetrics().density);
                    LinearLayout.LayoutParams imgParams = new LinearLayout.LayoutParams(iconDimen, iconDimen);
                    imgParams.topMargin = (int) (4 * getResources().getDisplayMetrics().density);
                    imageView.setLayoutParams(imgParams);
                    
                    int iconResId = 0;
                    if (iconName.startsWith("custom_icon_")) {
                        iconResId = getResources().getIdentifier(iconName, "drawable", getPackageName());
                    } else {
                        String fullIconName = "ic_" + iconName;
                        iconResId = getResources().getIdentifier(fullIconName, "drawable", getPackageName());
                    }
                    
                    if (iconResId != 0) {
                        imageView.setImageResource(iconResId);
                    } else {
                        int fallbackId = getResources().getIdentifier("ic_home", "drawable", getPackageName());
                        if (fallbackId != 0) {
                            imageView.setImageResource(fallbackId);
                        }
                    }
                    imageView.setImageTintList(ColorStateList.valueOf(Color.parseColor("#CCCCCC")));
                    
                    TextView textView = new TextView(this);
                    LinearLayout.LayoutParams textParams = new LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.WRAP_CONTENT,
                            LinearLayout.LayoutParams.WRAP_CONTENT
                    );
                    textParams.bottomMargin = (int) (4 * getResources().getDisplayMetrics().density);
                    textView.setLayoutParams(textParams);
                    textView.setText(label);
                    textView.setTextSize(9);
                    textView.setTextColor(Color.parseColor("#CCCCCC"));
                    textView.setGravity(Gravity.CENTER);
                    
                    itemLayout.addView(imageView);
                    itemLayout.addView(textView);
                    
                    itemLayout.setOnClickListener(v -> {
                        if (url != null && !url.isEmpty()) {
                            String targetUrl = url;
                            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                                String baseUrl = getBridge().getServerUrl();
                                if (baseUrl.endsWith("/") && url.startsWith("/")) {
                                    targetUrl = baseUrl + url.substring(1);
                                } else if (!baseUrl.endsWith("/") && !url.startsWith("/")) {
                                    targetUrl = baseUrl + "/" + url;
                                } else {
                                    targetUrl = baseUrl + url;
                                }
                            }
                            webView.loadUrl(targetUrl);
                        }
                    });
                    
                    bottomNav.addView(itemLayout);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else {
            String[] labels = {"Back", "Home", "Refresh", "Forward"};
            String[] icons = {"ic_arrow_back", "ic_home", "ic_refresh", "ic_arrow_forward"};
            
            for (int i = 0; i < 4; i++) {
                final int indexBtn = i;
                LinearLayout itemLayout = new LinearLayout(this);
                itemLayout.setOrientation(LinearLayout.VERTICAL);
                itemLayout.setGravity(Gravity.CENTER);
                
                LinearLayout.LayoutParams layoutParams = new LinearLayout.LayoutParams(
                        0,
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        1.0f
                );
                itemLayout.setLayoutParams(layoutParams);
                itemLayout.setClickable(true);
                itemLayout.setFocusable(true);
                
                int[] attrs = new int[]{android.R.attr.selectableItemBackground};
                android.content.res.TypedArray ta = obtainStyledAttributes(attrs);
                int rippleRes = ta.getResourceId(0, 0);
                ta.recycle();
                if (rippleRes != 0) {
                    itemLayout.setBackgroundResource(rippleRes);
                }
                
                ImageView imageView = new ImageView(this);
                int iconDimen = (int) (24 * getResources().getDisplayMetrics().density);
                LinearLayout.LayoutParams imgParams = new LinearLayout.LayoutParams(iconDimen, iconDimen);
                imgParams.topMargin = (int) (4 * getResources().getDisplayMetrics().density);
                imageView.setLayoutParams(imgParams);
                
                int iconResId = getResources().getIdentifier(icons[i], "drawable", getPackageName());
                if (iconResId != 0) {
                    imageView.setImageResource(iconResId);
                }
                imageView.setImageTintList(ColorStateList.valueOf(Color.parseColor("#CCCCCC")));
                
                TextView textView = new TextView(this);
                LinearLayout.LayoutParams textParams = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                );
                textParams.bottomMargin = (int) (4 * getResources().getDisplayMetrics().density);
                textView.setLayoutParams(textParams);
                textView.setText(labels[i]);
                textView.setTextSize(9);
                textView.setTextColor(Color.parseColor("#CCCCCC"));
                textView.setGravity(Gravity.CENTER);
                
                itemLayout.addView(imageView);
                itemLayout.addView(textView);
                
                itemLayout.setOnClickListener(v -> {
                    if (indexBtn == 0) {
                        if (webView.canGoBack()) {
                            webView.goBack();
                        }
                    } else if (indexBtn == 1) {
                        webView.loadUrl(getBridge().getServerUrl());
                    } else if (indexBtn == 2) {
                        webView.reload();
                    } else if (indexBtn == 3) {
                        if (webView.canGoForward()) {
                            webView.goForward();
                        }
                    }
                });
                
                bottomNav.addView(itemLayout);
            }
        }
        
        mainContainer.addView(bottomNav);
    }
}
