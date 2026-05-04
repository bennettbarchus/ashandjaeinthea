"use client";

import { useEffect, useState } from "react";

const PASSWORD = "celebrate2026";

const hotels = [
  {
    tier: "$$$",
    label: "Elevated",
    name: "Hotel Name One",
    time: "15 min",
    description: "A refined stay for guests who want the full weekend experience.",
    href: "https://google.com/",
  },
  {
    tier: "$$",
    label: "Balanced",
    name: "Hotel Name Two",
    time: "12 min",
    description: "Stylish, convenient, and easy for the wedding weekend.",
    href: "https://google.com/",
  },
  {
    tier: "$",
    label: "Accessible",
    name: "Hotel Name Three",
    time: "10 min",
    description: "A comfortable option close to the celebration.",
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
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#D8B98A]/20 blur-3xl" />

        <div className="relative mx-auto flex min-h-[85vh] max-w-md flex-col items-center justify-center text-center">
          <p className="mb-8 text-[11px] uppercase tracking-[0.45em] opacity-70">
            Ashley + Jared
          </p>

          <h1 className="mb-6 font-serif text-[64px] leading-[0.9] tracking-[-0.04em]">
            Welcome
          </h1>

          <p className="mb-10 max-w-sm text-[15px] leading-7 opacity-80">
            Enter the password from your save the date to view wedding details.
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
              className="h-14 w-full rounded-full border border-[#3B2F2F]/20 bg-white/35 px-6 text-center text-base outline-none backdrop-blur placeholder:text-[#3B2F2F]/40 focus:border-[#3B2F2F]"
            />

            {error && <p className="text-sm opacity-80">{error}</p>}

            <button
              type="submit"
              className="h-14 w-full rounded-full bg-[#3B2F2F] px-6 text-sm font-medium uppercase tracking-[0.12em] text-[#F8F5F0] shadow-[0_14px_30px_rgba(59,47,47,0.18)]"
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
      <div className="absolute left-[-120px] top-[-120px] h-[360px] w-[360px] rounded-full bg-[#D8B98A]/20 blur-3xl" />
      <div className="absolute bottom-[-160px] right-[-140px] h-[420px] w-[420px] rounded-full bg-[#A56A43]/10 blur-3xl" />

      <section className="relative mx-auto max-w-md">
        <div className="rounded-[36px] border border-[#3B2F2F]/10 bg-white/35 px-6 py-10 shadow-[0_24px_80px_rgba(59,47,47,0.08)] backdrop-blur">
          <div className="text-center">
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

            <p className="mt-3 font-serif text-3xl">Date Coming Soon</p>

            <p className="mt-4 text-xs uppercase tracking-[0.22em] opacity-55">
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
                className="group block rounded-[30px] border border-[#3B2F2F]/10 bg-white/55 p-5 shadow-[0_12px_40px_rgba(59,47,47,0.06)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#3B2F2F]/25"
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

                  <p className="rounded-full border border-[#3B2F2F]/10 px-3 py-1 text-xs opacity-70">
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

