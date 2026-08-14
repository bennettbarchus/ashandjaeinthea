"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-taupe">
      {children}
    </p>
  );
}

export function StepHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="mb-8">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1 className="font-playfair text-2xl leading-snug text-espresso sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 font-lora text-base leading-relaxed text-espresso/80">
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
      className={`inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-espresso px-8 py-3 text-sm font-medium uppercase tracking-[0.15em] text-ivory transition-colors motion-safe:duration-200 hover:bg-cinnamon focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:bg-taupe/50 disabled:text-ivory/70 ${className}`}
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
      className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-taupe/60 px-6 py-2.5 text-sm font-medium uppercase tracking-[0.1em] text-espresso transition-colors motion-safe:duration-200 hover:border-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
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
      className={`min-h-[52px] w-full rounded-2xl border px-5 py-3 text-left font-lora text-base transition-colors motion-safe:duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
        selected
          ? "border-espresso bg-espresso text-ivory"
          : "border-taupe/50 bg-white/40 text-espresso hover:border-espresso"
      } ${className}`}
    />
  );
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-[52px] w-full rounded-xl border border-taupe/60 bg-white/60 px-4 py-3 font-lora text-base text-espresso placeholder:text-taupe focus-visible:border-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${props.className ?? ""}`}
    />
  );
}

export function TextAreaField(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[120px] w-full rounded-xl border border-taupe/60 bg-white/60 px-4 py-3 font-lora text-base text-espresso placeholder:text-taupe focus-visible:border-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${props.className ?? ""}`}
    />
  );
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-taupe"
    >
      {children}
    </label>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-3 font-lora text-sm text-cinnamon">
      {children}
    </p>
  );
}

export function GuestCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-taupe/40 bg-white/40 p-5">
      {children}
    </div>
  );
}
