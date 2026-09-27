import { createClientOnlyFn } from "@tanstack/react-start";
import { useEffect, useState, type ReactNode } from "react";

import { clientPlayableAuthState, type PlayableAuthState } from "@/lib/authUser";
import { publicGamePath, signInUrl } from "@/lib/krumathUrls";

/**
 * Resolving the session needs browser storage, so this is client-only — which also keeps
 * the `supabase.client` module out of the server bundle.
 */
const resolvePlayableAuth = createClientOnlyFn(async (): Promise<PlayableAuthState> => {
  const { getBrowserUser } = await import("@/lib/supabase.client");
  return clientPlayableAuthState(await getBrowserUser());
});

type AuthGateProps = {
  /** Outcome of the route's `beforeLoad`, which the server can only ever report as `unknown`. */
  initial: PlayableAuthState;
  /** Router path, used to build the `returnUrl` when the visitor really is signed out. */
  routerPath: string;
  children: ReactNode;
};

/**
 * Nothing inside the game renders until a KruMath account is confirmed.
 *
 * SSR reports `unknown` because krumath.com keeps its session in localStorage, which the
 * Worker cannot read. The browser resolves that here and redirects only when the absence
 * of a session is conclusive, so a signed-out visitor sees a spinner rather than a flash
 * of the game, and a signed-in player is never bounced.
 */
export function AuthGate({ initial, routerPath, children }: AuthGateProps) {
  const [state, setState] = useState<PlayableAuthState>(initial);

  useEffect(() => {
    if (state.status !== "unknown") return;
    let cancelled = false;

    void (async () => {
      // A session that cannot be read is treated as signed out: failing closed beats
      // leaving the player on a spinner forever.
      const resolved = await resolvePlayableAuth().catch(() => null);
      if (cancelled) return;
      if (resolved && resolved.status === "authenticated") {
        setState(resolved);
        return;
      }
      window.location.replace(signInUrl(publicGamePath(routerPath)));
    })();

    return () => {
      cancelled = true;
    };
  }, [state.status, routerPath]);

  if (state.status === "authenticated") return <>{children}</>;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
    >
      <span
        aria-hidden="true"
        className="size-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/70"
      />
      <span>Checking your KruMath account…</span>
    </div>
  );
}
