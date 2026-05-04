"use client";

import { useEffect, useState } from "react";

const PASSWORD = "celebrate2026";

const hotels = [
  {
    tier: "$$$",
    label: "Venue Stay",
    name: "Hotel One",
    time: "Wedding venue",
    description: "The most seamless option for guests who want to stay where the weekend unfolds.",
    href: "https://google.com/",
  },
  {
    tier: "$$",
    label: "Midtown Social",
    name: "Hotel Two",
    time: "Nearby",
    description: "A chic, social Midtown Atlanta option with easy access to the celebration.",
    href: "https://google.com/",
  },
  {
    tier: "$",
    label: "Downtown Easy",
    name: "Hotel Three",
    time: "Easy access",
    description: "An affordable and convenient downtown option for a smooth wedding weekend.",
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
        <p className="text-sm opacity-60">Loading…</p>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#F8F5F0] px-6 py-10 text-[#3B2F2F]">
        <div className="absolute left-1/2 top-[-180px] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-[#B86F45]/20 blur-3xl" />
        <div className="absolute bottom-[-220px] right-[-160px] h-[420px] w-[420px] rounded-full bg-[#C7A35A]/14 blur-3xl" />

        <div className="relative mx-auto flex min-h-[85vh] max-w-md flex-col items-center justify-center text-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[#3B2F2F]/20 bg-white/35 shadow-[0_18px_50px_rgba(59,47,47,0.08)] backdrop-blur">
            <span className="font-serif text-3xl tracking-[-0.04em]">
              A<span className="mx-1 text-xl italic opacity-60">&</span>J
            </span>
          </div>

          <p className="mb-6 text-[11px] uppercase tracking-[0.45em] opacity-70">
            Ashley + Jared
          </p>

          <h1 className="mb-6 font-serif text-[64px] leading-[0.88] tracking-[-0.045em]">
            Welcome
          </h1>

          <p className="mb-10 max-w-sm text-[15px] leading-7 opacity-80">
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
              className="h-14 w-full rounded-full border border-[#3B2F2F]/20 bg-white/40 px-6 text-center text-base outline-none backdrop-blur placeholder:text-[#3B2F2F]/40 focus:border-[#3B2F2F]"
            />

            {error && <p className="text-sm opacity-80">{error}</p>}

            <button
              type="submit"
              className="h-14 w-full rounded-full bg-[#3B2F2F] px-6 text-sm font-medium uppercase tracking-[0.14em] text-[#F8F5F0] shadow-[0_16px_36px_rgba(59,47,47,0.20)] transition hover:bg-[#2D2424]"
            >
              Enter
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8F5F0] px-5 py-8 text-[#3B2F2F]">
      <div className="absolute left-[-140px] top-[-140px] h-[420px] w-[420px] rounded-full bg-[#B86F45]/18 blur-3xl" />
      <div className="absolute bottom-[-180px] right-[-160px] h-[460px] w-[460px] rounded-full bg-[#C7A35A]/14 blur-3xl" />
      <div className="absolute left-1/2 top-[42%] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-[#A99785]/10 blur-3xl" />

      <section className="relative mx-auto max-w-md">
        <div className="rounded-[38px] border border-[#3B2F2F]/10 bg-white/38 px-6 py-10 shadow-[0_26px_90px_rgba(59,47,47,0.10)] backdrop-blur">
          <div className="text-center">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[#3B2F2F]/20 bg-[#F8F5F0]/45 shadow-[0_18px_50px_rgba(59,47,47,0.08)]">
              <span className="font-serif text-3xl tracking-[-0.04em]">
                A<span className="mx-1 text-xl italic opacity-60">&</span>J
              </span>
            </div>

            <p className="mb-8 text-[11px] uppercase tracking-[0.45em] opacity-70">
              Atlanta, Georgia
            </p>

            <h1 className="font-serif text-[76px] leading-[0.86] tracking-[-0.045em]">
              Ashley
              <span className="my-3 block text-2xl italic tracking-normal opacity-50">
                &
              </span>
              Jared
            </h1>

            <div className="mx-auto my-10 h-px w-16 bg-[#3B2F2F]/25" />

            <p className="text-xs uppercase tracking-[0.28em] opacity-65">
              Wedding Weekend
            </p>

            <p className="mt-4 font-serif text-[30px] leading-tight tracking-[-0.02em]">
              Friday, November 13th, 2026
            </p>

            <p className="mt-1 font-serif text-[30px] leading-tight tracking-[-0.02em]">
              Saturday, November 14th, 2026
            </p>

            <p className="mt-5 text-xs uppercase tracking-[0.22em] opacity-55">
              Details will be shared soon
            </p>
          </div>
        </div>

        <div className="px-3">
          <div className="my-12 text-center text-[15px] leading-7 opacity-85">
            <p>We can’t wait to celebrate with you in Atlanta.</p>
            <p className="mt-3">
              To make planning easy, we’ve curated a few recommended places to
              stay below.
            </p>
          </div>

          <div className="mb-8 text-center">
            <p className="text-[11px] uppercase tracking-[0.35em] opacity-60">
              Stay
            </p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-0.02em]">
              Recommended Hotels
            </h2>
            <p className="mt-3 text-sm leading-6 opacity-65">
              Choose the option that fits your weekend best.
            </p>
          </div>

          <div className="space-y-4 pb-8">
            {hotels.map((hotel) => (
              <a
                key={hotel.name}
                href={hotel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-[30px] border border-[#3B2F2F]/10 bg-white/58 p-5 shadow-[0_12px_42px_rgba(59,47,47,0.07)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#3B2F2F]/25"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 text-[11px] uppercase tracking-[0.25em] opacity-60">
                      {hotel.tier} · {hotel.label}
                    </p>
                    <h3 className="font-serif text-[28px] leading-[1.05] tracking-[-0.02em]">
                      {hotel.name}
                    </h3>
                  </div>

                  <p className="rounded-full border border-[#3B2F2F]/10 bg-[#F8F5F0]/50 px-3 py-1 text-xs opacity-70">
                    {hotel.time}
                  </p>
                </div>

                <p className="mb-5 text-sm leading-6 opacity-75">
                  {hotel.description}
                </p>

                <div className="flex h-12 items-center justify-center rounded-full bg-[#3B2F2F] text-xs font-medium uppercase tracking-[0.14em] text-[#F8F5F0] shadow-[0_12px_26px_rgba(59,47,47,0.16)] transition group-hover:bg-[#2D2424]">
                  Book Your Stay
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

