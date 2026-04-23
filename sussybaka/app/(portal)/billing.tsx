import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function BillingScreen() {
  return (
    <ThemedView style={{ flex: 1, padding: 20, gap: 10 }}><ThemedText type='title'>Portal Billing</ThemedText><ThemedText>Portal billing screen migration target.</ThemedText></ThemedView>
  );
}
