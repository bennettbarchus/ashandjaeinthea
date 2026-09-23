/**
 * The /seating tool's shared PIN.
 *
 * Deliberately separate from the homepage's password gate: that one keeps
 * the public site private, this one keeps an internal editing tool from
 * being usable by anyone who guesses the URL. It is a speed bump, not
 * security — the value ships in the client bundle, so treat /seating as
 * "unlisted and lightly locked" rather than protected. The API routes
 * check the same PIN so the endpoints aren't wide open on their own.
 */
export const SEATING_PIN = "1114";

/** Header the client sends on every /api/seating request. */
export const SEATING_PIN_HEADER = "x-seating-pin";

export function isAuthorized(request: Request): boolean {
  return request.headers.get(SEATING_PIN_HEADER) === SEATING_PIN;
}
