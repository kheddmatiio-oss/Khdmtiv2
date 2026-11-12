export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const today = () => new Date().toISOString().slice(0, 10);

export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR') : '';

export const isPast = (iso?: string) => !!iso && iso < today();

/** Case-insensitive "does any field contain the query" match. */
export const matches = (q: string, ...fields: (string | undefined)[]) => {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return fields.some((f) => (f ?? '').toLowerCase().includes(s));
};

/** Suspended, or a trial/subscription whose date has passed. The server
 *  applies the same rule, so this only decides which screen to show. */
export const isBlocked = (a?: { is_active: boolean; plan: string; plan_expires_at?: string | null } | null) =>
  !!a && (!a.is_active || (a.plan !== 'free' && !!a.plan_expires_at && new Date(a.plan_expires_at) < new Date()));
