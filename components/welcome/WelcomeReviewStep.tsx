"use client";

import type { Attendance } from "@/types/rsvp";
import { ErrorText, PrimaryButton, StepHeading } from "@/components/rsvp/ui";

export interface WelcomeReviewGuest {
  id: string;
  displayName: string;
  attendance: Attendance | null;
  dietaryNotes: string;
}

export function WelcomeReviewStep({
  eventName,
  guests,
  isSubmitting,
  errorMessage,
  onSubmit,
}: {
  eventName: string;
  guests: WelcomeReviewGuest[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: () => void;
}) {
  const dietaryEntries = guests.filter(
    (g) => g.attendance === "YES" && g.dietaryNotes.trim().length > 0
  );

  return (
    <div>
      <StepHeading
        eyebrow="Review"
        title="Here's what we have."
        description="Please look this over before you send it to us."
      />

      <div className="space-y-6">
        <div className="border border-sand/40 bg-cream/50 p-5">
          <p className="mb-2 font-playfair text-lg text-mocha">{eventName}</p>
          <ul className="space-y-1">
            {guests.map((guest) => (
              <li key={guest.id} className="font-playfair text-sm text-mocha/90">
                {guest.displayName} &mdash;{" "}
                {guest.attendance === "YES" ? "Joining us" : "Not able to join"}
              </li>
            ))}
          </ul>
        </div>

        {dietaryEntries.length > 0 ? (
          <div className="border border-sand/40 bg-cream/50 p-5">
            <p className="mb-2 font-playfair text-lg text-mocha">Dietary Notes</p>
            <ul className="space-y-1">
              {dietaryEntries.map((guest) => (
                <li key={guest.id} className="font-playfair text-sm text-mocha/90">
                  {guest.displayName}: {guest.dietaryNotes}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <ErrorText>{errorMessage}</ErrorText>

      <div className="mt-8">
        <PrimaryButton onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Our Response"}
        </PrimaryButton>
      </div>
    </div>
  );
}
