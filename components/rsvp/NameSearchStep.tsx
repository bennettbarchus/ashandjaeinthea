"use client";

import type { SearchResult } from "@/types/rsvp";
import { ErrorText, StepHeading, TextField } from "./ui";

export function NameSearchStep({
  query,
  onQueryChange,
  results,
  isSearching,
  isSelecting,
  errorMessage,
  onSelect,
  supportEmail,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  /** True while the selected household's invitation is loading — distinct from isSearching so the label doesn't misleadingly say "Searching..." again after a result is picked. */
  isSelecting: boolean;
  errorMessage: string | null;
  onSelect: (householdId: string) => void;
  supportEmail: string;
}) {
  const showEmpty =
    !isSearching &&
    !isSelecting &&
    !errorMessage &&
    query.trim().length >= 3 &&
    results.length === 0;

  return (
    <div>
      <StepHeading
        eyebrow="Name Search"
        title="Find your invitation"
        description="Enter your first and last name."
        focusOnMount={false}
      />

      <TextField
        type="text"
        inputMode="text"
        autoComplete="name"
        placeholder="First and last name"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        aria-label="Your first and last name"
        autoFocus
      />

      <p className="mt-2 font-playfair text-xs text-sand">
        Enter at least 3 characters to search.
      </p>

      <ErrorText>{errorMessage}</ErrorText>

      <div className="mt-6 space-y-3" aria-live="polite">
        {isSelecting ? (
          <p className="font-playfair text-sm text-sand">Loading your invitation...</p>
        ) : isSearching ? (
          <p className="font-playfair text-sm text-sand">Searching...</p>
        ) : null}

        {showEmpty ? (
          <p className="font-playfair text-sm text-sand">
            We couldn&apos;t find an invitation matching that name.
          </p>
        ) : null}

        {results.map((result) => (
          <button
            key={result.householdId}
            type="button"
            onClick={() => onSelect(result.householdId)}
            className="flex w-full min-h-[64px] items-center justify-between border border-sand/50 bg-cream/50 px-5 py-4 text-left transition-colors hover:border-mocha focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mocha"
          >
            <span>
              <span className="block font-playfair text-base text-mocha">
                {result.maskedName}
                {result.location ? (
                  <span className="text-sand"> &middot; {result.location}</span>
                ) : null}
              </span>
              <span className="block font-playfair text-xs text-sand">
                Party of {result.partySize}
              </span>
            </span>
            <span aria-hidden="true" className="font-playfair text-sand">
              &rarr;
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8 text-center">
        {supportEmail ? (
          <a
            href={`mailto:${supportEmail}`}
            className="font-playfair text-sm text-sand underline decoration-sand/50 underline-offset-4 hover:text-mocha"
          >
            Can&apos;t find your invitation?
          </a>
        ) : (
          <p className="font-playfair text-sm text-sand">
            Can&apos;t find your invitation? Please contact the couple directly.
          </p>
        )}
      </div>
    </div>
  );
}
