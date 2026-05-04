"use client";

import { useEffect, useState } from "react";

const PASSWORD = "celebrate2026";

const hotels = [
  {
    tier: "$$$",
    label: "Venue Stay",
    name: "The Forth Hotel",
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

function Monogram() {
  return (
    <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#3B2F2F]/15 bg-white/90 shadow-[0_18px_50px_rgba(59,47,47,0.06)]">
      <span className="font-serif text-[28px] leading-none tracking-[-0.04em]">
        A<span className="mx-1 text-[18px] italic opacity-[0.55]">&</span>J
      </span>
    </div>
  );
}

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
        <p className="font-sans text-sm opacity-60">Loading…</p>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(248,245,240,1)_55%)] px-6 py-12 text-[#3B2F2F] md:flex md:items-center md:justify-center md:px-10 md:py-16">
        <section className="mx-auto w-full max-w-[480px] rounded-[38px] border border-[#3B2F2F]/10 bg-white/95 p-8 shadow-[0_30px_80px_rgba(59,47,47,0.08)] backdrop-blur-sm text-center md:p-12">
          <Monogram />

          <p className="mt-8 font-sans text-[10px] uppercase tracking-[0.38em] opacity-60">
            Ashley + Jared
          </p>

          <h1 className="mt-6 font-serif text-[52px] leading-[0.92] tracking-[-0.035em] md:text-[62px]">
            Welcome
          </h1>

          <p className="mx-auto mt-5 max-w-[330px] font-sans text-[15px] leading-7 text-[#4f433e] md:text-[16px]">
            Enter the password from your save the date to view wedding weekend
            details.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Password"
              className="h-14 w-full rounded-full border border-[#3B2F2F]/10 bg-[#f5f1ed] px-6 text-center font-sans text-sm text-[#3B2F2F] outline-none placeholder:text-[#3B2F2F]/40 focus:border-[#3B2F2F]/30 focus:ring-2 focus:ring-[#3B2F2F]/10"
            />

            {error && <p className="text-sm text-[#8c6f62]">{error}</p>}

            <button className="h-14 w-full rounded-full bg-[#3B2F2F] font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-[#F8F5F0] shadow-[0_12px_30px_rgba(59,47,47,0.15)] transition hover:bg-[#2a2423]">
              Enter
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#F8F5F0] px-5 py-10 text-[#3B2F2F] md:flex md:justify-center md:px-10 md:py-16">
      <div className="mx-auto w-full max-w-[720px]">
        <header className="text-center">
          <Monogram />

          <p className="mt-10 font-sans text-[10px] uppercase tracking-[0.42em] opacity-[0.55]">
            Atlanta, Georgia
          </p>

          <h1 className="mt-6 font-serif text-[64px] leading-[0.88] tracking-[-0.045em] md:text-[92px]">
            Ashley
            <span className="my-2 block text-[24px] italic leading-none tracking-normal opacity-[0.45] md:text-[30px]">
              &
            </span>
            Jared
          </h1>

          <div className="mx-auto my-9 h-px w-14 bg-[#3B2F2F]/18 md:my-12" />

          <p className="font-sans text-[10px] uppercase tracking-[0.32em] opacity-[0.55]">
            Wedding Weekend
          </p>

          <p className="mt-4 font-serif text-[31px] leading-tight tracking-[-0.02em] md:text-[42px]">
            November 13–14, 2026
          </p>
        </header>

        <section className="mx-auto mt-[4.5rem] max-w-[500px] text-center md:mt-24">
          <p className="font-serif text-[31px] leading-[1.08] tracking-[-0.025em] md:text-[44px]">
            We can’t wait to celebrate with you in Atlanta.
          </p>

          <p className="mx-auto mt-6 max-w-[420px] font-sans text-[14px] leading-7 text-[#4f433e] md:text-[15px]">
            To make planning easy, we’ve curated a few recommended places to
            stay for the weekend.
          </p>
        </section>

        <section className="mt-20 md:mt-28">
          <div className="mb-10 text-center md:mb-12">
            <p className="font-sans text-[10px] uppercase tracking-[0.38em] opacity-50">
              Stay
            </p>

            <h2 className="mt-4 font-serif text-[44px] leading-[0.98] tracking-[-0.04em] md:text-[58px]">
              Recommended Hotels
            </h2>

            <p className="mx-auto mt-5 max-w-[340px] font-sans text-[13px] leading-6 opacity-60 md:text-sm">
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
                className="block rounded-[28px] border border-[#3B2F2F]/10 bg-white/90 p-6 text-left shadow-[0_14px_40px_rgba(59,47,47,0.07)] transition duration-200 hover:-translate-y-0.5 hover:border-[#3B2F2F]/20 md:rounded-[32px] md:p-7"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.24em] opacity-50">
                      {hotel.tier} · {hotel.label}
                    </p>

                    <h3 className="font-serif text-[30px] leading-[1.02] tracking-[-0.025em] md:text-[36px]">
                      {hotel.name}
                    </h3>
                  </div>

                  <p className="shrink-0 rounded-full border border-[#3B2F2F]/10 bg-[#F8F5F0]/60 px-3 py-1 font-sans text-[11px] opacity-60">
                    {hotel.time}
                  </p>
                </div>

                <p className="max-w-[430px] font-sans text-[13px] leading-6 text-[#4f433e] md:text-sm">
                  {hotel.description}
                </p>

                <div className="mt-6 flex h-12 items-center justify-center rounded-full bg-[#3B2F2F] font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-[#F8F5F0] shadow-[0_10px_22px_rgba(59,47,47,0.12)] md:mt-7">
                  Book Your Stay
                </div>
              </a>
            ))}
          </div>
        </section>

        <footer className="mx-auto mt-24 max-w-[390px] pb-12 text-center md:mt-32 md:pb-16">
          <div className="mx-auto mb-8 h-px w-14 bg-[#3B2F2F]/18" />

          <p className="font-serif text-[30px] leading-tight tracking-[-0.02em] md:text-[36px]">
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
