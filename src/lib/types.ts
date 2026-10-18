export type Currency = 'DZD' | 'USD' | 'EUR' | 'MAD' | 'TND' | 'GBP' | 'SAR' | 'AED' | 'CAD';

export type Client = {
  id: string; name: string;
  address?: string; nif?: string; nis?: string; rc?: string;
};

export type Editor = { id: string; name: string; role: Role; pw?: string };
export type Role = 'editor' | 'filmmaker' | 'designer';

export type Video = {
  id: string; title: string; clientId: string; editorId: string;
  date: string; price: number; currency: Currency; paid: boolean;
  createdAt?: string;
};

export type InvoiceLine = {
  id: string; ref: string; desc: string;
  qty: number; pu: number; videoId?: string; date?: string;
};

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export type Invoice = {
  id: string; number: string; clientId: string;
  date: string; due?: string; period?: string;
  currency: Currency; lines: InvoiceLine[];
  vat: number; discount: number;
  object?: string; paymentMode?: string; notes?: string;
  status: InvoiceStatus; createdAt?: string; paidAt?: string;
};

export type TaskStatus = 'todo' | 'doing' | 'done';
export type Task = {
  id: string; title: string; status: TaskStatus;
  priority: 'normal' | 'high';
  editorId?: string; clientId?: string; due?: string; notes?: string;
  createdAt?: string;
};

export type Settings = {
  company: {
    name: string; logo: string; email: string; phone: string;
    address: string; nif: string; nis: string; rc: string; art: string; rip: string;
  };
  invoice: { vat: number; paymentMode: string; object: string; prefix: string; lang: 'ar' | 'en' | 'fr' };
  currency: { base: Currency; list: { code: Currency; rate: number }[] };
  theme: { accent: string };
  onboarding: { dismissed: boolean };
};

export type AppData = {
  editors: Editor[]; clients: Client[]; videos: Video[];
  invoices: Invoice[]; tasks: Task[]; settings: Settings;
};

export type Agency = {
  id: string; name: string; email: string; phone?: string;
  plan: 'free' | 'basic' | 'pro';
  account_type: 'agency' | 'solo';
  is_active: boolean; is_super: boolean;
  plan_expires_at?: string | null; notes?: string; created_at?: string;
};

export type Session =
  | { kind: 'agency'; agency: Agency }
  | { kind: 'worker'; agency: Agency; worker: Editor };
