import { createClient } from '@supabase/supabase-js';
import { normalize } from './defaults';
import type { AppData, Agency, Editor, SupportMessage, SupportThread } from './types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY;

/** NEXT_PUBLIC_* values are inlined at build time, so a deploy built without
 *  them ships a client that cannot connect. Fail with something readable
 *  instead of a blank page. */
export const configError = !url || !key
  ? 'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_KEY'
  : null;

export const sb = createClient(
  url ?? 'https://placeholder.supabase.co',
  key ?? 'placeholder',
  { auth: { persistSession: false } },
);

const TOKEN_KEY = 'khedmti.token';
export const getToken = () =>
  typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (typeof window === 'undefined') return;
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
};

/** Server-side error codes raised by the SQL functions. */
export type ApiCode =
  | 'not_found' | 'bad_password' | 'agency_not_found' | 'duplicate_email'
  | 'weak_password' | 'no_session' | 'forbidden' | 'network';

export class ApiError extends Error {
  constructor(public code: ApiCode, message?: string) {
    super(message ?? code);
  }
}

const CODES: ApiCode[] = [
  'not_found', 'bad_password', 'agency_not_found', 'duplicate_email',
  'weak_password', 'no_session', 'forbidden',
];

/**
 * The anon key has no direct table access — every read and write goes through
 * a security-definer RPC carrying a session token.
 */
async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  let res;
  try {
    res = await sb.rpc(fn, args);
  } catch {
    throw new ApiError('network');
  }
  if (res.error) {
    const raw = res.error.message ?? '';
    const code = CODES.find((c) => raw.includes(c));
    if (code === 'no_session') setToken(null);
    throw new ApiError(code ?? 'network', raw);
  }
  return res.data as T;
}

type AuthResult = { token: string; agency: Agency };
type WorkerResult = AuthResult & { worker: Editor; data: Partial<AppData> };

export const api = {
  async register(name: string, email: string, password: string, phone = '', type: 'agency' | 'solo' = 'agency') {
    const r = await rpc<AuthResult>('api_register', {
      p_name: name, p_email: email, p_password: password, p_phone: phone, p_type: type,
    });
    setToken(r.token);
    return r.agency;
  },

  async login(email: string, password: string) {
    const r = await rpc<AuthResult>('api_login', { p_email: email, p_password: password });
    setToken(r.token);
    return r.agency;
  },

  async loginWorker(workspaceEmail: string, password: string) {
    const r = await rpc<WorkerResult>('api_login_worker', {
      p_agency_email: workspaceEmail, p_password: password,
    });
    setToken(r.token);
    return { agency: r.agency, worker: r.worker, data: normalize(r.data) };
  },

  async load(): Promise<AppData> {
    return normalize(await rpc<Partial<AppData>>('api_load', { p_token: getToken() }));
  },

  async save(data: AppData) {
    await rpc<void>('api_save', { p_token: getToken(), p_data: data });
  },

  /** Team passwords are bcrypted server-side; plaintext never reaches a row. */
  async hashPassword(pw: string) {
    return rpc<string>('api_hash_password', { p_token: getToken(), p_password: pw });
  },

  async logout() {
    const t = getToken();
    if (t) { try { await rpc<void>('api_logout', { p_token: t }); } catch { /* best effort */ } }
    setToken(null);
  },

  // support chat — one thread per workspace, with the super admin
  supportSend: (body: string) =>
    rpc<SupportMessage>('api_support_send', { p_token: getToken(), p_body: body }),
  supportList: () =>
    rpc<SupportMessage[]>('api_support_list', { p_token: getToken() }),
  supportUnread: () =>
    rpc<number>('api_support_unread', { p_token: getToken() }),
  adminSupportThreads: () =>
    rpc<SupportThread[]>('api_admin_support_threads', { p_token: getToken() }),
  adminSupportList: (agencyId: string) =>
    rpc<SupportMessage[]>('api_admin_support_list', { p_token: getToken(), p_agency: agencyId }),
  adminSupportSend: (agencyId: string, body: string) =>
    rpc<SupportMessage>('api_admin_support_send', { p_token: getToken(), p_agency: agencyId, p_body: body }),

  // super-admin — the RPCs verify is_super themselves
  adminAgencies: () => rpc<Agency[]>('api_admin_agencies', { p_token: getToken() }),
  adminData: (id: string) => rpc<Partial<AppData>>('api_admin_data', { p_token: getToken(), p_agency: id }).then(normalize),
  adminUpdate: (id: string, patch: Partial<Agency>) =>
    rpc<void>('api_admin_update', { p_token: getToken(), p_agency: id, p_patch: patch }),
  adminDelete: (id: string) => rpc<void>('api_admin_delete', { p_token: getToken(), p_agency: id }),
};
