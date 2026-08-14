"use client";

import type { InvitationGuest } from "@/types/rsvp";
import { ErrorText, FieldLabel, PrimaryButton, SecondaryButton, StepHeading, TextField } from "./ui";

export function HouseholdConfirmStep({
  householdName,
  guests,
  plusOneNames,
  onPlusOneNameChange,
  onConfirm,
  onNotMyParty,
  isLoading,
  errorMessage,
}: {
  householdName: string;
  guests: InvitationGuest[];
  plusOneNames: Record<string, string>;
  onPlusOneNameChange: (guestId: string, value: string) => void;
  onConfirm: () => void;
  onNotMyParty: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Screen 3 of 10"
        title="We found your invitation."
        description="Is this your party?"
      />

      <div className="space-y-3">
        {guests.map((guest) => (
          <div
            key={guest.id}
            className="rounded-2xl border border-taupe/40 bg-white/40 px-5 py-4"
          >
            {guest.isPlusOne && guest.plusOneNameEditable ? (
              <div>
                <FieldLabel htmlFor={`plusone-${guest.id}`}>Guest name</FieldLabel>
                <TextField
                  id={`plusone-${guest.id}`}
                  type="text"
                  autoComplete="name"
                  placeholder={guest.displayName}
                  value={plusOneNames[guest.id] ?? ""}
                  onChange={(e) => onPlusOneNameChange(guest.id, e.target.value)}
                />
              </div>
            ) : (
              <p className="font-lora text-base text-espresso">{guest.displayName}</p>
            )}
          </div>
        ))}
      </div>

      <ErrorText>{errorMessage}</ErrorText>

      <div className="mt-8 space-y-3">
        <PrimaryButton onClick={onConfirm} disabled={isLoading}>
          {isLoading ? "Please wait..." : "Yes, this is my party"}
        </PrimaryButton>
        <SecondaryButton onClick={onNotMyParty} className="w-full" disabled={isLoading}>
          This isn&apos;t my party
        </SecondaryButton>
      </div>

      <p className="mt-4 text-center font-lora text-xs text-taupe">{householdName}</p>
    </div>
  );
}
