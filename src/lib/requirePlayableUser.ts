import { createIsomorphicFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";

import {
  clientPlayableAuthState,
  serverPlayableAuthState,
  type PlayableAuthState,
} from "@/lib/authUser";
import { publicGamePath, signInUrl } from "@/lib/krumathUrls";

const probePlayableAuth = createIsomorphicFn()
  .server(async () => {
    const { getServerUser } = await import("@/lib/supabase.server");
    return serverPlayableAuthState(await getServerUser());
  })
  .client(async () => {
    const { getBrowserUser } = await import("@/lib/supabase.client");
    return clientPlayableAuthState(await getBrowserUser());
  });

/**
 * Gate the game routes and hand the outcome to the route context.
 *
 * The Worker only ever sees cookies, so it returns `unknown` rather than bouncing a
 * player whose session lives in localStorage. The route renders an AuthGate for that
 * case and the browser finishes the check.
 */
export async function requirePlayableUser(routerPath: string): Promise<PlayableAuthState> {
  // Local play has no krumath.com session. Gate only in production.
  if (import.meta.env.DEV) return { status: "authenticated", userId: "dev-local" };

  const state = await probePlayableAuth();
  if (state.status === "unauthenticated") {
    throw redirect({ href: signInUrl(publicGamePath(routerPath)) });
  }
  return state;
}
