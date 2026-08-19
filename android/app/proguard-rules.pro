# Hemix AI - ProGuard/R8 Rules

# Keep Capacitor classes
-keep class io.ionic.standalone.** { *; }
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

# Keep Capacitor plugin classes
-keep class com.capacitorjs.** { *; }
-keep class @capacitor.** { *; }
-keep class capacitor.** { *; }

# Keep community plugins
-keep class com.capacitorcommunity.** { *; }
-keep class com.screamingsly.android.webspeech.** { *; }

# Keep WebView related classes
-keep class android.webkit.** { *; }
-keep class org.webkit.** { *; }

# Keep model classes (for serialization)
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Native method preservation
-keepclasseswithmembernames class * {
    native <methods>;
}

# JavaScript interface classes
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep AndroidX
-keep class androidx.** { *; }
-dontwarn androidx.**

# Remove debug logs in release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}
