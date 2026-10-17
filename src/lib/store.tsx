'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError, getToken } from './api';
import { EMPTY_DATA } from './defaults';
import { translate, DIR, type Key, type Lang } from './i18n';
import type { AppData, Agency, Editor } from './types';

type Toast = { id: number; msg: string; tone: 'ok' | 'err' };
type Phase = 'booting' | 'anon' | 'ready';

type Store = {
  lang: Lang; setLang: (l: Lang) => void;
  t: (k: Key, ...a: (string | number)[]) => string;
  dark: boolean; toggleTheme: () => void;
  phase: Phase;
  agency: Agency | null; worker: Editor | null;
  data: AppData;
  /** Optimistic: UI updates immediately, the write follows. */
  mutate: (next: AppData | ((d: AppData) => AppData)) => void;
  signIn: (a: Agency, w?: Editor, d?: AppData) => void;
  signOut: () => Promise<void>;
  reload: () => Promise<void>;
  saving: boolean;
  toasts: Toast[]; toast: (msg: string, tone?: 'ok' | 'err') => void;
};

const Ctx = createContext<Store | null>(null);
export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
};

const LS = { lang: 'khedmti.lang', theme: 'khedmti.theme', session: 'khedmti.session' };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');
  const [dark, setDark] = useState(true);
  const [phase, setPhase] = useState<Phase>('booting');
  const [agency, setAgency] = useState<Agency | null>(null);
  const [worker, setWorker] = useState<Editor | null>(null);
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((msg: string, tone: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const t = useCallback((k: Key, ...a: (string | number)[]) => translate(lang, k, ...a), [lang]);

  /* preferences + session restore */
  useEffect(() => {
    const l = (localStorage.getItem(LS.lang) as Lang) || 'ar';
    const d = localStorage.getItem(LS.theme) !== 'light';
    setLangState(l); setDark(d);

    const raw = localStorage.getItem(LS.session);
    if (!raw || !getToken()) { setPhase('anon'); return; }
    try {
      const s = JSON.parse(raw);
      setAgency(s.agency); setWorker(s.worker ?? null);
    } catch { setPhase('anon'); return; }

    // the cached session is only a hint — the token decides
    api.load()
      .then((d2) => { setData(d2); setPhase('ready'); })
      .catch(() => {
        localStorage.removeItem(LS.session);
        setAgency(null); setWorker(null); setPhase('anon');
      });
  }, []);

  /* reflect language + theme on <html> */
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = DIR[lang];
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  /* user accent overrides the brand default */
  useEffect(() => {
    const a = data.settings.theme.accent;
    document.documentElement.style.setProperty('--accent', a || 'var(--color-brand-500)');
  }, [data.settings.theme.accent]);

  const setLang = useCallback((l: Lang) => { localStorage.setItem(LS.lang, l); setLangState(l); }, []);
  const toggleTheme = useCallback(() => {
    setDark((v) => { localStorage.setItem(LS.theme, v ? 'light' : 'dark'); return !v; });
  }, []);

  /* Writes are coalesced: typing in a form must not fire one request per key. */
  const pending = useRef<AppData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    const next = pending.current;
    if (!next) return;
    pending.current = null;
    setSaving(true);
    try {
      await api.save(next);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : 'network';
      toast(translate(lang, code === 'no_session' ? 'err_session' : 'err_net'), 'err');
    } finally {
      setSaving(false);
    }
  }, [lang, toast]);

  const mutate = useCallback((next: AppData | ((d: AppData) => AppData)) => {
    setData((prev) => {
      const v = typeof next === 'function' ? (next as (d: AppData) => AppData)(prev) : next;
      pending.current = v;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 400);
      return v;
    });
  }, [flush]);

  /* never lose an in-flight edit on navigate away */
  useEffect(() => {
    const onHide = () => { if (pending.current) flush(); };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', () => { if (document.hidden) onHide(); });
    return () => window.removeEventListener('pagehide', onHide);
  }, [flush]);

  const signIn = useCallback((a: Agency, w?: Editor, d?: AppData) => {
    setAgency(a); setWorker(w ?? null);
    localStorage.setItem(LS.session, JSON.stringify({ agency: a, worker: w ?? null }));
    if (d) { setData(d); setPhase('ready'); return; }
    api.load().then((d2) => { setData(d2); setPhase('ready'); })
      .catch(() => { setData(EMPTY_DATA); setPhase('ready'); });
  }, []);

  const signOut = useCallback(async () => {
    await api.logout();
    localStorage.removeItem(LS.session);
    setAgency(null); setWorker(null); setData(EMPTY_DATA); setPhase('anon');
  }, []);

  const reload = useCallback(async () => { setData(await api.load()); }, []);

  const value = useMemo<Store>(() => ({
    lang, setLang, t, dark, toggleTheme, phase,
    agency, worker, data, mutate, signIn, signOut, reload, saving, toasts, toast,
  }), [lang, setLang, t, dark, toggleTheme, phase, agency, worker, data, mutate, signIn, signOut, reload, saving, toasts, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
