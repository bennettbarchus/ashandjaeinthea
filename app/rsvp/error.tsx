"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function RsvpError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("RSVP route error:", error.message);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-ivory px-6 py-10 text-center text-espresso sm:max-w-lg">
      <h1 className="font-serif text-2xl text-espresso">Something went wrong.</h1>
      <p className="mt-3 font-lora text-sm text-espresso/80">
        We couldn&apos;t load the RSVP portal. Please try again in a moment.
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full border border-taupe/60 px-6 py-2.5 text-sm font-medium uppercase tracking-[0.1em] text-espresso transition-colors hover:border-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        Try again
      </button>
    </div>
  );
}
