declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: Record<string, string | number>) => void;
    };
  }
}

export type AnalyticsEvent =
  | "schedules_generated"
  | "plan_saved"
  | "share_link_created"
  | "ics_exported"
  | "degree_opened";

/**
 * Sends a named event to Umami analytics.
 *
 * Does nothing when:
 * - The site ID isn't configured (NEXT_PUBLIC_UMAMI_WEBSITE_ID is empty)
 * - The app isn't running in production
 * - The Umami script is blocked or hasn't loaded
 *
 * A blocked or failing script never affects the app.
 */
export function track(
  event: AnalyticsEvent,
  data?: Record<string, string | number>,
): void {
  try {
    if (!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID) return;
    if (process.env.NODE_ENV !== "production") return;
    window.umami?.track(event, data);
  } catch {
    // A blocked or failing script must never affect the app.
  }
}
