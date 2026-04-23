import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function AppointmentsScreen() {
  return (
    <ThemedView style={{ flex: 1, padding: 20, gap: 10 }}><ThemedText type='title'>Appointments</ThemedText><ThemedText>Portal appointments screen migration target.</ThemedText></ThemedView>
  );
}
