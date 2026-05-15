"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

const PASSWORD = "celebrate2026";

const hotels = [
  {
    tier: "$$$",
    label: "Premium Stay",
    name: "The Forth Hotel",
    time: "Wedding Venue",
    description:
      "The most seamless option for guests who want to stay where the big day unfolds.",
    originalRate: "$599",
    blockRate: "$339",
    href: "https://google.com/",
  },
  {
    tier: "$$",
    label: "Midtown Social",
    name: "Moxy Atlanta Midtown",
    time: "Nearby",
    description:
      "A chic, social option in Midtown Atlanta with easy access to the wedding and the afterparty.",
    originalRate: "$250",
    blockRate: "$139",
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

function ImageSection({
  image,
  children,
  className = "",
  overlay = "bg-[#F8F5F0]/72",
  gradient = "bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.58),_rgba(248,245,240,0.76)_56%,_rgba(248,245,240,0.94)_100%)]",
}: {
  image: string;
  children: ReactNode;
  className?: string;
  overlay?: string;
  gradient?: string;
}) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.42] saturate-[0.9] contrast-[0.96]"
        style={{
          backgroundImage: `url('${image}')`,
        }}
        aria-hidden="true"
      />

      <div className={`absolute inset-0 backdrop-blur-[0.5px] ${overlay}`} aria-hidden="true" />

      <div className={`absolute inset-0 ${gradient}`} aria-hidden="true" />

      <div className="relative z-10">{children}</div>
    </section>
  );
}

export default function Home() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setHasAccess(localStorage.getItem("weddingAccess") === "true");
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
      <main className="relative min-h-screen w-full overflow-hidden bg-[#F8F5F0] px-6 py-12 text-[#3B2F2F] md:flex md:items-center md:justify-center md:px-10 md:py-16">
        <img
          src="/images/forth-skyline-sm.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[center_34%] opacity-[0.84] saturate-[0.9] contrast-[0.98] md:object-center md:opacity-[0.74]"
        />

        <div
          className="absolute inset-0 bg-[#F8F5F0]/30 backdrop-blur-[0.5px] md:bg-[#F8F5F0]/36"
          aria-hidden="true"
        />

        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.42),_rgba(248,245,240,0.58)_54%,_rgba(248,245,240,0.82)_100%)]"
          aria-hidden="true"
        />

        <section className="relative z-10 mx-auto w-full max-w-[480px] rounded-[38px] border border-[#3B2F2F]/10 bg-white/82 p-8 text-center shadow-[0_30px_80px_rgba(59,47,47,0.1)] backdrop-blur-md md:p-12">
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
              className="h-14 w-full rounded-full border border-[#3B2F2F]/10 bg-[#f5f1ed]/92 px-6 text-center font-sans text-sm text-[#3B2F2F] outline-none placeholder:text-[#3B2F2F]/40 focus:border-[#3B2F2F]/30 focus:ring-2 focus:ring-[#3B2F2F]/10"
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
    <main className="min-h-screen w-full bg-[#F8F5F0] text-[#3B2F2F]">
      <ImageSection
        image="/images/wedding-weekend-bg.png"
        className="px-5 py-12 md:px-10 md:py-20"
        overlay="bg-[#F8F5F0]/74 md:bg-[#F8F5F0]/70"
        gradient="bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.66),_rgba(248,245,240,0.82)_58%,_rgba(248,245,240,0.96)_100%)]"
      >
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

            <div className="mx-auto mt-5 max-w-[620px] space-y-4">
              <p className="font-serif text-[28px] leading-tight tracking-[-0.02em] md:text-[40px]">
                Friday, November 13, 2026
              </p>

              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#3B2F2F]/58 md:text-xs">
                Welcome Party
              </p>

              <div className="mx-auto h-px w-10 bg-[#3B2F2F]/14" />

              <p className="font-serif text-[28px] leading-tight tracking-[-0.02em] md:text-[40px]">
                Saturday, November 14, 2026
              </p>

              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#3B2F2F]/58 md:text-xs">
                Black Tie Ceremony & Reception
              </p>
            </div>
          </header>

          <section className="mx-auto mt-[4.5rem] max-w-[540px] text-center md:mt-24">
            <p className="font-serif text-[31px] leading-[1.08] tracking-[-0.025em] md:text-[44px]">
              We can’t wait to celebrate with you in Atlanta.
            </p>

            <p className="mx-auto mt-6 max-w-[460px] font-sans text-[14px] leading-7 text-[#4f433e] md:text-[15px]">
              To make planning easy, we’ve curated a few recommended places to
              stay for the weekend.
            </p>
          </section>
        </div>
      </ImageSection>

      <ImageSection
        image="/images/hotels-bg.png"
        className="px-5 py-20 md:px-10 md:py-28"
        overlay="bg-[#F8F5F0]/68 md:bg-[#F8F5F0]/64"
        gradient="bg-[linear-gradient(180deg,_rgba(248,245,240,0.94)_0%,_rgba(248,245,240,0.7)_24%,_rgba(248,245,240,0.72)_78%,_rgba(248,245,240,0.96)_100%)]"
      >
        <div className="mx-auto w-full max-w-[760px]">
          <div className="mb-10 text-center md:mb-12">
            <p className="font-sans text-[10px] uppercase tracking-[0.38em] opacity-50">
              Stay
            </p>

            <h2 className="mt-4 font-serif text-[44px] leading-[0.98] tracking-[-0.04em] md:text-[58px]">
              Recommended Hotels
            </h2>

            <p className="mx-auto mt-5 max-w-[420px] font-sans text-[13px] leading-6 opacity-60 md:text-sm">
              We secured preferred room block rates for our guests. Availability
              is limited, so we recommend booking early.
            </p>
          </div>

          <div className="space-y-5 md:space-y-6">
            {hotels.map((hotel) => (
              <a
                key={hotel.name}
                href={hotel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-[28px] border border-[#3B2F2F]/10 bg-white/88 p-6 text-left shadow-[0_18px_46px_rgba(59,47,47,0.09)] backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:border-[#3B2F2F]/20 hover:bg-white/94 md:rounded-[34px] md:p-8"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.24em] opacity-50">
                      {hotel.tier} · {hotel.label}
                    </p>

                    <h3 className="font-serif text-[30px] leading-[1.02] tracking-[-0.025em] md:text-[38px]">
                      {hotel.name}
                    </h3>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 md:justify-end">
                    <p className="rounded-full border border-[#3B2F2F]/10 bg-[#F8F5F0]/70 px-3 py-1 font-sans text-[11px] opacity-65">
                      {hotel.time}
                    </p>
                  </div>
                </div>

                <p className="mt-5 w-full font-sans text-[13px] leading-6 text-[#4f433e] md:text-[14px]">
                  {hotel.description}
                </p>

                <div className="mt-6 rounded-[22px] border border-[#3B2F2F]/10 bg-[#F8F5F0]/74 p-4 md:mt-7 md:flex md:items-center md:justify-between md:gap-6 md:p-5">
                  <div>
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3B2F2F]/50">
                      Exclusive Room Block Rate
                    </p>

                    <p className="mt-2 font-sans text-[12px] leading-5 text-[#4f433e]/80 md:text-[13px]">
                      Special pricing for our guests while the block is
                      available.
                    </p>
                  </div>

                  <div className="mt-4 flex items-baseline gap-3 md:mt-0 md:justify-end">
                    <span className="font-serif text-[24px] leading-none text-[#3B2F2F]/38 line-through decoration-[#3B2F2F]/45 decoration-1 md:text-[28px]">
                      {hotel.originalRate}
                    </span>

                    <span className="font-serif text-[38px] leading-none tracking-[-0.04em] text-[#3B2F2F] md:text-[46px]">
                      {hotel.blockRate}
                    </span>

                    <span className="font-sans text-[11px] uppercase tracking-[0.14em] text-[#3B2F2F]/48">
                      / night
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex h-12 items-center justify-center rounded-full bg-[#3B2F2F] font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-[#F8F5F0] shadow-[0_10px_22px_rgba(59,47,47,0.12)] transition group-hover:bg-[#2a2423] md:mt-7">
                  Book Your Stay
                </div>
              </a>
            ))}
          </div>
        </div>
      </ImageSection>

      <ImageSection
        image="/images/more-details-bg.png"
        className="px-5 py-20 md:px-10 md:py-28"
        overlay="bg-[#F8F5F0]/70 md:bg-[#F8F5F0]/66"
        gradient="bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.62),_rgba(248,245,240,0.78)_58%,_rgba(248,245,240,0.96)_100%)]"
      >
        <footer className="mx-auto max-w-[430px] text-center">
          <div className="mx-auto mb-8 h-px w-14 bg-[#3B2F2F]/18" />

          <p className="font-serif text-[34px] leading-tight tracking-[-0.02em] md:text-[42px]">
            More details to come.
          </p>

          <p className="mt-5 font-sans text-[13px] leading-6 opacity-60 md:text-sm">
            For now, book your stay and save the weekend. We’ll share additional
            wedding details soon.
          </p>
        </footer>
      </ImageSection>
    </main>
  );
}

