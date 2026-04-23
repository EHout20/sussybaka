import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function BillingScreen() {
  return (
    <ThemedView style={{ flex: 1, padding: 20, gap: 10 }}>
      <ThemedText type="title">Billing</ThemedText>
      <ThemedText>Expo migration target: invoices, payments, and claims.</ThemedText>
    </ThemedView>
  );
}
