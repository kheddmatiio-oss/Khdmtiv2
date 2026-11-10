/** Support contact for people who cannot sign in — the in-app chat is no
 *  use to someone locked out. Set NEXT_PUBLIC_SUPPORT_WHATSAPP to a number
 *  in international form without "+" (e.g. 213555123456). */
const RAW = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/[^0-9]/g, '') ?? '';
const EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? '';

export const supportLink = (message: string) => {
  if (RAW) return `https://wa.me/${RAW}?text=${encodeURIComponent(message)}`;
  if (EMAIL) return `mailto:${EMAIL}?subject=${encodeURIComponent(message)}`;
  return null;
};
