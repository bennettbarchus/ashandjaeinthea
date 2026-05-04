"use client";

import { useEffect, useState } from "react";

const PASSWORD = "celebrate2026";

const hotels = [
  {
    tier: "$$$",
    label: "Venue Stay",
    name: "Hotel One",
    time: "Wedding venue",
    description:
      "The most seamless option for guests who want to stay where the weekend unfolds.",
    href: "https://google.com/",
  },
  {
    tier: "$$",
    label: "Midtown Social",
    name: "Hotel Two",
    time: "Nearby",
    description:
      "A chic, social Midtown Atlanta option with easy access to the celebration.",
    href: "https://google.com/",
  },
  {
    tier: "$",
    label: "Downtown Easy",
    name: "Hotel Three",
    time: "Easy access",
    description:
      "An affordable and convenient downtown option for a smooth wedding weekend.",
    href: "https://google.com/",
  },
];

export default function Home() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setHasAccess(localStorage.getItem("weddingAccess") === "true");
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.trim() === PASSWORD) {
      localStorage.setItem("weddingAccess", "true");
      setHasAccess(true);
      setError("");
    } else {
      setError("Please check the password and try again.");
    }
  }

  if (hasAccess === null) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#F8F5F0] text-[#3B2F2F]">
        <p className="text-sm opacity-60">Loading…</p>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#F8F5F0] px-6 text-[#3B2F2F]">
        <section className="w-full max-w-[420px] text-center">
          <div className="mx-auto mb-10 flex h-20 w-20 items-center justify-center rounded-full border border-[#3B2F2F]/20 bg-white/50 shadow-[0_20px_60px_rgba(59,47,47,0.08)]">
            <span className="font-serif text-3xl">
              A<span className="mx-1 text-xl italic opacity-60">&</span>J
            </span>
          </div>

          <p className="mb-6 text-[11px] uppercase tracking-[0.42em] opacity-65">
            Ashley + Jared
          </p>

          <h1 className="mb-8 font-serif text-[64px] leading-[0.9] tracking-[-0.04em]">
            Welcome
          </h1>

          <p className="mx-auto mb-10 max-w-sm text-[15px] leading-7 opacity-75">
            Enter the password from your save the date to view wedding weekend
            details.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Password"
              className="h-14 w-full rounded-full border border-[#3B2F2F]/20 bg-white/50 px-6 text-center outline-none placeholder:text-[#3B2F2F]/40 focus:border-[#3B2F2F]"
            />

            {error && <p className="text-sm opacity-80">{error}</p>}

            <button className="h-14 w-full rounded-full bg-[#3B2F2F] text-xs font-medium uppercase tracking-[0.14em] text-[#F8F5F0] shadow-[0_16px_36px_rgba(59,47,47,0.16)]">
              Enter
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#F8F5F0] px-5 py-10 text-[#3B2F2F] md:flex md:items-start md:justify-center md:px-10 md:py-16">
      <section className="mx-auto w-full max-w-[560px]">
        {/* HEADER */}
        <header className="text-center">
          <div className="mx-auto mb-10 flex h-20 w-20 items-center justify-center rounded-full border border-[#3B2F2F]/20 bg-white/50 shadow-[0_20px_60px_rgba(59,47,47,0.08)]">
            <span className="font-serif text-3xl">
              A<span className="mx-1 text-xl italic opacity-60">&</span>J
            </span>
          </div>

          <p className="mb-8 text-[11px] uppercase tracking-[0.42em] opacity-65">
            Atlanta, Georgia
          </p>

          <h1 className="font-serif text-[74px] leading-[0.86] tracking-[-0.045em] md:text-[88px]">
            Ashley
            <span className="my-3 block text-2xl italic tracking-normal opacity-45">
              &
            </span>
            Jared
          </h1>

          <div className="mx-auto my-10 h-px w-16 bg-[#3B2F2F]/20" />

          <p className="text-[11px] uppercase tracking-[0.3em] opacity-60">
            Wedding Weekend
          </p>

          <p className="mt-4 font-serif text-[30px] leading-tight tracking-[-0.02em] md:text-[34px]">
            November 13–14, 2026
          </p>
        </header>

        {/* WELCOME */}
        <section className="mx-auto mt-20 max-w-[440px] text-center">
          <p className="font-serif text-[28px] leading-tight tracking-[-0.02em]">
            We can’t wait to celebrate with you in Atlanta.
          </p>

          <p className="mt-6 text-[15px] leading-7 opacity-75">
            To make planning easy, we’ve curated a few recommended places to
            stay for the weekend.
          </p>
        </section>

        {/* HOTELS */}
        <section className="mt-24">
          <div className="mb-10 text-center">
            <p className="text-[11px] uppercase tracking-[0.35em] opacity-55">
              Stay
            </p>

            <h2 className="mt-4 font-serif text-[42px] leading-tight tracking-[-0.03em]">
              Recommended Hotels
            </h2>

            <p className="mx-auto mt-4 max-w-xs text-sm leading-6 opacity-65">
              Choose the option that fits your weekend best.
            </p>
          </div>

          <div className="space-y-5">
            {hotels.map((hotel) => (
              <a
                key={hotel.name}
                href={hotel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-[30px] border border-[#3B2F2F]/10 bg-white/65 p-6 text-left shadow-[0_18px_50px_rgba(59,47,47,0.06)] transition hover:border-[#3B2F2F]/25"
              >
                <div className="mb-5 flex items-start justify-between gap-5">
                  <div>
                    <p className="mb-2 text-[11px] uppercase tracking-[0.24em] opacity-55">
                      {hotel.tier} · {hotel.label}
                    </p>

                    <h3 className="font-serif text-[30px] leading-tight tracking-[-0.02em]">
                      {hotel.name}
                    </h3>
                  </div>

                  <p className="rounded-full border border-[#3B2F2F]/10 px-3 py-1 text-xs opacity-65">
                    {hotel.time}
                  </p>
                </div>

                <p className="text-sm leading-6 opacity-72">
                  {hotel.description}
                </p>

                <div className="mt-6 flex h-12 items-center justify-center rounded-full bg-[#3B2F2F] text-xs font-medium uppercase tracking-[0.14em] text-[#F8F5F0]">
                  Book Your Stay
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* CLOSING */}
        <footer className="mx-auto mt-24 max-w-sm text-center">
          <div className="mx-auto mb-8 h-px w-16 bg-[#3B2F2F]/20" />

          <p className="font-serif text-2xl leading-tight">
            More details to come.
          </p>

          <p className="mt-4 text-sm leading-6 opacity-65">
            For now, book your stay and save the weekend. We’ll share additional
            wedding details soon.
          </p>
        </footer>
      </section>
    </main>
  );
}