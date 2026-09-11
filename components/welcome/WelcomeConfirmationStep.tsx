"use client";

import { StepHeading } from "@/components/rsvp/ui";
import { RegistryLink } from "@/components/rsvp/RegistryLink";

export function WelcomeConfirmationStep({
  isAnyoneAttending,
  registryUrl,
  registryMessage,
}: {
  isAnyoneAttending: boolean;
  registryUrl: string;
  registryMessage: string;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Confirmation"
        flourish="Thank You"
        title={
          isAnyoneAttending
            ? "We can't wait to celebrate with you. See you Friday."
            : "Thank you for letting us know."
        }
      />

      <p className="font-playfair text-base leading-relaxed text-mocha/90">
        {isAnyoneAttending
          ? "Your response has been received. It means so much to us that you'll be there as the weekend begins."
          : "Your response has been received. We'll miss you Friday evening, and we're grateful you told us."}
      </p>

      <p className="mt-4 font-playfair text-sm text-sand">
        Need to make a change? Return to this page any time to update your response.
      </p>

      <RegistryLink
        registryUrl={registryUrl}
        registryMessage={registryMessage}
        variant="closing"
      />
    </div>
  );
}
