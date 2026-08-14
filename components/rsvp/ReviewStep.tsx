"use client";

import type { Attendance } from "@/types/rsvp";
import { ErrorText, PrimaryButton, StepHeading } from "./ui";

export interface ReviewEventAnswer {
  eventId: string;
  eventName: string;
  attendance: Attendance | null;
  mealChoice: string;
  steakTemperature: string;
}

export interface ReviewGuest {
  id: string;
  displayName: string;
  answers: ReviewEventAnswer[];
  dietaryNotes: string;
}

export function ReviewStep({
  guests,
  isSubmitting,
  errorMessage,
  onSubmit,
}: {
  guests: ReviewGuest[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: () => void;
}) {
  const eventOrder: { eventId: string; eventName: string }[] = [];
  for (const guest of guests) {
    for (const answer of guest.answers) {
      if (!eventOrder.some((e) => e.eventId === answer.eventId)) {
        eventOrder.push({ eventId: answer.eventId, eventName: answer.eventName });
      }
    }
  }

  const dietaryEntries = guests.filter((g) => g.dietaryNotes.trim().length > 0);

  return (
    <div>
      <StepHeading eyebrow="Screen 9 of 10" title="Review your RSVP" />

      <div className="space-y-6">
        {eventOrder.map((event) => (
          <div key={event.eventId} className="rounded-2xl border border-taupe/40 bg-white/40 p-5">
            <p className="mb-2 font-playfair text-lg text-espresso">{event.eventName}</p>
            <ul className="space-y-1">
              {guests.map((guest) => {
                const answer = guest.answers.find((a) => a.eventId === event.eventId);
                if (!answer) return null;
                const status = answer.attendance === "YES" ? "Attending" : "Not attending";
                const mealSuffix =
                  answer.attendance === "YES" && answer.mealChoice
                    ? ` — ${answer.mealChoice}${answer.steakTemperature ? `, ${answer.steakTemperature}` : ""}`
                    : "";
                return (
                  <li key={guest.id} className="font-lora text-sm text-espresso/90">
                    {guest.displayName} — {status}
                    {mealSuffix}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {dietaryEntries.length > 0 ? (
          <div className="rounded-2xl border border-taupe/40 bg-white/40 p-5">
            <p className="mb-2 font-playfair text-lg text-espresso">Dietary Notes</p>
            <ul className="space-y-1">
              {dietaryEntries.map((guest) => (
                <li key={guest.id} className="font-lora text-sm text-espresso/90">
                  {guest.displayName}: {guest.dietaryNotes}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <ErrorText>{errorMessage}</ErrorText>

      <div className="mt-8">
        <PrimaryButton onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit RSVP"}
        </PrimaryButton>
      </div>
    </div>
  );
}
