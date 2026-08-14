"use client";

import { StepHeading, TextAreaField } from "./ui";

export interface DietaryGuestOption {
  id: string;
  displayName: string;
  dietaryNotes: string;
}

export function DietaryNotesStep({
  guests,
  onChange,
}: {
  guests: DietaryGuestOption[];
  onChange: (guestId: string, notes: string) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Screen 8 of 10"
        title="Do you have any food allergies or dietary restrictions?"
        description="Optional — let us know so we can accommodate you."
      />

      <div className="space-y-6">
        {guests.map((guest) => (
          <div key={guest.id}>
            <p className="mb-2 font-lora text-sm text-taupe">{guest.displayName}</p>
            <TextAreaField
              value={guest.dietaryNotes}
              onChange={(e) => onChange(guest.id, e.target.value)}
              placeholder="None"
              aria-label={`Dietary notes for ${guest.displayName}`}
              maxLength={500}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
