const baseConfig = require('./app.json');

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  '';

export default {
  ...baseConfig,
  expo: {
    ...baseConfig.expo,
    extra: {
      ...(baseConfig.expo.extra ?? {}),
      supabaseUrl,
      supabasePublishableKey,
    },
  },
};
