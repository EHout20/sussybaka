export type AppRole = 'patient' | 'front_desk' | 'hygienist' | 'dentist' | 'admin';

export function getHomePathForRole(role: AppRole) {
  return role === 'patient' ? '/(portal)' : '/(app)/dashboard';
}
