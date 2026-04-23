import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ScheduleScreen() {
  return (
    <ThemedView style={{ flex: 1, padding: 20, gap: 10 }}>
      <ThemedText type="title">Schedule</ThemedText>
      <ThemedText>Expo migration target: Dentalflow scheduling view goes here.</ThemedText>
    </ThemedView>
  );
}
