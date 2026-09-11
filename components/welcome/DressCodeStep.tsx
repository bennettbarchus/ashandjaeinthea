"use client";

import { useEffect, useRef, useState } from "react";
import { StepHeading } from "@/components/rsvp/ui";

/**
 * Where the inspiration image might live, tried in order.
 *
 * Two paths because the image is committed to the repo separately from
 * this code: it currently sits in public/images/, while the original spec
 * named public/ directly. Trying both means the screen works wherever the
 * file actually ends up, and self-heals if it's moved later.
 */
const INSPIRATION_SRCS = [
  "/images/welcome_inspiration.png",
  "/welcome_inspiration.png",
];

/**
 * Dress code inspiration. Falls back to a labelled placeholder if none of
 * the candidate paths resolve, so the screen still reads correctly when
 * the image is missing entirely.
 */
export function DressCodeStep() {
  const [srcIndex, setSrcIndex] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const src = INSPIRATION_SRCS[srcIndex];
  const allFailed = srcIndex >= INSPIRATION_SRCS.length;

  function tryNextSrc() {
    setSrcIndex((i) => i + 1);
  }

  // The <img>'s own error event fires while the server-rendered HTML is
  // still parsing — before React hydrates and attaches onError — so a
  // missing file would otherwise show the browser's broken-image icon
  // instead of advancing. Re-check the decoded state on mount: complete
  // with zero natural width means that load already failed.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) tryNextSrc();
  }, []);

  return (
    <div>
      <StepHeading
        eyebrow="Welcome Celebration"
        title="Dress Code"
        description="We encourage you to celebrate with us dressed in Traditional Indian or African attire. As we blend our families and cultures together, we welcome our guests to enjoy the theme for the evening dressed in festive cultural attire."
      />

      <figure className="my-10">
        {allFailed ? (
          <div
            role="img"
            aria-label="Dress code inspiration image, coming soon"
            className="flex min-h-[240px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-sand/70 bg-cream/40 px-6 py-12 text-center"
          >
            <p className="font-cinzel text-[0.65rem] font-medium uppercase tracking-[0.25em] text-sand">
              Inspiration
            </p>
            <p className="mt-3 font-playfair text-sm italic text-sand">
              Image coming soon
            </p>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element --
             next/image needs intrinsic width/height at author time, and this
             file is committed separately so its dimensions aren't known here.
             A plain img keeps the real aspect ratio and lets onError walk the
             candidate paths above. */
          <img
            key={src}
            ref={imgRef}
            src={src}
            alt="Inspiration for traditional Indian and African attire"
            onError={tryNextSrc}
            className="w-full rounded-2xl border border-sand/30 object-cover shadow-sm"
          />
        )}
        <figcaption className="mt-4 text-center font-playfair text-xs italic text-sand">
          A little inspiration for the evening.
        </figcaption>
      </figure>
    </div>
  );
}
