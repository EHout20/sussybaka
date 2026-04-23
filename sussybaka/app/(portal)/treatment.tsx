import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function TreatmentScreen() {
  return (
    <ThemedView style={{ flex: 1, padding: 20, gap: 10 }}><ThemedText type='title'>Treatment</ThemedText><ThemedText>Portal treatment screen migration target.</ThemedText></ThemedView>
  );
}
