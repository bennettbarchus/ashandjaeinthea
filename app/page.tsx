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
      <main className="flex min-h-screen items-center justify-center bg-[#F8F5F0] text-[#3B2F2F]">
        <p className="font-sans text-sm opacity-60">Loading…</p>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="min-h-screen bg-[#F8F5F0] px-6 text-[#3B2F2F]">
        <section className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col items-center justify-center py-12 text-center">
          <div className="mb-10 flex h-[76px] w-[76px] items-center justify-center rounded-full border border-[#3B2F2F]/15 bg-white/50 shadow-[0_18px_50px_rgba(59,47,47,0.06)]">
            <span className="font-serif text-[28px] leading-none tracking-[-0.04em]">
              A<span className="mx-1 text-[18px] italic opacity-60">&</span>J
            </span>
          </div>

          <p className="mb-5 font-sans text-[10px] uppercase tracking-[0.38em] opacity-60">
            Ashley + Jared
          </p>

          <h1 className="mb-7 font-serif text-[54px] leading-[0.95] tracking-[-0.035em]">
            Welcome
          </h1>

          <p className="mb-10 max-w-[320px] font-sans text-[14px] leading-7 opacity-70">
            Enter the password from your save the date to view wedding weekend
            details.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Password"
              className="h-14 w-full rounded-full border border-[#3B2F2F]/15 bg-white/55 px-6 text-center font-sans text-sm outline-none placeholder:text-[#3B2F2F]/35 focus:border-[#3B2F2F]/50"
            />

            {error && <p className="font-sans text-sm opacity-75">{error}</p>}

            <button className="h-14 w-full rounded-full bg-[#3B2F2F] font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-[#F8F5F0] shadow-[0_14px_34px_rgba(59,47,47,0.16)]">
              Enter
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F5F0] px-5 py-10 text-[#3B2F2F] md:px-10 md:py-16">
      <div className="mx-auto w-full max-w-[560px]">
        <header className="text-center">
          <div className="mx-auto mb-9 flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#3B2F2F]/15 bg-white/50 shadow-[0_18px_50px_rgba(59,47,47,0.06)] md:mb-10 md:h-20 md:w-20">
            <span className="font-serif text-[27px] leading-none tracking-[-0.04em] md:text-3xl">
              A<span className="mx-1 text-[17px] italic opacity-60">&</span>J
            </span>
          </div>

          <p className="mb-6 font-sans text-[10px] uppercase tracking-[0.42em] opacity-55 md:mb-7">
            Atlanta, Georgia
          </p>

          <h1 className="font-serif text-[56px] leading-[0.9] tracking-[-0.045em] md:text-[84px]">
            Ashley
            <span className="my-1 block text-[22px] italic leading-none tracking-normal opacity-45 md:my-2 md:text-[28px]">
              &
            </span>
            Jared
          </h1>

          <div className="mx-auto my-8 h-px w-12 bg-[#3B2F2F]/18 md:my-11 md:w-16" />

          <p className="font-sans text-[10px] uppercase tracking-[0.32em] opacity-55">
            Wedding Weekend
          </p>

          <p className="mt-4 font-serif text-[27px] leading-tight tracking-[-0.02em] md:mt-5 md:text-[38px]">
            November 13–14, 2026
          </p>
        </header>

        <section className="mx-auto mt-16 max-w-[430px] text-center md:mt-24">
          <p className="font-serif text-[28px] leading-[1.12] tracking-[-0.025em] md:text-[40px]">
            We can’t wait to celebrate with you in Atlanta.
          </p>

          <p className="mx-auto mt-6 max-w-[390px] font-sans text-[14px] leading-7 opacity-68 md:mt-7 md:text-[15px]">
            To make planning easy, we’ve curated a few recommended places to
            stay for the weekend.
          </p>
        </section>

        <section className="mt-20 md:mt-28">
          <div className="mb-9 text-center md:mb-12">
            <p className="font-sans text-[10px] uppercase tracking-[0.38em] opacity-50">
              Stay
            </p>

            <h2 className="mt-4 font-serif text-[40px] leading-[0.98] tracking-[-0.04em] md:text-[54px]">
              Recommended Hotels
            </h2>

            <p className="mx-auto mt-5 max-w-[320px] font-sans text-[13px] leading-6 opacity-60 md:text-sm">
              Choose the option that fits your weekend best.
            </p>
          </div>

          <div className="space-y-5 md:space-y-6">
            {hotels.map((hotel) => (
              <a
                key={hotel.name}
                href={hotel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-[28px] border border-[#3B2F2F]/10 bg-white/72 p-6 text-left shadow-[0_14px_40px_rgba(59,47,47,0.045)] transition hover:border-[#3B2F2F]/25 md:rounded-[32px] md:p-7"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.24em] opacity-50">
                      {hotel.tier} · {hotel.label}
                    </p>

                    <h3 className="font-serif text-[28px] leading-[1.02] tracking-[-0.025em] md:text-[34px]">
                      {hotel.name}
                    </h3>
                  </div>

                  <p className="shrink-0 rounded-full border border-[#3B2F2F]/10 bg-[#F8F5F0]/60 px-3 py-1 font-sans text-[11px] opacity-60">
                    {hotel.time}
                  </p>
                </div>

                <p className="max-w-[420px] font-sans text-[13px] leading-6 opacity-68 md:text-sm">
                  {hotel.description}
                </p>

                <div className="mt-6 flex h-12 items-center justify-center rounded-full bg-[#3B2F2F] font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-[#F8F5F0] shadow-[0_10px_22px_rgba(59,47,47,0.12)] md:mt-7">
                  Book Your Stay
                </div>
              </a>
            ))}
          </div>
        </section>

        <footer className="mx-auto mt-24 max-w-[380px] pb-12 text-center md:mt-32 md:pb-16">
          <div className="mx-auto mb-8 h-px w-12 bg-[#3B2F2F]/18 md:mb-9" />

          <p className="font-serif text-[28px] leading-tight tracking-[-0.02em] md:text-[34px]">
            More details to come.
          </p>

          <p className="mt-5 font-sans text-[13px] leading-6 opacity-60 md:text-sm">
            For now, book your stay and save the weekend. We’ll share additional
            wedding details soon.
          </p>
        </footer>
      </div>
    </main>
  );
}

