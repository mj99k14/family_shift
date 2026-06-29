import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!navigationState?.key || user === undefined) return;

    const inAuthScreen = segments[0] === undefined || segments[0] === 'register';

    if (user && inAuthScreen) {
      router.replace('/home');
    } else if (!user && !inAuthScreen) {
      router.replace('/');
    }
  }, [user, segments, navigationState?.key]);

  if (user === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
