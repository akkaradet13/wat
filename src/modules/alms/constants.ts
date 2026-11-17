/** A round with no location for this long is treated as ended (read side) and closed when any round starts. */
export const STALE_MS = 30 * 60 * 1000;
/** How often the sender page posts its position. */
export const SEND_INTERVAL_MS = 15 * 1000;

export const ROUTES = "alms_routes";
export const ROUNDS = "alms_rounds";
export const HOUSEHOLDS = "alms_households";
export const NOTIFICATIONS = "alms_notifications";
export const ANNOUNCEMENTS = "alms_announcements";
