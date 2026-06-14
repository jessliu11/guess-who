import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Play, Grid2X2, User } from 'lucide-react-native';

function TabIcon({ Icon, color, focused }: { Icon: React.ComponentType<{ size: number; color: string }>; color: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {focused && (
        <View style={{
          position: 'absolute',
          top: -10,
          width: 20,
          height: 3,
          borderRadius: 2,
          backgroundColor: '#7C3AED',
        }} />
      )}
      <Icon size={24} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E0D5',
          borderTopWidth: 1,
          height: 76,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: 'Poppins_600SemiBold',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Play',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Play} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="packs"
        options={{
          title: 'Packs',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Grid2X2} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={User} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
