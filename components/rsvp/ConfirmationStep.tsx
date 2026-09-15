"use client";

import { formatDeadline } from "@/lib/deadline";
import { StepHeading } from "./ui";
import { RegistryLink } from "./RegistryLink";

export function ConfirmationStep({
  confirmationMessage,
  rsvpDeadline,
  registryUrl,
  registryMessage,
}: {
  confirmationMessage: string;
  rsvpDeadline: string | null;
  registryUrl: string;
  registryMessage: string;
}) {
  // Rendered from the Settings tab value, which is a machine-readable
  // timestamp — formatted here so guests read a date, not an ISO string.
  const deadline = formatDeadline(rsvpDeadline);

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
