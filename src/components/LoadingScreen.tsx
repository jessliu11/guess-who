import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Full-screen loading state shown while auth resolves on cold launch.
 * Plain purple background + title, mirroring the welcome/title page (minus the
 * action buttons) so the handoff to the title page is seamless.
 */
export function LoadingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#7C3AED' }}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontSize: 36,
            fontFamily: 'Poppins_700Bold',
            color: '#FFFFFF',
            textAlign: 'center',
          }}
        >
          Who What Where?
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontFamily: 'Poppins_400Regular',
            color: 'rgba(255,255,255,0.75)',
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          The guessing game, reinvented.
        </Text>
      </View>
    </View>
  );
}
