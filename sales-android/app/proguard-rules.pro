# Keep WebView JavaScript bridges and BuildConfig fields
-keep class af.attaieproperties.sales.BuildConfig { *; }
-keepattributes *Annotation*,JavascriptInterface
-keepclassmembers class af.attaieproperties.sales.BiometricAuthBridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class af.attaieproperties.sales.DeviceBatteryBridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class androidx.biometric.** { *; }
