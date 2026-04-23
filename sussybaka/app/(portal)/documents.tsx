import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function DocumentsScreen() {
  return (
    <ThemedView style={{ flex: 1, padding: 20, gap: 10 }}><ThemedText type='title'>Documents</ThemedText><ThemedText>Portal documents screen migration target.</ThemedText></ThemedView>
  );
}
