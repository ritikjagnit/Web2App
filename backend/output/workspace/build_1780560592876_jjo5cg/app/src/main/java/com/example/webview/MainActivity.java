package com.example.webview;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

// Simulated AdMob SDK imports
// import com.google.android.gms.ads.AdRequest;
// import com.google.android.gms.ads.AdView;
// import com.google.android.gms.ads.MobileAds;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    
    // THESE PLACEHOLDERS WILL BE INJECTED BY THE BACKEND BUILD SERVICE
    private static final String APP_URL = "https://en.wikipedia.org";
    private static final String ADMOB_BANNER_ID = "ca-app-pub-xxxxxxxxxx/yyyyyyyy";
    private static final String ADMOB_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // 1. Initialize WebView
        webView = findViewById(R.id.webview);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl(APP_URL);

        // 2. Initialize AdMob (Commented out actual Google SDK calls for template)
        /*
        MobileAds.initialize(this, initializationStatus -> {});
        
        AdView mAdView = findViewById(R.id.adView);
        // Using injected Banner ID
        mAdView.setAdUnitId(ADMOB_BANNER_ID);
        AdRequest adRequest = new AdRequest.Builder().build();
        mAdView.loadAd(adRequest);
        */
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
