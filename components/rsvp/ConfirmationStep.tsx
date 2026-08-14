"use client";

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
  return (
    <div>
      <StepHeading eyebrow="Screen 10 of 10" title="Your RSVP has been received." />

      <p className="font-lora text-base leading-relaxed text-espresso/90">
        {confirmationMessage}
      </p>

      {rsvpDeadline ? (
        <p className="mt-4 font-lora text-sm text-taupe">
          Please note the RSVP deadline is {rsvpDeadline}.
        </p>
      ) : null}

      <p className="mt-4 font-lora text-sm text-taupe">
        Need to make a change? Return to this page any time before the deadline to update
        your RSVP.
      </p>

      <RegistryLink registryUrl={registryUrl} registryMessage={registryMessage} variant="closing" />
    </div>
  );
}
