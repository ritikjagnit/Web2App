package com.appweaver.template;

import android.app.Activity;
import android.view.ViewGroup;

public interface AdProvider {
    void initialize(Activity activity, String appId, AdCallback callback);
    void loadBanner(Activity activity, String adUnitId, ViewGroup container);
    void showInterstitial(Activity activity, String adUnitId, AdCallback callback);
    void showRewarded(Activity activity, String adUnitId, AdCallback callback);
    void loadNative(Activity activity, String adUnitId, ViewGroup container);
    void showAppOpenAd(Activity activity, String adUnitId);
}
