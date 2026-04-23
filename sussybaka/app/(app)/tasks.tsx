import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function TasksScreen() {
  return (
    <ThemedView style={{ flex: 1, padding: 20, gap: 10 }}>
      <ThemedText type="title">Tasks</ThemedText>
      <ThemedText>Expo migration target: assignment and due-date tracking.</ThemedText>
    </ThemedView>
  );
}
