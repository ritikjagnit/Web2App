package com.appweaver.template;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.ImageView;
import android.view.Gravity;
import android.content.res.ColorStateList;
import android.graphics.Color;
import org.json.JSONArray;
import org.json.JSONObject;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        final WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.post(new Runnable() {
                @Override
                public void run() {
                    setupBottomNavigation(webView);
                }
            });
        }
    }
    
    private void setupBottomNavigation(final WebView webView) {
        int resIdShow = getResources().getIdentifier("show_bottom_nav", "string", getPackageName());
        boolean showBottomNav = false;
        if (resIdShow != 0) {
            showBottomNav = Boolean.parseBoolean(getString(resIdShow));
        }
        
        if (!showBottomNav) {
            return;
        }
        
        android.view.ViewGroup parent = (android.view.ViewGroup) webView.getParent();
        if (parent == null) return;
        
        if (parent.getId() == 998877) {
            return;
        }
        
        int index = parent.indexOfChild(webView);
        
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
        parent.addView(mainContainer, index);
    }
}
