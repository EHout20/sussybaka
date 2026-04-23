import { useAuthSession } from '@/providers/auth-provider';
import { getHomePathForRole } from '@/types/roles';
import { Redirect } from 'expo-router';

export default function IndexRoute() {
  const { loading, profile, session } = useAuthSession();

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/sign-in" />;
  if (!profile) return null;
  return <Redirect href={getHomePathForRole(profile.role)} />;
}
