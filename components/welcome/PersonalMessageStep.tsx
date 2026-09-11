"use client";

import { Divider, Eyebrow } from "@/components/rsvp/ui";
import { useEffect, useRef } from "react";

/**
 * A note from the couple to this specific household. Rendered only when
 * the household's `personal_message` is non-empty.
 *
 * Deliberately quieter than the other steps: no StepHeading, no eyebrow
 * rule competing with the text, generous vertical air, everything
 * centered. The La Belle Aurore flourish carries the intimacy while the
 * message itself stays in Playfair italic, which holds up at any length
 * and for guests of all ages — the same reasoning already documented on
 * StepHeading's `flourish` prop.
 */
export function PersonalMessageStep({ message }: { message: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Match the rest of the flow: move focus to this screen on mount so a
  // screen reader announces it and keyboard focus isn't stranded on body.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col items-center py-10 text-center sm:py-16">
      <Eyebrow>A Note For You</Eyebrow>

      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-belleaurore text-4xl leading-tight text-mocha outline-none sm:text-5xl"
      >
        Ashley &amp; Jared
      </h1>

      <Divider className="my-8" />

      <p className="max-w-prose whitespace-pre-line font-playfair text-lg italic leading-loose text-mocha/90 sm:text-xl">
        {message}
      </p>

      <Divider className="mt-10" />
    </div>
  );
}
