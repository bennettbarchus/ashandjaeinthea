"use client";

import { useEffect, useRef, useState } from "react";
import { StepHeading } from "./ui";

/**
 * Where the ceremony inspiration image might live, tried in order.
 *
 * /images/ is where the illustration actually landed; the bare path is the
 * one the brief originally named. If neither resolves, the component falls
 * back to a labelled placeholder rather than a broken image.
 *
 * .webp, not .png: the file is WebP data and was briefly committed under a
 * .png name. Browsers sniff the real format regardless, but the extension
 * drives the Content-Type Next serves it with, so the two should agree.
 */
const INSPIRATION_SRCS = [
  "/images/ceremony_inspiration.webp",
  "/ceremony_inspiration.webp",
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
