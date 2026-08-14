"use client";

import type { SearchResult } from "@/types/rsvp";
import { ErrorText, StepHeading, TextField } from "./ui";

export function NameSearchStep({
  query,
  onQueryChange,
  results,
  isSearching,
  errorMessage,
  onSelect,
  supportEmail,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  errorMessage: string | null;
  onSelect: (householdId: string) => void;
  supportEmail: string;
}) {
  const showEmpty =
    !isSearching && !errorMessage && query.trim().length >= 3 && results.length === 0;

  return (
    <div>
      <StepHeading
        eyebrow="Screen 2 of 10"
        title="Find your invitation"
        description="Enter your first and last name."
      />

      <TextField
        type="text"
        inputMode="text"
        autoComplete="name"
        placeholder="First and last name"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        aria-label="Your first and last name"
      />

      <p className="mt-2 font-lora text-xs text-taupe">
        Enter at least 3 characters to search.
      </p>

      <ErrorText>{errorMessage}</ErrorText>

      <div className="mt-6 space-y-3" aria-live="polite">
        {isSearching ? (
          <p className="font-lora text-sm text-taupe">Searching...</p>
        ) : null}

        {showEmpty ? (
          <p className="font-lora text-sm text-taupe">
            We couldn&apos;t find an invitation matching that name.
          </p>
        ) : null}

        {results.map((result) => (
          <button
            key={result.householdId}
            type="button"
            onClick={() => onSelect(result.householdId)}
            className="flex w-full min-h-[64px] items-center justify-between rounded-2xl border border-taupe/50 bg-white/40 px-5 py-4 text-left transition-colors hover:border-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <span>
              <span className="block font-lora text-base text-espresso">
                {result.maskedName}
                {result.location ? (
                  <span className="text-taupe"> &middot; {result.location}</span>
                ) : null}
              </span>
              <span className="block font-lora text-xs text-taupe">
                Party of {result.partySize}
              </span>
            </span>
            <span aria-hidden="true" className="font-lora text-taupe">
              &rarr;
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8 text-center">
        {supportEmail ? (
          <a
            href={`mailto:${supportEmail}`}
            className="font-lora text-sm text-taupe underline decoration-taupe/50 underline-offset-4 hover:text-espresso"
          >
            Can&apos;t find your invitation?
          </a>
        ) : (
          <p className="font-lora text-sm text-taupe">
            Can&apos;t find your invitation? Please contact the couple directly.
          </p>
        )}
      </div>
    </div>
  );
}
