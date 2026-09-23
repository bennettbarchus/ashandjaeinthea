import { NextResponse } from "next/server";
import { getSeatingData } from "@/lib/seating";
import { isAuthorized } from "@/lib/seating-auth";

// No route-segment config needed: Route Handlers are uncached by default
// in Next 16 and only GET can opt in, which this one never does. The
// no-store header below is for the browser's own HTTP cache, since the
// client polls this endpoint every 60s.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const data = await getSeatingData();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error(
      "Seating data read failed:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "Could not read the seating chart." },
      { status: 500 }
    );
  }
}
