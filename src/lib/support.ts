/** Where people reach Khedmti. Instagram is where upgrades are handled; until
 *  a handle is set, the WhatsApp line stands in for it.
 *  NEXT_PUBLIC_INSTAGRAM       handle without "@"
 *  NEXT_PUBLIC_SUPPORT_EMAIL   public contact address
 *  NEXT_PUBLIC_SUPPORT_WHATSAPP international form without "+" */
const DEFAULT_WHATSAPP = '213794021344';
const DEFAULT_INSTAGRAM = '';
const DEFAULT_EMAIL = '';

const WA = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/[^0-9]/g, '') || DEFAULT_WHATSAPP;
export const INSTAGRAM = (process.env.NEXT_PUBLIC_INSTAGRAM || DEFAULT_INSTAGRAM).replace(/^@/, '').trim();
export const EMAIL = (process.env.NEXT_PUBLIC_SUPPORT_EMAIL || DEFAULT_EMAIL).trim();

const whatsapp = (message: string) => (WA ? `https://wa.me/${WA}?text=${encodeURIComponent(message)}` : null);

export const instagramLink = INSTAGRAM ? `https://instagram.com/${INSTAGRAM}` : null;
export const emailLink = EMAIL ? `mailto:${EMAIL}` : null;

/** General contact: Instagram and email once they exist, WhatsApp until then. */
export const supportLink = (message: string) =>
  instagramLink ?? emailLink ?? whatsapp(message);

/** Where a user goes to pay: a DM on Instagram, else WhatsApp. */
export const upgradeLink = (message: string) =>
  (INSTAGRAM ? `https://ig.me/m/${INSTAGRAM}` : null) ?? whatsapp(message) ?? emailLink;

export const upgradeChannel: 'instagram' | 'whatsapp' = INSTAGRAM ? 'instagram' : 'whatsapp';
