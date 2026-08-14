"use client";

import type { VerificationMethod } from "@/types/rsvp";
import { ErrorText, PrimaryButton, StepHeading, TextField } from "./ui";

const METHOD_COPY: Record<
  VerificationMethod,
  { label: string; placeholder: string; description: string }
> = {
  zip: {
    label: "ZIP code",
    placeholder: "30308",
    description: "Please enter the ZIP code associated with your invitation.",
  },
  phone_last_four: {
    label: "Last 4 digits of phone number",
    placeholder: "1234",
    description: "Please enter the last 4 digits of the phone number on your invitation.",
  },
  email: {
    label: "Email address",
    placeholder: "you@example.com",
    description: "Please enter the email address associated with your invitation.",
  },
};

export function VerificationStep({
  verificationOptions,
  method,
  onMethodChange,
  value,
  onValueChange,
  onSubmit,
  isLoading,
  errorMessage,
}: {
  verificationOptions: VerificationMethod[];
  method: VerificationMethod;
  onMethodChange: (method: VerificationMethod) => void;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}) {
  const copy = METHOD_COPY[method];

  return (
    <div>
      <StepHeading
        eyebrow="Screen 4 of 10"
        title="One more step"
        description={copy.description}
      />

      {verificationOptions.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Verification method">
          {verificationOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={method === opt}
              onClick={() => onMethodChange(opt)}
              className={`min-h-[40px] rounded-full border px-4 py-1.5 font-lora text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                method === opt
                  ? "border-espresso bg-espresso text-ivory"
                  : "border-taupe/50 text-espresso hover:border-espresso"
              }`}
            >
              {METHOD_COPY[opt].label}
            </button>
          ))}
        </div>
      ) : null}

      <TextField
        type="text"
        inputMode={method === "email" ? "email" : "numeric"}
        autoComplete={method === "email" ? "email" : "off"}
        placeholder={copy.placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        aria-label={copy.label}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
      />

      <ErrorText>{errorMessage}</ErrorText>

      <div className="mt-8">
        <PrimaryButton onClick={onSubmit} disabled={isLoading || !value.trim()}>
          {isLoading ? "Verifying..." : "Continue"}
        </PrimaryButton>
      </div>
    </div>
  );
}
