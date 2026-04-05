import { Redirect } from 'expo-router';

// Root index just redirects — AuthGate in _layout handles routing
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
