"use client";

import { PrimaryButton, StepHeading } from "@/components/rsvp/ui";
import { RegistryLink } from "@/components/rsvp/RegistryLink";

export function WelcomeIntroStep({
  onBegin,
  registryUrl,
  registryMessage,
}: {
  onBegin: () => void;
  registryUrl: string;
  registryMessage: string;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Welcome Celebration"
        flourish="Ashley & Jared"
        title="You're invited to our Welcome Celebration."
        description="Enter your name to find your invitation."
      />
      <PrimaryButton onClick={onBegin}>Begin</PrimaryButton>
      <RegistryLink
        registryUrl={registryUrl}
        registryMessage={registryMessage}
        label="Our Registry"
      />
    </div>
  );
}
