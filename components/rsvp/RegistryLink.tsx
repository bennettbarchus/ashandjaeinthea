"use client";

export function RegistryLink({
  registryUrl,
  registryMessage,
  variant = "understated",
}: {
  registryUrl: string;
  registryMessage: string;
  variant?: "understated" | "closing";
}) {
  if (variant === "closing") {
    return (
      <div className="mt-10 border-t border-sand/30 pt-8 text-center">
        <p className="font-playfair text-sm leading-relaxed text-mocha/80">
          {registryMessage}
        </p>
        <a
          href={registryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-[44px] items-center justify-center border border-sand/60 px-6 py-2.5 text-sm font-medium uppercase tracking-[0.1em] text-mocha transition-colors hover:border-mocha focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mocha"
        >
          View Our Registry
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8 text-center">
      <a
        href={registryUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-playfair text-sm text-sand underline decoration-sand/50 underline-offset-4 transition-colors hover:text-mocha focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mocha"
      >
        Wedding Registry
      </a>
    </div>
  );
}
