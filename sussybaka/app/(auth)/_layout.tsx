import { useAuthSession } from '@/providers/auth-provider';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { loading, session } = useAuthSession();

  if (loading) {
    return null;
  }

  if (session) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
