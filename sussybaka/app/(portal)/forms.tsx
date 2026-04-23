import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function FormsScreen() {
  return (
    <ThemedView style={{ flex: 1, padding: 20, gap: 10 }}><ThemedText type='title'>Forms</ThemedText><ThemedText>Portal forms screen migration target.</ThemedText></ThemedView>
  );
}
