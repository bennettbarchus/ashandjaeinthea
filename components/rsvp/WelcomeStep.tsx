"use client";

import { PrimaryButton, StepHeading } from "./ui";
import { RegistryLink } from "./RegistryLink";

export function WelcomeStep({
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
        eyebrow="RSVP"
        title="We're so excited to celebrate with you."
        description="Enter your name to find your invitation."
      />
      <PrimaryButton onClick={onBegin}>Begin</PrimaryButton>
      <RegistryLink registryUrl={registryUrl} registryMessage={registryMessage} />
    </div>
  );
}
