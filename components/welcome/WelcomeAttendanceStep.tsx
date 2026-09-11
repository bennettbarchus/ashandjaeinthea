"use client";

import type { Attendance, InvitationEventMeta } from "@/types/rsvp";
import { ChoiceButton, StepHeading } from "@/components/rsvp/ui";

export interface WelcomeAttendanceGuest {
  id: string;
  displayName: string;
  attendance: Attendance | null;
}

function formatEventMeta(event: InvitationEventMeta): string {
  return [event.eventDate, event.eventTime, event.location].filter(Boolean).join(" · ");
}

/**
 * The single attendance question for the Friday event. Kept separate from
 * the portal's EventAttendanceStep so the copy can be event-specific
 * ("joining us Friday evening" rather than the generic "attend?"), while
 * sharing the same ui.tsx primitives so it looks identical.
 */
export function WelcomeAttendanceStep({
  event,
  guests,
  onChange,
}: {
  event: InvitationEventMeta;
  guests: WelcomeAttendanceGuest[];
  onChange: (guestId: string, attendance: Attendance) => void;
}) {
  const meta = formatEventMeta(event);

  return (
    <div>
      <StepHeading
        eyebrow="Welcome Celebration"
        title={event.eventName}
        description={meta || undefined}
      />

      <div className="space-y-6">
        {guests.map((guest) => (
          <div key={guest.id}>
            <p className="mb-3 font-playfair text-base text-mocha">
              Will {guest.displayName} be joining us Friday evening?
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ChoiceButton
                selected={guest.attendance === "YES"}
                onClick={() => onChange(guest.id, "YES")}
              >
                Yes, joyfully
              </ChoiceButton>
              <ChoiceButton
                selected={guest.attendance === "NO"}
                onClick={() => onChange(guest.id, "NO")}
              >
                No, sadly can&apos;t make it
              </ChoiceButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
