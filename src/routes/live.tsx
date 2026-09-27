import { createFileRoute } from "@tanstack/react-router";

import { AuthGate } from "@/components/AuthGate";
import { RaceGame } from "@/components/RaceGame";
import { requirePlayableUser } from "@/lib/requirePlayableUser";

const title = "KruMath Math Racer — Live";
const description =
  "Race live: solve math by steering into the correct answer lane and boost past your rivals.";

export const Route = createFileRoute("/live")({
  beforeLoad: async ({ location }) => {
    return { auth: await requirePlayableUser(location.pathname) };
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: QuickBrainRacerLive,
});

function QuickBrainRacerLive() {
  const { auth } = Route.useRouteContext();

  return (
    <main>
      <h1 className="sr-only">KruMath Math Racer Live</h1>
      <AuthGate initial={auth} routerPath="/live">
        <RaceGame mode="live" />
      </AuthGate>
    </main>
  );
}
