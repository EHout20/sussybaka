import { useAuthSession } from '@/providers/auth-provider';
import { Redirect, Stack } from 'expo-router';

export default function StaffLayout() {
  const { loading, session, profile } = useAuthSession();

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/sign-in" />;
  if (profile?.role === 'patient') return <Redirect href="/(portal)" />;

  return <Stack screenOptions={{ headerShown: true }} />;
}
