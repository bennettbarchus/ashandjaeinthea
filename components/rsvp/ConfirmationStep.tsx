"use client";

import { displayDeadline } from "@/lib/deadline";
import { StepHeading } from "./ui";
import { RegistryLink } from "./RegistryLink";

export function ConfirmationStep({
  confirmationMessage,
  rsvpDeadline,
  rsvpDeadlineDisplay,
  registryUrl,
  registryMessage,
}: {
  confirmationMessage: string;
  rsvpDeadline: string | null;
  rsvpDeadlineDisplay: string | null;
  registryUrl: string;
  registryMessage: string;
}) {
  // The published deadline, which is deliberately earlier than the technical
  // cutoff that app/api/rsvp/submit enforces. Guests see this one only.
  const deadline = displayDeadline({ rsvpDeadline, rsvpDeadlineDisplay });

  return (
    <div>
      <StepHeading
        eyebrow="Confirmation"
        flourish="Thank You"
        title="Your RSVP has been received."
      />

      <p className="font-playfair text-base leading-relaxed text-mocha/90">
        {confirmationMessage}
      </p>

      {deadline ? (
        <p className="mt-4 font-playfair text-sm text-sand">
          Please note the RSVP deadline is {deadline}.
        </p>
      ) : null}

      <p className="mt-4 font-playfair text-sm text-sand">
        Need to make a change? Return to this page any time before the deadline to update
        your RSVP.
      </p>

      <RegistryLink registryUrl={registryUrl} registryMessage={registryMessage} variant="closing" />
    </div>
  );
}
