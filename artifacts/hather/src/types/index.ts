/**
 * Shared TypeScript types for the HATHER frontend.
 */

export type { Language } from '@/config/translations';
export type { translations } from '@/config/translations';

/** Keys available in the translation dictionary. */
export type TranslationKey = keyof (typeof import('@/config/translations'))['translations']['en'];

/** Status message used on the student check-in page. */
export type CheckInStatus = 'success' | 'info' | 'error' | 'warning';

/** Session query params parsed from the QR-code URL. */
export type SessionParams = {
  course: string;
  section: string;
  lecture: string;
};
