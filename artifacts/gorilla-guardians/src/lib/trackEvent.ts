import { trackAnalyticsEvent, type AnalyticsEventInputEventType } from "@workspace/api-client-react";

const SESSION_KEY = "gg_analytics_session";

/**
 * A purely client-generated id (not an auth/session token) used only to count distinct
 * "interested visitors" for the most-viewed and conversion-rate analytics. Persisted in
 * localStorage so a visitor's views across pages count as one session.
 */
function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (e.g. privacy mode) — fall back to a per-call id; this just means
    // that visitor's views won't be deduplicated into one session, which is an acceptable
    // degradation for a "nice to have" analytics signal.
    return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * Fire-and-forget view/interest tracking. Never throws — analytics must never break the page
 * that's reporting them.
 */
export function trackEvent(eventType: AnalyticsEventInputEventType, entityId: number): void {
  trackAnalyticsEvent({ sessionId: getSessionId(), eventType, entityId }).catch(() => {});
}
