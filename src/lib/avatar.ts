const PALETTE = ['#7C3AED', '#0EA5E9', '#F59E0B', '#10B981', '#EF4444', '#EC4899'];

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getColorForName(name: string): string {
  const key = name.trim() || '?';
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  return PALETTE[sum % PALETTE.length];
}
