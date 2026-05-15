"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

const PASSWORD = "celebrate2026";
const WEDDING_DATE = new Date("2026-11-14T00:00:00");

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
    address: "800 Rankin St NE, Atlanta, GA 30308",
    phone: "(470) 470-8010",
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
    address: "48 13th St NE, Atlanta, GA 30309",
    phone: "(404) 249-9446",
    href: "https://google.com/",
  },
];

function getDaysUntilWedding() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(
    WEDDING_DATE.getFullYear(),
    WEDDING_DATE.getMonth(),
    WEDDING_DATE.getDate()
  );

  const diff = target.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function Monogram() {
  return (
    <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#3B2F2F]/15 bg-white/90 shadow-[0_18px_50px_rgba(59,47,47,0.06)]">
      <span className="font-serif text-[28px] leading-none tracking-[-0.04em]">
        A<span className="mx-1 text-[18px] italic opacity-[0.55]">&</span>J
      </span>
    </div>
  );
}

function StackedParallaxSection({
  image,
  children,
  zIndex,
  className = "",
  contentClassName = "",
  imageClassName = "",
  imageOpacity = "opacity-[0.78]",
  overlay = "bg-[#F8F5F0]/32",
  gradient = "bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.34),_rgba(248,245,240,0.48)_56%,_rgba(248,245,240,0.76)_100%)]",
}: {
  image: string;
  children: ReactNode;
  zIndex: string;
  className?: string;
  contentClassName?: string;
  imageClassName?: string;
  imageOpacity?: string;
  overlay?: string;
  gradient?: string;
}) {
  return (
    <section
      className={`sticky top-0 min-h-screen overflow-hidden bg-[#F8F5F0] ${zIndex} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className={`h-full w-full scale-[1.06] object-cover saturate-[1.02] contrast-[1.04] ${imageOpacity} ${imageClassName}`}
        />

        <div
          className={`absolute inset-0 backdrop-blur-[0.2px] ${overlay}`}
          aria-hidden="true"
        />

        <div className={`absolute inset-0 ${gradient}`} aria-hidden="true" />
      </div>

      <div className={`relative z-10 ${contentClassName}`}>{children}</div>
    </section>
  );
}

export default function Home() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [daysUntilWedding, setDaysUntilWedding] = useState<number | null>(null);

  useEffect(() => {
    setHasAccess(localStorage.getItem("weddingAccess") === "true");
    setDaysUntilWedding(getDaysUntilWedding());
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
          className="absolute inset-0 h-full w-full object-cover object-[center_34%] opacity-[0.86] saturate-[0.95] contrast-[1.02] md:object-center md:opacity-[0.78]"
        />

        <div
          className="absolute inset-0 bg-[#F8F5F0]/24 backdrop-blur-[0.25px] md:bg-[#F8F5F0]/30"
          aria-hidden="true"
        />

        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.34),_rgba(248,245,240,0.48)_54%,_rgba(248,245,240,0.76)_100%)]"
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
    <main className="relative min-h-screen w-full bg-[#F8F5F0] text-[#3B2F2F]">
      <StackedParallaxSection
        image="/images/wedding-weekend-bg.png"
        zIndex="z-10"
        className="min-h-screen"
        contentClassName="flex min-h-screen items-end justify-center px-5 pb-10 pt-10 md:px-10 md:pb-14"
        imageClassName="object-[center_12%] md:object-[center_14%]"
        imageOpacity="opacity-[1]"
        overlay="bg-transparent"
        gradient="bg-[linear-gradient(180deg,_rgba(0,0,0,0.03)_0%,_rgba(0,0,0,0)_38%,_rgba(0,0,0,0.24)_100%)]"
      >
        <div className="rounded-full border border-white/25 bg-[#3B2F2F]/24 px-5 py-3 text-center text-[#F8F5F0] shadow-[0_18px_46px_rgba(0,0,0,0.2)] backdrop-blur-md">
          <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.26em]">
            Scroll to enter
          </p>
        </div>
      </StackedParallaxSection>

      <StackedParallaxSection
        image="/images/ashley-jared-bg.png"
        zIndex="z-20"
        className="min-h-screen"
        contentClassName="flex min-h-screen items-center px-5 py-14 md:px-10 md:py-20"
        imageClassName="object-center"
        imageOpacity="opacity-[0.26]"
        overlay="bg-[#F8F5F0]/62 md:bg-[#F8F5F0]/58"
        gradient="bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.66),_rgba(248,245,240,0.82)_58%,_rgba(248,245,240,0.96)_100%)]"
      >
        <div className="mx-auto w-full max-w-[780px]">
          <div className="rounded-[42px] border border-[#3B2F2F]/10 bg-[#F8F5F0]/78 px-6 py-10 text-center shadow-[0_34px_90px_rgba(59,47,47,0.13)] backdrop-blur-md md:rounded-[52px] md:px-12 md:py-14">
            <header>
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

            <section className="mx-auto mt-[4.5rem] max-w-[540px] text-center md:mt-20">
              <p className="font-serif text-[31px] leading-[1.08] tracking-[-0.025em] md:text-[44px]">
                We can’t wait to celebrate with you in Atlanta.
              </p>

              <p className="mx-auto mt-6 max-w-[460px] font-sans text-[14px] leading-7 text-[#4f433e] md:text-[15px]">
                To make planning easy, we’ve curated a few recommended places to
                stay for the weekend.
              </p>
            </section>
          </div>
        </div>
      </StackedParallaxSection>

      <StackedParallaxSection
        image="/images/editorial-bg.png"
        zIndex="z-30"
        className="min-h-screen"
        contentClassName="flex min-h-screen items-end justify-center px-5 pb-10 pt-10 md:px-10 md:pb-14"
        imageClassName="object-center"
        imageOpacity="opacity-[0.98]"
        overlay="bg-[#000000]/5"
        gradient="bg-[linear-gradient(180deg,_rgba(0,0,0,0.06)_0%,_rgba(0,0,0,0)_40%,_rgba(0,0,0,0.3)_100%)]"
      >
        <div className="rounded-full border border-white/25 bg-[#3B2F2F]/24 px-5 py-3 text-center text-[#F8F5F0] shadow-[0_18px_46px_rgba(0,0,0,0.2)] backdrop-blur-md">
          <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.26em]">
            The weekend begins in Atlanta
          </p>
        </div>
      </StackedParallaxSection>

      <StackedParallaxSection
        image="/images/hotels-bg.png"
        zIndex="z-40"
        className="min-h-screen"
        contentClassName="px-5 py-20 md:px-10 md:py-28"
        imageClassName="object-center"
        imageOpacity="opacity-[0.78]"
        overlay="bg-[#F8F5F0]/30 md:bg-[#F8F5F0]/28"
        gradient="bg-[linear-gradient(180deg,_rgba(248,245,240,0.74)_0%,_rgba(248,245,240,0.44)_24%,_rgba(248,245,240,0.46)_78%,_rgba(248,245,240,0.82)_100%)]"
      >
        <div className="mx-auto w-full max-w-[760px]">
          <div className="mb-10 text-center md:mb-12">
            <p className="font-sans text-[10px] uppercase tracking-[0.38em] opacity-50">
              Stay
            </p>

            <h2 className="mt-4 font-serif text-[44px] leading-[0.98] tracking-[-0.04em] md:text-[58px]">
              Recommended Hotels
            </h2>

            <p className="mx-auto mt-5 max-w-[430px] font-sans text-[13px] leading-6 opacity-65 md:text-sm">
              We secured preferred room block rates for our guests. Availability
              is limited, so we recommend booking early and asking for the
              Ashley & Jared Wedding Block.
            </p>
          </div>

          <div className="space-y-5 md:space-y-6">
            {hotels.map((hotel) => (
              <a
                key={hotel.name}
                href={hotel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-[28px] border border-[#3B2F2F]/10 bg-white/90 p-6 text-left shadow-[0_18px_46px_rgba(59,47,47,0.09)] backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:border-[#3B2F2F]/20 hover:bg-white/95 md:rounded-[34px] md:p-8"
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

                <div className="mt-5 grid gap-2 rounded-[20px] border border-[#3B2F2F]/10 bg-white/48 p-4 font-sans text-[12px] leading-5 text-[#4f433e] md:grid-cols-[1fr_auto] md:gap-x-6 md:p-5 md:text-[13px]">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3B2F2F]/45">
                      Address
                    </p>
                    <p className="mt-1">{hotel.address}</p>
                  </div>

                  <div className="md:text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3B2F2F]/45">
                      Phone
                    </p>
                    <p className="mt-1">{hotel.phone}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-[22px] border border-[#3B2F2F]/10 bg-[#F8F5F0]/74 p-4 md:mt-7 md:flex md:items-center md:justify-between md:gap-6 md:p-5">
                  <div>
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3B2F2F]/50">
                      Exclusive Room Block Rate
                    </p>

                    <p className="mt-2 font-sans text-[12px] leading-5 text-[#4f433e]/80 md:text-[13px]">
                      Ask for the Ashley & Jared Wedding Block to access this
                      rate while rooms remain available.
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
      </StackedParallaxSection>

      <StackedParallaxSection
        image="/images/more-details-bg.png"
        zIndex="z-50"
        className="min-h-screen"
        contentClassName="px-5 py-20 md:px-10 md:py-28"
        imageClassName="object-center"
        imageOpacity="opacity-[0.78]"
        overlay="bg-[#F8F5F0]/32 md:bg-[#F8F5F0]/30"
        gradient="bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.38),_rgba(248,245,240,0.52)_58%,_rgba(248,245,240,0.8)_100%)]"
      >
        <footer className="mx-auto flex min-h-[560px] w-full max-w-[1120px] flex-col justify-between text-center">
          <div className="mx-auto max-w-[460px]">
            <div className="mx-auto mb-8 h-px w-14 bg-[#3B2F2F]/18" />

            <p className="font-serif text-[34px] leading-tight tracking-[-0.02em] md:text-[42px]">
              More details to come.
            </p>

            <p className="mt-5 font-sans text-[13px] leading-6 opacity-65 md:text-sm">
              For now, book your stay and save the weekend. We’ll share
              additional wedding details soon.
            </p>

            <p className="mt-12 font-serif text-[34px] leading-tight tracking-[-0.03em] md:text-[42px]">
              Ashley and Jared
            </p>

            <div className="mx-auto mt-8 max-w-[260px] rounded-[28px] border border-[#3B2F2F]/10 bg-white/72 px-6 py-6 shadow-[0_18px_42px_rgba(59,47,47,0.08)] backdrop-blur-md">
              <p className="font-serif text-[56px] leading-none tracking-[-0.05em] md:text-[68px]">
                {daysUntilWedding ?? "—"}
              </p>

              <p className="mt-3 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3B2F2F]/50">
                Days until the wedding
              </p>
            </div>
          </div>

          <div className="mt-20 border-t border-[#3B2F2F]/10 pt-6">
            <p className="mx-auto flex max-w-[1040px] flex-wrap items-center justify-center gap-x-4 gap-y-2 font-sans text-[9px] uppercase leading-6 tracking-[0.2em] text-[#3B2F2F]/46 md:justify-between md:text-[10px]">
              <span>Ash & Jae in The A</span>
              <span className="hidden text-[#3B2F2F]/28 md:inline">◇</span>
              <span>Ashley & Jared Wedding Weekend 2026</span>
              <span className="hidden text-[#3B2F2F]/28 md:inline">◇</span>
              <span>November 13 - 14, 2026</span>
              <span className="hidden text-[#3B2F2F]/28 md:inline">◇</span>
              <span>Atlanta, GA</span>
            </p>
          </div>
        </footer>
      </StackedParallaxSection>
    </main>
  );
}

