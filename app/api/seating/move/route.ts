import { NextResponse } from "next/server";
import { z } from "zod";
import { MoveError, moveGuest } from "@/lib/seating";
import { isAuthorized } from "@/lib/seating-auth";

const moveSchema = z
  .object({
    fromType: z.enum(["seat", "parking"]),
    fromId: z.number().int().positive(),
    toType: z.enum(["seat", "parking"]),
    // Optional only when parking a guest: the server picks the first free
    // parking row so two people clicking "park" don't race for the same one.
    toId: z.number().int().positive().optional(),
  })
  .refine((value) => value.toType === "parking" || value.toId !== undefined, {
    message: "A destination seat is required.",
    path: ["toId"],
  });

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = moveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  try {
    const result = await moveGuest(parsed.data);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof MoveError) {
      // Expected conflicts (destination taken, source already empty) —
      // the client shows these to Ashley and refreshes rather than retrying.
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(
      "Seating move failed:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "Could not save that move." },
      { status: 500 }
    );
  }
}
