"use client";

import type { InvitationEventMeta } from "@/types/rsvp";
import { ChoiceButton, StepHeading } from "./ui";

export interface MealGuestOption {
  id: string;
  displayName: string;
  mealChoice: string;
}

export function MealSelectionStep({
  event,
  guests,
  mealOptions,
  onChange,
}: {
  event: InvitationEventMeta;
  guests: MealGuestOption[];
  mealOptions: string[];
  onChange: (guestId: string, mealChoice: string) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Reception Entrée"
        title={`Entrée selection — ${event.eventName}`}
        description="Choose one entrée for each guest."
      />

      <div className="space-y-6">
        {guests.map((guest) => (
          <div key={guest.id}>
            <p className="mb-3 font-lora text-base text-espresso">{guest.displayName}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {mealOptions.map((option) => (
                <ChoiceButton
                  key={option}
                  selected={guest.mealChoice === option}
                  onClick={() => onChange(guest.id, option)}
                >
                  {option}
                </ChoiceButton>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
