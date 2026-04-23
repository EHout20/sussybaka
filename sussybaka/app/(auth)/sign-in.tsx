import { getSupabaseClient } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SignInScreen() {
  const supabase = getSupabaseClient();
  const [emailAddress, setEmailAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [magicLoading, setMagicLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onMagicLink = async () => {
    if (magicLoading || googleLoading) return;
    setMagicLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = emailAddress.trim();
    const emailRedirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/(auth)/sign-in` : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo,
      },
    });
    if (error) {
      setErrorMessage(error.message);
      setMagicLoading(false);
      return;
    }
    setMagicLoading(false);
    setSuccessMessage(`Magic link sent to ${trimmedEmail}. Open it in the same browser.`);
  };

  const onGoogle = async () => {
    if (magicLoading || googleLoading) return;
    setGoogleLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      setErrorMessage(error.message);
    }
    setGoogleLoading(false);
  };

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <ThemedText type="title">DentalFlow</ThemedText>
        <ThemedText style={styles.subtitle}>
          Sign in to access your clinic dashboard and patient portal.
        </ThemedText>
      </View>

      <ThemedView style={styles.card}>
        <Pressable
          style={({ pressed }) => [
            styles.socialButton,
            pressed && styles.buttonPressed,
            (magicLoading || googleLoading) && styles.buttonDisabled,
          ]}
          onPress={onGoogle}
          disabled={magicLoading || googleLoading}
        >
          <ThemedText style={styles.socialIcon}>G</ThemedText>
          <ThemedText style={styles.socialLabel}>
            {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
          </ThemedText>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <ThemedText style={styles.dividerText}>or with email</ThemedText>
          <View style={styles.divider} />
        </View>

        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@clinic.com"
          value={emailAddress}
          onChangeText={setEmailAddress}
          placeholderTextColor="#8a8a8a"
        />

        {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}
        {successMessage ? <ThemedText style={styles.success}>{successMessage}</ThemedText> : null}

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            (magicLoading || googleLoading || !emailAddress) && styles.buttonDisabled,
          ]}
          onPress={onMagicLink}
          disabled={magicLoading || googleLoading || !emailAddress}
        >
          <ThemedText style={styles.primaryButtonText}>
            {magicLoading ? 'Sending magic link...' : 'Email me a magic link'}
          </ThemedText>
        </Pressable>

        <ThemedText style={styles.helperText}>
          We will send a secure sign-in link to your inbox.
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  subtitle: {
    opacity: 0.75,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#c9c9c9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  socialButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c9c9c9',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  socialIcon: {
    fontWeight: '700',
  },
  socialLabel: {
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#d8d8d8',
  },
  dividerText: {
    fontSize: 12,
    opacity: 0.7,
  },
  helperText: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c9c9c9',
  },
  error: {
    color: '#cc2b2b',
  },
  success: {
    color: '#2f7d32',
  },
});
