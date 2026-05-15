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
    <div className="mx-auto flex h-[82px] w-[82px] items-center justify-center rounded-full border border-[#BFA58A]/45 bg-[#F8F5F0]/80 shadow-[0_18px_50px_rgba(94,62,43,0.1)] backdrop-blur-md">
      <img
        src="/images/aj-monogram.svg"
        alt="Ashley and Jared monogram"
        draggable={false}
        className="h-[62px] w-[62px] object-contain"
      />
    </div>
  );
}

function PaletteDivider() {
  return (
    <div className="mx-auto flex items-center justify-center gap-2">
      <span className="h-px w-8 bg-[#F3C7C3]" />
      <span className="h-1.5 w-1.5 rounded-full bg-[#F1A96A]" />
      <span className="h-px w-8 bg-[#C9B6C9]" />
    </div>
  );
}

function RevealScrollSection({
  image,
  label,
  children,
  imageClassName = "",
  primaryImageClassName = "",
  gradient = "bg-[linear-gradient(180deg,_rgba(94,62,43,0.04)_0%,_rgba(0,0,0,0)_42%,_rgba(94,62,43,0.3)_100%)]",
  panelOverlap = "-mt-[18svh] md:-mt-[22svh]",
}: {
  image: string;
  label: string;
  children: ReactNode;
  imageClassName?: string;
  primaryImageClassName?: string;
  gradient?: string;
  panelOverlap?: string;
}) {
  return (
    <section className="relative isolate overflow-visible bg-[#F8F5F0]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full scale-[1.08] object-cover opacity-75 blur-xl saturate-[1.05] contrast-[1.04] ${imageClassName}`}
        />

        <img
          src={image}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover opacity-100 saturate-[1.02] contrast-[1.04] ${primaryImageClassName}`}
        />

        <div className={`absolute inset-0 ${gradient}`} aria-hidden="true" />

        <div className="relative z-10 flex h-full items-end justify-center px-5 pb-10 md:px-10 md:pb-14">
          <div className="rounded-full border border-[#F8F5F0]/35 bg-[#5E3E2B]/26 px-5 py-3 text-center text-[#F8F5F0] shadow-[0_18px_46px_rgba(94,62,43,0.24)] backdrop-blur-md">
            <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.26em]">
              {label}
            </p>
          </div>
        </div>
      </div>

      <div className={`relative z-20 ${panelOverlap}`}>{children}</div>
    </section>
  );
}

function ImageBackgroundSection({
  image,
  children,
  className = "",
  contentClassName = "",
  imageClassName = "",
  imageOpacity = "opacity-[0.72]",
  overlay = "bg-[#F8F5F0]/34",
  gradient = "bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.38),_rgba(248,245,240,0.52)_58%,_rgba(248,245,240,0.82)_100%)]",
}: {
  image: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  imageClassName?: string;
  imageOpacity?: string;
  overlay?: string;
  gradient?: string;
}) {
  return (
    <section
      className={`relative max-w-full overflow-hidden bg-[#F8F5F0] ${className}`}
    >
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover saturate-[1.02] contrast-[1.04] ${imageOpacity} ${imageClassName}`}
      />

      <div
        className={`absolute inset-0 backdrop-blur-[0.2px] ${overlay}`}
        aria-hidden="true"
      />

      <div className={`absolute inset-0 ${gradient}`} aria-hidden="true" />

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
      <main className="flex min-h-[100svh] w-full items-center justify-center overflow-x-hidden bg-[#F8F5F0] text-[#5E3E2B]">
        <p className="font-sans text-sm opacity-60">Loading…</p>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="relative min-h-[100svh] w-full overflow-x-hidden overflow-y-hidden bg-[#F8F5F0] px-6 py-12 text-[#5E3E2B] md:flex md:items-center md:justify-center md:px-10 md:py-16">
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
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(243,199,195,0.28),_rgba(248,245,240,0.48)_48%,_rgba(201,182,201,0.28)_100%)]"
          aria-hidden="true"
        />

        <section className="relative z-10 mx-auto w-full max-w-[480px] rounded-[38px] border border-[#BFA58A]/28 bg-[#F8F5F0]/82 p-8 text-center shadow-[0_30px_80px_rgba(94,62,43,0.12)] backdrop-blur-md md:p-12">
          <Monogram />

          <p className="mt-8 font-sans text-[10px] uppercase tracking-[0.38em] text-[#7E877A]">
            Ashley & Jared
          </p>

          <h1 className="mt-6 font-serif text-[52px] leading-[0.92] tracking-[-0.035em] text-[#5E3E2B] md:text-[62px]">
            Welcome
          </h1>

          <p className="mx-auto mt-5 max-w-[330px] font-sans text-[15px] leading-7 text-[#5E3E2B]/78 md:text-[16px]">
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
              className="h-14 w-full rounded-full border border-[#BFA58A]/32 bg-[#F3C7C3]/18 px-6 text-center font-sans text-sm text-[#5E3E2B] outline-none placeholder:text-[#5E3E2B]/38 focus:border-[#F1A96A]/70 focus:ring-2 focus:ring-[#F1A96A]/20"
            />

            {error && <p className="text-sm text-[#9B6A4E]">{error}</p>}

            <button className="h-14 w-full rounded-full bg-[#5E3E2B] font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-[#F8F5F0] shadow-[0_12px_30px_rgba(94,62,43,0.18)] transition hover:bg-[#4d3324]">
              Enter
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F8F5F0] text-[#5E3E2B]">
      <RevealScrollSection
        image="/images/wedding-weekend-bg.png"
        label="Scroll to enter"
        primaryImageClassName="object-[center_8%] md:object-contain md:p-8 lg:p-12"
        imageClassName="object-[center_8%] md:object-center"
        gradient="bg-[linear-gradient(180deg,_rgba(94,62,43,0.03)_0%,_rgba(0,0,0,0)_42%,_rgba(94,62,43,0.28)_100%)]"
      >
        <section className="w-full overflow-hidden rounded-t-[42px] bg-[#F8F5F0] px-5 py-16 text-[#5E3E2B] shadow-[0_-34px_90px_rgba(94,62,43,0.16)] md:rounded-t-[56px] md:px-10 md:py-24">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(243,199,195,0.24),_rgba(248,245,240,1)_44%,_rgba(201,182,201,0.18)_100%)]"
            aria-hidden="true"
          />

          <div className="relative z-10 mx-auto w-full max-w-[780px]">
            <div className="rounded-[42px] border border-[#BFA58A]/24 bg-[#F8F5F0]/90 px-6 py-10 text-center shadow-[0_34px_90px_rgba(94,62,43,0.1)] backdrop-blur-md md:rounded-[52px] md:px-12 md:py-14">
              <header>
                <Monogram />

                <p className="mt-10 font-sans text-[10px] uppercase tracking-[0.42em] text-[#7E877A]">
                  Atlanta, Georgia
                </p>

                <h1 className="mt-6 font-serif text-[64px] leading-[0.88] tracking-[-0.045em] text-[#5E3E2B] md:text-[92px]">
                  Ashley
                  <span className="my-2 block text-[24px] italic leading-none tracking-normal text-[#F1A96A]/80 md:text-[30px]">
                    &
                  </span>
                  Jared
                </h1>

                <div className="my-9 md:my-12">
                  <PaletteDivider />
                </div>

                <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-[#7E877A]">
                  Wedding Weekend
                </p>

                <div className="mx-auto mt-5 max-w-[620px] space-y-4">
                  <p className="font-serif text-[28px] leading-tight tracking-[-0.02em] text-[#5E3E2B] md:text-[40px]">
                    Friday, November 13, 2026
                  </p>

                  <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#BFA58A] md:text-xs">
                    Welcome Party
                  </p>

                  <div className="mx-auto h-px w-10 bg-[#C9B6C9]/70" />

                  <p className="font-serif text-[28px] leading-tight tracking-[-0.02em] text-[#5E3E2B] md:text-[40px]">
                    Saturday, November 14, 2026
                  </p>

                  <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#BFA58A] md:text-xs">
                    Black Tie Ceremony & Reception
                  </p>
                </div>
              </header>

              <section className="mx-auto mt-[4.5rem] max-w-[540px] text-center md:mt-20">
                <p className="font-serif text-[31px] leading-[1.08] tracking-[-0.025em] text-[#5E3E2B] md:text-[44px]">
                  We can’t wait to celebrate with you in Atlanta!
                </p>

                <p className="mx-auto mt-6 max-w-[460px] font-sans text-[14px] leading-7 text-[#5E3E2B]/76 md:text-[15px]">
                  To make planning easy, we’ve curated a few recommended places
                  to stay for the weekend.
                </p>
              </section>
            </div>
          </div>
        </section>
      </RevealScrollSection>

      <RevealScrollSection
        image="/images/editorial-bg.png"
        label="Celebrate with us in Atlanta"
        primaryImageClassName="object-[center_28%] md:object-[center_14%]"
        imageClassName="object-[center_28%] md:object-[center_14%]"
        gradient="bg-[linear-gradient(180deg,_rgba(94,62,43,0.06)_0%,_rgba(0,0,0,0)_42%,_rgba(94,62,43,0.32)_100%)]"
      >
        <ImageBackgroundSection
          image="/images/hotels-bg.png"
          className="rounded-t-[42px] shadow-[0_-34px_90px_rgba(94,62,43,0.16)] md:rounded-t-[56px]"
          contentClassName="px-5 py-20 md:px-10 md:py-28"
          imageClassName="object-center"
          imageOpacity="opacity-[0.78]"
          overlay="bg-[#F8F5F0]/28 md:bg-[#F8F5F0]/26"
          gradient="bg-[linear-gradient(180deg,_rgba(248,245,240,0.82)_0%,_rgba(243,199,195,0.32)_22%,_rgba(248,245,240,0.48)_76%,_rgba(248,245,240,0.86)_100%)]"
        >
          <div className="mx-auto w-full max-w-[760px]">
            <div className="mb-10 text-center md:mb-12">
              <p className="font-sans text-[10px] uppercase tracking-[0.38em] text-[#7E877A]">
                Stay
              </p>

              <h2 className="mt-4 font-serif text-[44px] leading-[0.98] tracking-[-0.04em] text-[#5E3E2B] md:text-[58px]">
                Recommended Hotels
              </h2>

              <p className="mx-auto mt-5 max-w-[430px] font-sans text-[13px] leading-6 text-[#5E3E2B]/68 md:text-sm">
                We secured preferred room block rates for our guests.
                Availability is limited, so we recommend booking early and
                asking for the Ashley & Jared Wedding Block.
              </p>
            </div>

            <div className="space-y-5 md:space-y-6">
              {hotels.map((hotel, index) => (
                <a
                  key={hotel.name}
                  href={hotel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-[28px] border border-[#BFA58A]/24 bg-[#F8F5F0]/88 p-6 text-left shadow-[0_18px_46px_rgba(94,62,43,0.1)] backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:border-[#F1A96A]/45 hover:bg-[#F8F5F0]/95 md:rounded-[34px] md:p-8"
                >
                  <div className="min-w-0">
                    <p
                      className={`mb-3 font-sans text-[10px] uppercase tracking-[0.24em] ${
                        index === 0 ? "text-[#BFA58A]" : "text-[#7E877A]"
                      }`}
                    >
                      {hotel.tier} · {hotel.label}
                    </p>

                    <h3 className="font-serif text-[30px] leading-[1.02] tracking-[-0.025em] text-[#5E3E2B] md:text-[38px]">
                      {hotel.name}
                    </h3>
                  </div>

                  <p className="mt-5 w-full font-sans text-[13px] leading-6 text-[#5E3E2B]/76 md:text-[14px]">
                    {hotel.description}
                  </p>

                  <div className="mt-5 grid gap-2 rounded-[20px] border border-[#BFA58A]/20 bg-white/42 p-4 font-sans text-[12px] leading-5 text-[#5E3E2B]/76 md:grid-cols-[1fr_auto] md:gap-x-6 md:p-5 md:text-[13px]">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7E877A]">
                        Address
                      </p>
                      <p className="mt-1">{hotel.address}</p>
                    </div>

                    <div className="md:text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7E877A]">
                        Phone
                      </p>
                      <p className="mt-1">{hotel.phone}</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[22px] border border-[#BFA58A]/22 bg-[#F3C7C3]/18 p-4 md:mt-7 md:flex md:items-center md:justify-between md:gap-6 md:p-5">
                    <div>
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#BFA58A]">
                        Exclusive Room Block Rate
                      </p>

                      <p className="mt-2 font-sans text-[12px] leading-5 text-[#5E3E2B]/76 md:text-[13px]">
                        Book now with the Ashley & Jared Wedding Block to access
                        this rate while rooms remain available.
                      </p>
                    </div>

                    <div className="mt-4 flex items-baseline gap-3 md:mt-0 md:justify-end">
                      <span className="font-serif text-[24px] leading-none text-[#5E3E2B]/34 line-through decoration-[#5E3E2B]/45 decoration-1 md:text-[28px]">
                        {hotel.originalRate}
                      </span>

                      <span className="font-serif text-[38px] leading-none tracking-[-0.04em] text-[#5E3E2B] md:text-[46px]">
                        {hotel.blockRate}
                      </span>

                      <span className="font-sans text-[11px] uppercase tracking-[0.14em] text-[#7E877A]">
                        / night
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex h-12 items-center justify-center rounded-full bg-[#5E3E2B] font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-[#F8F5F0] shadow-[0_10px_22px_rgba(94,62,43,0.16)] transition group-hover:bg-[#4d3324] md:mt-7">
                    Book Your Stay
                  </div>
                </a>
              ))}
            </div>
          </div>
        </ImageBackgroundSection>
      </RevealScrollSection>

      <ImageBackgroundSection
        image="/images/more-details-bg.png"
        className="-mt-px min-h-screen"
        contentClassName="px-5 py-20 md:px-10 md:py-28"
        imageClassName="object-center"
        imageOpacity="opacity-[0.78]"
        overlay="bg-[#F8F5F0]/30 md:bg-[#F8F5F0]/28"
        gradient="bg-[radial-gradient(circle_at_center,_rgba(243,199,195,0.34),_rgba(248,245,240,0.56)_58%,_rgba(201,182,201,0.28)_100%)]"
      >
        <footer className="mx-auto flex min-h-[560px] w-full max-w-[1120px] flex-col justify-between text-center">
          <div className="mx-auto max-w-[460px]">
            <PaletteDivider />

            <p className="mt-8 font-serif text-[34px] leading-tight tracking-[-0.02em] text-[#5E3E2B] md:text-[42px]">
              More details to come.
            </p>

            <p className="mt-5 font-sans text-[13px] leading-6 text-[#5E3E2B]/66 md:text-sm">
              For now, book your stay and save the weekend. We’ll share
              additional wedding details soon.
            </p>

            <p className="mt-12 font-serif text-[34px] leading-tight tracking-[-0.03em] text-[#5E3E2B] md:text-[42px]">
              Ashley & Jared 2026
            </p>

            <div className="mx-auto mt-8 max-w-[260px] rounded-[28px] border border-[#BFA58A]/24 bg-[#F8F5F0]/74 px-6 py-6 shadow-[0_18px_42px_rgba(94,62,43,0.09)] backdrop-blur-md">
              <p className="font-serif text-[56px] leading-none tracking-[-0.05em] text-[#5E3E2B] md:text-[68px]">
                {daysUntilWedding ?? "—"}
              </p>

              <p className="mt-3 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7E877A]">
                Days until the wedding
              </p>
            </div>
          </div>

          <div className="mt-20 border-t border-[#BFA58A]/24 pt-6">
            <p className="mx-auto flex max-w-[1040px] flex-col items-center justify-center gap-y-2 font-sans text-[9px] uppercase leading-6 tracking-[0.18em] text-[#5E3E2B]/50 md:flex-row md:flex-wrap md:justify-between md:gap-x-4 md:text-[10px]">
              <span>Ash & Jae in The A</span>
              <span className="hidden text-[#F1A96A]/70 md:inline">◇</span>
              <span>Ashley & Jared Wedding Weekend 2026</span>
              <span className="hidden text-[#F3C7C3] md:inline">◇</span>
              <span>November 13 - 14, 2026</span>
              <span className="hidden text-[#7E877A]/70 md:inline">◇</span>
              <span>Atlanta, GA</span>
            </p>
          </div>
        </footer>
      </ImageBackgroundSection>
    </main>
  );
}

