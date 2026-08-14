"use client";

import type { Attendance, InvitationEventMeta } from "@/types/rsvp";
import { ChoiceButton, StepHeading } from "./ui";

export interface AttendanceGuestOption {
  id: string;
  displayName: string;
  attendance: Attendance | null;
}

function formatEventMeta(event: InvitationEventMeta): string {
  const parts = [event.eventDate, event.eventTime, event.location].filter(Boolean);
  return parts.join(" · ");
}

export function EventAttendanceStep({
  event,
  guests,
  onChange,
}: {
  event: InvitationEventMeta;
  guests: AttendanceGuestOption[];
  onChange: (guestId: string, attendance: Attendance) => void;
}) {
  const meta = formatEventMeta(event);

  return (
    <div>
      <StepHeading eyebrow="Event Attendance" title={event.eventName} description={meta || undefined} />

      <div className="space-y-6">
        {guests.map((guest) => (
          <div key={guest.id}>
            <p className="mb-3 font-playfair text-base text-mocha">
              Will {guest.displayName} attend?
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ChoiceButton
                selected={guest.attendance === "YES"}
                onClick={() => onChange(guest.id, "YES")}
              >
                Yes, happily
              </ChoiceButton>
              <ChoiceButton
                selected={guest.attendance === "NO"}
                onClick={() => onChange(guest.id, "NO")}
              >
                No, unable to attend
              </ChoiceButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
