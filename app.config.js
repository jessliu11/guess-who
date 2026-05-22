export default ({ config }) => ({
  ...config,
  name: 'Who What Where',
  slug: 'guess-who-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'guesswho',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0F172A',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.guesswho.app',
    infoPlist: {
      NSCameraUsageDescription: 'Used to take character and profile photos.',
      NSPhotoLibraryUsageDescription: 'Used to pick photos for custom characters.',
    },
  },
  android: {
    package: 'com.guesswho.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0F172A',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: ['android.permission.CAMERA', 'android.permission.READ_MEDIA_IMAGES'],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 24,
          compileSdkVersion: 35,
          targetSdkVersion: 35,
        },
        ios: {
          deploymentTarget: '15.1',
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0F172A',
        image: './assets/splash-icon.png',
        imageWidth: 200,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    revenueCatAppleKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY,
    revenueCatGoogleKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
