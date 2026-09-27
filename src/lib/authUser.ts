import type { User } from "@supabase/supabase-js";

/**
 * Tri-state view of "may this visitor play?".
 *
 * `unknown` is deliberately not a synonym for signed out. krumath.com keeps its
 * Supabase session in localStorage, which never reaches the Worker, so a request with
 * no session cookie proves nothing about the visitor. Only the browser can resolve
 * `unknown`, because only the browser can read the shared session.
 */
export type PlayableAuthState =
  | { status: "authenticated"; userId: string }
  | { status: "unauthenticated" }
  | { status: "unknown" };

export function isPlayableUser(user: User | null): user is User {
  if (!user) return false;
  if (user.is_anonymous) return false;
  return true;
}

/**
 * Browser outcome. Storage is readable here, so the absence of a session is conclusive.
 */
export function clientPlayableAuthState(user: User | null): PlayableAuthState {
  return isPlayableUser(user)
    ? { status: "authenticated", userId: user.id }
    : { status: "unauthenticated" };
}

/**
 * Server outcome. Cookies are the only credential the Worker can see, so "no user"
 * must not be reported as `unauthenticated` — that is what sent signed-in players
 * back to /sign-in.
 */
export function serverPlayableAuthState(user: User | null): PlayableAuthState {
  return isPlayableUser(user)
    ? { status: "authenticated", userId: user.id }
    : { status: "unknown" };
}
