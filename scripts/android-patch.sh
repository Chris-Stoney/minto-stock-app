#!/usr/bin/env bash
# Patches the freshly generated Capacitor 6 android/ project so it meets
# Google Play's current requirements. The android/ folder is regenerated on every
# CI run (npx cap add android), so these changes are re-applied each time.
#
#   - minSdk 24 (Play's automatic protection) and compile/target SDK 36
#     (Play requires new releases to target API 36)
#   - Android Gradle Plugin 8.9.1 + Gradle 8.11.1 (the first versions that
#     build against API 36), including the copies inside node_modules
#   - edge-to-edge: targeting API 35+ draws the app under the status/navigation
#     bars, so MainActivity pads the web view by the system-bar insets
#   - versionCode from the CI run number (Play rejects a reused versionCode)
#
# Usage: bash scripts/android-patch.sh <versionCode>
set -euo pipefail

VERSION_CODE="${1:-1}"
AGP_VERSION="8.9.1"
GRADLE_VERSION="8.11.1"

echo "== variables.gradle"
sed -i -E \
  -e 's/minSdkVersion = [0-9]+/minSdkVersion = 24/' \
  -e 's/compileSdkVersion = [0-9]+/compileSdkVersion = 36/' \
  -e 's/targetSdkVersion = [0-9]+/targetSdkVersion = 36/' \
  android/variables.gradle
grep -n "SdkVersion" android/variables.gradle

echo "== Android Gradle Plugin $AGP_VERSION"
AGP_FILES=$(grep -rl "com.android.tools.build:gradle" android/build.gradle node_modules/@capacitor/*/android/build.gradle node_modules/@capacitor/android/capacitor/build.gradle 2>/dev/null || true)
for f in $AGP_FILES; do
  sed -i -E "s#com\.android\.tools\.build:gradle:[0-9.]+#com.android.tools.build:gradle:${AGP_VERSION}#" "$f"
  echo "patched $f"
done
grep -rn "com.android.tools.build:gradle" android/build.gradle

echo "== Gradle wrapper $GRADLE_VERSION"
sed -i -E "s#gradle-[0-9.]+-(bin|all)\.zip#gradle-${GRADLE_VERSION}-bin.zip#" android/gradle/wrapper/gradle-wrapper.properties
grep -n "distributionUrl" android/gradle/wrapper/gradle-wrapper.properties

echo "== versionCode $VERSION_CODE"
sed -i -E "s/versionCode [0-9]+/versionCode ${VERSION_CODE}/" android/app/build.gradle
grep -n "versionCode\|versionName" android/app/build.gradle

echo "== MainActivity (edge-to-edge insets)"
MAIN=$(find android/app/src/main/java -name MainActivity.java | head -1)
PKG=$(grep -m1 -E '^package ' "$MAIN" | sed -E 's/^package ([^;]+);.*/\1/')
cat > "$MAIN" <<EOF
package ${PKG};

import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Android 15+ always draws edge-to-edge for apps targeting API 35+, so keep
    // the web view clear of the status bar, navigation bar, notch and keyboard.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    View content = findViewById(android.R.id.content);
    ViewCompat.setOnApplyWindowInsetsListener(content, (v, windowInsets) -> {
      Insets bars = windowInsets.getInsets(
          WindowInsetsCompat.Type.systemBars()
              | WindowInsetsCompat.Type.displayCutout()
              | WindowInsetsCompat.Type.ime());
      v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
      return WindowInsetsCompat.CONSUMED;
    });
  }
}
EOF
echo "wrote $MAIN (package ${PKG})"
