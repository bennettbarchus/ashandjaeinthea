"use client";

/**
 * Closing screen for the standalone Friday flow.
 *
 * The copy here deliberately treats the Welcome Celebration as a complete
 * event in itself. Guests reaching this screen are invited to Friday only,
 * so any mention of the ceremony, the reception, Saturday, or a "wedding
 * weekend" would point them at something they aren't part of. Keep it to
 * Friday evening.
 */

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
          ? "Your response has been received. We're so grateful you'll be with us Friday evening — this night is all ours, and we couldn't imagine it without you."
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
