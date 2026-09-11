"use client";

import { useEffect, useRef, useState } from "react";
import { StepHeading } from "./ui";

/**
 * Where the ceremony inspiration image might live, tried in order.
 *
 * The image is committed to the repo separately from this code, so the
 * component can't assume it is there yet. /images/ is where the welcome
 * illustration actually landed; the bare path is the one the brief named.
 */
const INSPIRATION_SRCS = [
  "/images/ceremony_inspiration.png",
  "/ceremony_inspiration.png",
];

/**
 * Black-tie dress code for the ceremony, shown in the /rsvp flow to guests
 * invited to that event.
 *
 * Mirrors the layout of components/welcome/DressCodeStep, deliberately as a
 * separate component rather than a shared one: that screen is part of the
 * standalone /welcome flow and is meant to stay untouched.
 */
export function CeremonyDressCodeStep() {
  const [srcIndex, setSrcIndex] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const src = INSPIRATION_SRCS[srcIndex];
  const allFailed = srcIndex >= INSPIRATION_SRCS.length;

  function tryNextSrc() {
    setSrcIndex((i) => i + 1);
  }

  // The <img>'s own error event fires while the server-rendered HTML is still
  // parsing — before React hydrates and attaches onError — so a missing file
  // would otherwise show the browser's broken-image icon instead of advancing
  // to the placeholder. Re-check the decoded state on mount: complete with
  // zero natural width means that load already failed.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) tryNextSrc();
  }, []);

  return (
    <div>
      <StepHeading
        eyebrow="Wedding Ceremony"
        title="Dress Code"
        description="We invite you to join us in black tie for our wedding ceremony. Come dressed to impress — your tuxes and floor length gowns."
      />

      <figure className="my-10">
        {allFailed ? (
          <div
            role="img"
            aria-label="Ceremony dress code inspiration image, coming soon"
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
            alt="Inspiration for black tie attire"
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
