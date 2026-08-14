"use client";

import { useEffect, useRef } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 font-cinzel text-[0.65rem] font-medium uppercase tracking-[0.35em] text-sand">
      {children}
    </p>
  );
}

/** Matches the homepage's `.divider` — a thin sand line fading at both edges. */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-px w-20 bg-gradient-to-r from-transparent via-sand to-transparent ${className}`}
    />
  );
}

export function StepHeading({
  eyebrow,
  flourish,
  title,
  description,
  focusOnMount = true,
}: {
  eyebrow?: string;
  /** Homepage-style La Belle Aurore script accent (e.g. "Ashley & Jared") — reserve for the Welcome/Confirmation bookends. Kept short; the actual heading below always stays in legible Playfair so the flow reads clearly for guests of all ages. */
  flourish?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /**
   * Moves keyboard focus (and the screen-reader announcement) to this
   * heading when the step mounts, so each screen change in the flow
   * doesn't strand focus on <body> — a real bug found in testing where
   * every transition otherwise required tabbing from the very top of the
   * page. Set to false on the two screens that autofocus their own single
   * input instead (name search, verification).
   */
  focusOnMount?: boolean;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mb-8">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      {flourish ? (
        <p className="mb-2 font-belleaurore text-4xl leading-tight text-mocha sm:text-5xl">
          {flourish}
        </p>
      ) : null}
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-playfair text-2xl font-medium leading-snug text-mocha outline-none sm:text-3xl"
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-3 font-playfair text-base leading-relaxed text-mocha/80">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function PrimaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-[52px] w-full items-center justify-center border border-mocha bg-transparent px-8 py-3 font-cinzel text-xs font-medium uppercase tracking-[0.25em] text-mocha transition-colors motion-safe:duration-300 hover:bg-mocha hover:text-cream active:bg-mocha active:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mocha disabled:cursor-not-allowed disabled:border-sand disabled:text-sand disabled:hover:bg-transparent disabled:hover:text-sand disabled:active:bg-transparent disabled:active:text-sand ${className}`}
    />
  );
}

export function SecondaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-[44px] items-center justify-center border border-sand px-6 py-2.5 font-cinzel text-xs font-medium uppercase tracking-[0.2em] text-mocha transition-colors motion-safe:duration-300 hover:border-mocha focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mocha disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    />
  );
}

export function ChoiceButton({
  selected,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...props}
      className={`min-h-[52px] w-full border px-5 py-3 text-left font-playfair text-base transition-colors motion-safe:duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mocha ${
        selected
          ? "border-mocha bg-mocha text-cream"
          : "border-sand/60 bg-cream/50 text-mocha hover:border-mocha"
      } ${className}`}
    />
  );
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-[52px] w-full border border-sand bg-cream/70 px-4 py-3 font-playfair text-base text-mocha placeholder:text-sand focus-visible:border-mocha focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mocha ${props.className ?? ""}`}
    />
  );
}

export function TextAreaField(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[120px] w-full border border-sand bg-cream/70 px-4 py-3 font-playfair text-base text-mocha placeholder:text-sand focus-visible:border-mocha focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mocha ${props.className ?? ""}`}
    />
  );
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block font-cinzel text-[0.65rem] font-medium uppercase tracking-[0.2em] text-sand"
    >
      {children}
    </label>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-3 font-playfair text-sm italic text-alert">
      {children}
    </p>
  );
}

export function GuestCard({ children }: { children: ReactNode }) {
  return (
    <div className="border border-sand/50 bg-cream/50 p-5">
      {children}
    </div>
  );
}
