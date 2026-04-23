import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

export default function PortalHomeScreen() {
  return (
    <ThemedView style={{ flex: 1, padding: 20, gap: 12 }}>
      <ThemedText type="title">Patient Portal</ThemedText>
      <ThemedText>Mobile portal navigation scaffold.</ThemedText>
      <Link href="/(portal)/appointments">Appointments</Link>
      <Link href="/(portal)/forms">Forms</Link>
      <Link href="/(portal)/documents">Documents</Link>
      <Link href="/(portal)/treatment">Treatment</Link>
      <Link href="/(portal)/billing">Billing</Link>
    </ThemedView>
  );
}
