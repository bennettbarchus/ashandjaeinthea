"use client";

import { ChoiceButton, StepHeading } from "./ui";

export interface SteakGuestOption {
  id: string;
  displayName: string;
  steakTemperature: string;
}

export function SteakTemperatureStep({
  guests,
  steakOptions,
  onChange,
}: {
  guests: SteakGuestOption[];
  steakOptions: string[];
  onChange: (guestId: string, temperature: string) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Steak Temperature"
        title="How would you like your steak prepared?"
      />

      <div className="space-y-6">
        {guests.map((guest) => (
          <div key={guest.id}>
            <p className="mb-3 font-lora text-base text-espresso">{guest.displayName}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {steakOptions.map((option) => (
                <ChoiceButton
                  key={option}
                  selected={guest.steakTemperature === option}
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
