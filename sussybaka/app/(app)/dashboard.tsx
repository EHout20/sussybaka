import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useAuthSession } from '@/providers/auth-provider';

export default function DashboardScreen() {
  const { profile, signOut } = useAuthSession();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">DentalFlow Dashboard</ThemedText>
      <ThemedText>Welcome, {profile?.full_name ?? profile?.email ?? 'User'}.</ThemedText>

      <ThemedView style={styles.links}>
        <Link href="/(app)/schedule">Schedule</Link>
        <Link href="/(app)/patients">Patients</Link>
        <Link href="/(app)/billing">Billing</Link>
        <Link href="/(app)/tasks">Tasks</Link>
        <Link href="/(portal)">Open Patient Portal View</Link>
      </ThemedView>

      <Pressable style={styles.button} onPress={signOut}>
        <ThemedText style={styles.buttonText}>Sign out</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  links: { gap: 8, marginTop: 8 },
  button: {
    marginTop: 12,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
