package com.appweaver.template;

public interface AdCallback {
    void onAdLoaded();
    void onAdFailed(String error);
    void onAdDismissed();
}
