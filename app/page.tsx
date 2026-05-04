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

  // LOADING
  if (hasAccess === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F5F0] text-[#3B2F2F]">
        <p className="text-sm opacity-60">Loading…</p>
      </main>
    );
  }

  // PASSWORD SCREEN
  if (!hasAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F5F0] px-6 text-[#3B2F2F]">
        <div className="w-full max-w-md text-center">
          <div className="mb-10 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#3B2F2F]/20 bg-white/40">
              <span className="font-serif text-3xl">
                A<span className="mx-1 text-xl italic opacity-60">&</span>J
              </span>
            </div>
          </div>

          <h1 className="mb-6 font-serif text-5xl">Welcome</h1>

          <p className="mb-10 text-sm leading-6 opacity-80">
            Enter the password from your save the date to view wedding details.
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
              className="h-14 w-full rounded-full border border-[#3B2F2F]/20 px-6 text-center outline-none"
            />

            {error && <p className="text-sm">{error}</p>}

            <button className="h-14 w-full rounded-full bg-[#3B2F2F] text-white">
              Enter
            </button>
          </form>
        </div>
      </main>
    );
  }

  // MAIN PAGE
  return (
    <main className="bg-[#F8F5F0] text-[#3B2F2F]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        
        {/* HEADER */}
        <section className="text-center">
          <div className="mb-10 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#3B2F2F]/20 bg-white/40">
              <span className="font-serif text-3xl">
                A<span className="mx-1 text-xl italic opacity-60">&</span>J
              </span>
            </div>
          </div>

          <p className="mb-6 text-xs uppercase tracking-[0.4em] opacity-70">
            Atlanta, Georgia
          </p>

          <h1 className="font-serif text-6xl leading-tight">
            Ashley
            <span className="block text-2xl italic opacity-60">&</span>
            Jared
          </h1>

          <p className="mt-6 text-sm uppercase tracking-[0.3em] opacity-70">
            Wedding Weekend
          </p>

          <p className="mt-2 font-serif text-2xl">
            November 13–14, 2026
          </p>
        </section>

        {/* WELCOME MESSAGE */}
        <section className="mt-20 text-center">
          <p className="text-base leading-7 opacity-85">
            We can’t wait to celebrate with you in Atlanta.
          </p>
          <p className="mt-3 text-base leading-7 opacity-85">
            To make planning easy, we’ve curated a few recommended places to stay.
          </p>
        </section>

        {/* HOTELS */}
        <section className="mt-20">
          <div className="mb-10 text-center">
            <p className="text-xs uppercase tracking-[0.35em] opacity-60">
              Stay
            </p>
            <h2 className="mt-3 font-serif text-3xl">
              Recommended Hotels
            </h2>
          </div>

          <div className="space-y-6">
            {hotels.map((hotel) => (
              <a
                key={hotel.name}
                href={hotel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-[#3B2F2F]/10 bg-white p-6 transition hover:border-[#3B2F2F]/30"
              >
                <div className="mb-3 flex justify-between">
                  <p className="text-xs uppercase tracking-[0.25em] opacity-60">
                    {hotel.tier} · {hotel.label}
                  </p>
                  <p className="text-xs opacity-60">{hotel.time}</p>
                </div>

                <h3 className="font-serif text-xl">{hotel.name}</h3>

                <p className="mt-2 text-sm leading-6 opacity-75">
                  {hotel.description}
                </p>

                <div className="mt-5 rounded-full bg-[#3B2F2F] py-3 text-center text-sm text-white">
                  Book Your Stay
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* CLOSING */}
        <section className="mt-24 text-center">
          <p className="text-sm opacity-70">
            Additional details will be shared soon.
          </p>
        </section>

      </div>
    </main>
  );
}
