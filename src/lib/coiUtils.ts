export function getExpirationStatus(expirationDate: string | null | undefined): 'valid' | 'expiring' | 'expired' {
  if (!expirationDate) return 'valid';
  const expiry = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiry < today) return 'expired';

  const thirtyDaysOut = new Date(today);
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
  if (expiry <= thirtyDaysOut) return 'expiring';

  return 'valid';
}

export function formatExpirationDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
