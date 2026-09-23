import { PinGate } from "@/components/seating/PinGate";

/**
 * Internal seating tool. The page itself is a Server Component (so the
 * layout's metadata export stays legal) and holds no data: everything is
 * read client-side from /api/seating/data behind the PIN, which keeps the
 * sheet's contents out of the HTML for anyone who never unlocks.
 */
export default function SeatingPage() {
  return <PinGate />;
}
