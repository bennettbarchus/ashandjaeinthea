"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { SecondaryButton } from "@/components/rsvp/ui";

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
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-parchment px-6 py-10 text-center text-mocha sm:max-w-lg">
      <h1 className="font-playfair text-2xl font-medium text-mocha">Something went wrong.</h1>
      <p className="mt-3 font-playfair text-sm text-mocha/80">
        We couldn&apos;t load the RSVP portal. Please try again in a moment.
      </p>
      <SecondaryButton type="button" onClick={() => unstable_retry()} className="mt-6">
        Try again
      </SecondaryButton>
    </div>
  );
}
