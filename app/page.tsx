"use client";

import { useState, useEffect, useRef } from "react";

const LOGO = "/images/aj-monogram-1.png";
const FORTH = "/images/forth-skyline-sm.png";
const SKYLINE = "/images/hotels-bg.png";
const COUPLE = "/images/IMG_1787.png";
const LOGO_NO_DATE = "/images/No_Date_Wedding_Logo.png";

const PASSWORD = "14november26";

export default function SaveTheDatePage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [daysLeft, setDaysLeft] = useState<string>("--");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (localStorage.getItem("aj_unlocked") === "true") {
      setUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    if (pw.trim().toLowerCase() === PASSWORD) {
      setUnlocked(true);
      localStorage.setItem("aj_unlocked", "true");
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      setError(true);
      setPw("");
      setTimeout(() => setError(false), 3000);
    }
  };

  useEffect(() => {
    if (!unlocked) return;

    const updateCountdown = () => {
      const now = new Date();
      const wedding = new Date("2026-11-14T18:00:00");
      const diff = wedding.getTime() - now.getTime();
      if (diff <= 0) {
        setDaysLeft("0");
        return;
      }
      const days = Math.ceil(diff / 864e5);
      setDaysLeft(String(days));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    setTimeout(() => {
      const els = document.querySelectorAll<HTMLElement>(".fade-in");
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("visible");
              observerRef.current?.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      els.forEach((el) => observerRef.current!.observe(el));
    }, 400);

    return () => {
      clearInterval(interval);
      observerRef.current?.disconnect();
    };
  }, [unlocked]);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=La+Belle+Aurore&family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&family=Cinzel:wght@400;500;600&display=swap');

    :root {
      --blush: #F3C7C3;
      --peach: #F1A96A;
      --lavender: #C9B6C9;
      --sand: #BFA58A;
      --mocha: #5E3B2B;
      --sage: #7E877A;
      --cream: #FAF5F0;
      --parchment: #F7EEE8;
    }

    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Playfair Display', Georgia, serif;
      background: var(--parchment);
      color: var(--mocha);
      overflow-x: hidden;
    }

    .landing {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #F9EDE8 0%, #F5E4DD 30%, #EDD8D0 60%, #F3C7C3 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      transition: opacity 1.2s ease, visibility 1.2s ease;
    }
    .landing.hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    .landing-logo {
      width: min(380px, 75vw);
      animation: logoFadeIn 1.8s ease forwards;
      opacity: 0;
      mix-blend-mode: multiply;
    }
    @keyframes logoFadeIn {
      0% { opacity: 0; transform: scale(0.94) translateY(10px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .password-form {
      margin-top: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      animation: fadeUp 1.8s ease 0.5s forwards;
      opacity: 0;
    }
    @keyframes fadeUp {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .password-label {
      font-family: 'Cinzel', serif;
      font-size: 0.75rem;
      color: var(--mocha);
      letter-spacing: 0.2em;
      opacity: 0.7;
      text-transform: uppercase;
    }
    .password-input {
      border: none;
      border-bottom: 1px solid rgba(94, 59, 43, 0.35);
      background: transparent;
      text-align: center;
      font-family: 'Playfair Display', serif;
      font-size: 1.05rem;
      letter-spacing: 0.25em;
      color: var(--mocha);
      padding: 8px 20px;
      width: 240px;
      outline: none;
      transition: border-color 0.3s;
    }
    .password-input::placeholder {
      color: rgba(94,59,43,0.3);
      letter-spacing: 0.15em;
      font-style: italic;
    }
    .password-input:focus { border-bottom-color: var(--mocha); }
    .password-btn {
      margin-top: 8px;
      background: transparent;
      border: 1px solid var(--mocha);
      color: var(--mocha);
      font-family: 'Cinzel', serif;
      font-size: 0.7rem;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      padding: 10px 36px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .password-btn:hover { background: var(--mocha); color: #FAF5F0; }
    .password-error {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      color: #b05050;
      font-size: 0.85rem;
      height: 20px;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .password-error.show { opacity: 1; }

    .main-site {
      opacity: 0;
      visibility: hidden;
      transition: opacity 1.2s ease 0.3s;
    }
    .main-site.visible { opacity: 1; visibility: visible; }

    .banner {
      width: 100%;
      height: clamp(200px, 42vw, 580px);
      position: relative;
      overflow: hidden;
    }
    .banner img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
      display: block;
    }
    .banner::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 30%;
      background: linear-gradient(to bottom, transparent, #F7EEE8);
    }

    .skyline-bg {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-size: cover;
      background-position: center;
      opacity: 0.18;
      z-index: -1;
      pointer-events: none;
    }

    .hero-content {
      text-align: center;
      padding: clamp(32px, 6vw, 60px) 24px clamp(28px, 5vw, 50px);
      position: relative;
    }
    .hero-logo {
      width: min(280px, 60vw);
      mix-blend-mode: multiply;
      opacity: 0.92;
      margin-bottom: 30px;
    }
    .couple-photo-wrap {
      width: min(480px, 92vw);
      margin: 0 auto 48px;
      position: relative;
    }
    .couple-photo-wrap::before {
      content: '';
      position: absolute;
      inset: -8px;
      border: 1px solid rgba(191,165,138,0.4);
      pointer-events: none;
    }
    .couple-photo { width: 100%; display: block; object-fit: cover; }

    .save-the-date {
      font-family: 'Cinzel', serif;
      font-size: clamp(0.7rem, 1.8vw, 0.85rem);
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: var(--mocha);
      opacity: 0.75;
      margin-bottom: 16px;
    }
    .couple-names {
      font-family: 'La Belle Aurore', cursive;
      font-size: clamp(4rem, 13vw, 6.5rem);
      font-weight: 400;
      line-height: 1.25;
      color: var(--mocha);
      margin-bottom: 18px;
      letter-spacing: 0.03em;
    }
    .wedding-date {
      font-family: 'Cinzel', serif;
      font-size: clamp(0.62rem, 2vw, 1rem);
      letter-spacing: 0.2em;
      color: var(--mocha);
      opacity: 0.9;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .divider {
      width: 80px;
      height: 1px;
      background: linear-gradient(to right, transparent, var(--sand), transparent);
      margin: 30px auto;
    }

    .section {
      padding: clamp(44px, 8vw, 70px) clamp(18px, 5vw, 24px);
      max-width: 900px;
      margin: 0 auto;
    }
    .section-title {
      font-family: 'La Belle Aurore', cursive;
      font-size: clamp(2.2rem, 9vw, 3.8rem);
      font-weight: 400;
      color: var(--mocha);
      text-align: center;
      margin-bottom: 8px;
      letter-spacing: 0.02em;
    }
    .section-subtitle {
      font-family: 'Cinzel', serif;
      font-size: clamp(0.68rem, 2vw, 0.72rem);
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: var(--mocha);
      opacity: 0.6;
      text-align: center;
      margin-bottom: 36px;
    }

    .countdown-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .countdown-num {
      font-family: 'Playfair Display', serif;
      font-size: clamp(6rem, 22vw, 8rem);
      font-weight: 700;
      color: var(--mocha);
      line-height: 1;
      display: block;
      letter-spacing: -0.02em;
    }
    .countdown-label {
      font-family: 'Cinzel', serif;
      font-size: 0.85rem;
      letter-spacing: 0.45em;
      text-transform: uppercase;
      color: var(--mocha);
      opacity: 0.65;
      display: block;
    }

    .accom-intro {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: clamp(1rem, 2.2vw, 1.2rem);
      line-height: 1.85;
      text-align: center;
      color: var(--mocha);
      opacity: 0.95;
      max-width: 640px;
      margin: 0 auto 52px;
    }
    .hotel-card {
      border: 1px solid rgba(191,165,138,0.35);
      padding: clamp(20px, 5vw, 48px);
      margin-bottom: 32px;
      background: rgba(249,237,232,0.5);
      position: relative;
    }
    .hotel-card::before {
      content: '';
      position: absolute;
      top: 12px; left: 12px;
      right: -12px; bottom: -12px;
      border: 1px solid rgba(191,165,138,0.15);
      z-index: -1;
    }
    .hotel-name {
      font-family: 'La Belle Aurore', cursive;
      font-size: clamp(1.9rem, 3.5vw, 2.6rem);
      font-weight: 400;
      color: var(--mocha);
      margin-bottom: 6px;
    }
    .hotel-tagline {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 1.05rem;
      color: var(--mocha);
      opacity: 0.6;
      margin-bottom: 22px;
      line-height: 1.6;
    }
    .hotel-details {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 6px 16px;
      margin-bottom: 22px;
    }
    .hotel-detail-span {
      font-family: 'Playfair Display', serif;
      font-size: 1rem;
      line-height: 1.6;
      color: var(--mocha);
    }
    .hotel-detail-label {
      font-family: 'Cinzel', serif;
      font-size: 0.65rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--mocha);
      opacity: 0.5;
      padding-top: 3px;
      white-space: nowrap;
    }
    .rate-block {
      display: flex;
      align-items: center;
      gap: 14px;
      margin: 18px 0 24px;
      padding: 14px 20px;
      background: rgba(243,199,195,0.18);
      border-left: 2px solid var(--blush);
    }
    .rate-row { display: flex; align-items: center; gap: 12px; }
    .rate-original {
      font-family: 'EB Garamond', serif;
      font-size: 1rem;
      color: var(--mocha);
      opacity: 0.5;
      text-decoration: line-through;
    }
    .rate-arrow { color: var(--sand); font-size: 0.85rem; }
    .rate-new {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.4rem;
      font-weight: 500;
      color: var(--mocha);
    }
    .rate-new-unit {
      font-size: 0.9rem;
      font-family: 'EB Garamond', serif;
    }
    .rate-label {
      font-family: 'Cinzel', serif;
      font-size: 0.65rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--mocha);
      opacity: 0.6;
      margin-top: 2px;
    }
    .hotel-block-note {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 1rem;
      color: var(--mocha);
      opacity: 0.8;
      margin-bottom: 20px;
      line-height: 1.7;
    }
    .book-btn {
      display: inline-block;
      border: 1px solid var(--mocha);
      color: var(--mocha);
      text-decoration: none;
      font-family: 'Cinzel', serif;
      font-size: 0.7rem;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      padding: 13px 36px;
      transition: all 0.3s ease;
    }
    .book-btn:hover { background: var(--mocha); color: #FAF5F0; }

    .footer-section {
      text-align: center;
      padding: clamp(48px, 10vw, 80px) 24px clamp(40px, 8vw, 70px);
      background: linear-gradient(to bottom, transparent, rgba(243,199,195,0.2));
    }
    .footer-ornament {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2rem;
      color: var(--blush);
      margin-bottom: 24px;
      letter-spacing: 0.5em;
    }
    .footer-message {
      font-family: 'La Belle Aurore', cursive;
      font-size: clamp(1.25rem, 3.5vw, 2.2rem);
      font-weight: 400;
      color: var(--mocha);
      line-height: 1.8;
      max-width: 560px;
      margin: 0 auto 24px;
    }
    .footer-sub {
      font-family: 'Cinzel', serif;
      font-size: 0.72rem;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--mocha);
      opacity: 0.6;
      margin-top: 10px;
    }
    .footer-logo {
      width: 120px;
      mix-blend-mode: multiply;
      opacity: 0.6;
      margin-top: 48px;
    }
    .footer-credit {
      font-family: 'Cinzel', serif;
      font-size: 0.6rem;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--mocha);
      opacity: 0.35;
      margin-top: 20px;
    }

    .fade-in {
      opacity: 0;
      transform: translateY(28px);
      transition: opacity 0.9s ease, transform 0.9s ease;
    }
    .fade-in.visible {
      opacity: 1;
      transform: none;
    }

    @media (max-width: 480px) {
      .password-input { width: 200px; }
      .divider { margin: 20px auto; }
      .hotel-card::before { display: none; }
      .rate-original { font-size: 0.9rem; }
      .rate-new { font-size: 1.2rem; }
      .book-btn { display: block; text-align: center; }
      .footer-logo { width: 90px; }
      .footer-ornament { font-size: 1.5rem; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* Landing */}
      <div className={`landing${unlocked ? " hidden" : ""}`}>
        <img className="landing-logo" src={LOGO} alt="AJ Wedding Logo" />
        <div className="password-form">
          <p className="password-label">Enter Password to Continue</p>
          <input
            className="password-input"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="· · · · · · · · · · · ·"
            autoComplete="off"
          />
          <button className="password-btn" onClick={handleUnlock}>
            Enter
          </button>
          <p className={`password-error${error ? " show" : ""}`}>
            Incorrect password. Please try again.
          </p>
        </div>
      </div>

      {/* Main Site */}
      <div className={`main-site${unlocked ? " visible" : ""}`}>

        {/* Fixed skyline background */}
        <div
          className="skyline-bg"
          style={{ backgroundImage: `url(${SKYLINE})` }}
        />

        {/* Banner */}
        <div className="banner">
          <img src={FORTH} alt="Forth Hotel Atlanta Watercolor Skyline" />
        </div>

        {/* Hero */}
        <div className="hero-content">
          <p className="save-the-date fade-in">Save the Date</p>
          <h1 className="couple-names fade-in">Ashley + Jared</h1>
          <p className="wedding-date fade-in">
            November 13-14, 2026 &nbsp;&middot;&nbsp; Atlanta, GA
          </p>
          <div className="divider fade-in" />
          <div className="couple-photo-wrap fade-in">
            <img className="couple-photo" src={COUPLE} alt="Ashley and Jared" />
          </div>
        </div>

        {/* Countdown */}
        <div className="section fade-in">
          <p className="section-subtitle">Counting Down</p>
          <h2 className="section-title">Until We Say I Do</h2>
          <div className="divider" />
          <div className="countdown-wrap">
            <span className="countdown-num">{daysLeft}</span>
            <span className="countdown-label">Days to Go</span>
          </div>
        </div>

        <div className="divider" style={{ maxWidth: 900, margin: "0 auto" }} />

        {/* Accommodations */}
        <div className="section fade-in">
          <p className="section-subtitle">Where to Stay</p>
          <h2 className="section-title">Accommodations</h2>
          <div className="divider" />
          <p className="accom-intro">
            We secured preferred rates at the following hotels for our guests.
            Availability is limited, so we recommend booking early and asking for
            the <em>&#8216;Pandit &amp; Bennett-Barchus&#8217;</em> wedding room block.
          </p>

          {/* Forth Hotel */}
          <div className="hotel-card">
            <h3 className="hotel-name">Forth Hotel</h3>
            <p className="hotel-tagline">
              The most seamless option for guests who want to stay where the big day unfolds.
            </p>
            <div className="hotel-details">
              <span className="hotel-detail-label">Address</span>
              <span className="hotel-detail-span">800 Rankin St NE, Atlanta, GA 30308</span>
              <span className="hotel-detail-label">Phone</span>
              <span className="hotel-detail-span">(470) 470-8010</span>
            </div>
            <div className="rate-block">
              <div>
                <div className="rate-row">
                  <span className="rate-original">$409/nt</span>
                  <span className="rate-arrow">&#8594;</span>
                  <span className="rate-new">
                    $339<span className="rate-new-unit">/nt</span>
                  </span>
                </div>
                <div className="rate-label">Exclusive Room Block Rate</div>
              </div>
            </div>
            <p className="hotel-block-note">
              Book now with the <em>&#8216;Pandit &amp; Bennett-Barchus&#8217;</em> wedding room
              block to access a limited number of rooms at this discounted rate.
            </p>
            <a
              className="book-btn"
              href="https://www.forthatlanta.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book Your Stay
            </a>
          </div>

          {/* Moxy Hotel */}
          <div className="hotel-card">
            <h3 className="hotel-name">Moxy Atlanta Midtown</h3>
            <p className="hotel-tagline">
              A chic, social option in Midtown Atlanta with easy access to the wedding venue and afterparty.
            </p>
            <div className="hotel-details">
              <span className="hotel-detail-label">Address</span>
              <span className="hotel-detail-span">48 13th St NE, Atlanta, GA 30309</span>
              <span className="hotel-detail-label">Phone</span>
              <span className="hotel-detail-span">(404) 249-9446</span>
            </div>
            <div className="rate-block">
              <div>
                <div className="rate-row">
                  <span className="rate-original">$250/nt</span>
                  <span className="rate-arrow">&#8594;</span>
                  <span className="rate-new">
                    $139<span className="rate-new-unit">/nt</span>
                  </span>
                </div>
                <div className="rate-label">Exclusive Room Block Rate</div>
              </div>
            </div>
            <p className="hotel-block-note">
              Book now with the <em>&#8216;Pandit &amp; Bennett-Barchus&#8217;</em> wedding room
              block to access a limited number of rooms at this discounted rate.
            </p>
            <a
              className="book-btn"
              href="https://www.marriott.com/en-us/hotels/atlox-moxy-atlanta-midtown/overview/?scid=f2ae0541-1279-4f24-b197-a979c79310b0"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book Your Stay
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="footer-section fade-in">
          <div className="footer-ornament">&#10022; &middot; &#10022;</div>
          <p className="footer-message">
            A formal invitation to follow.<br />
            <br />For now, save the date and book your stay.<br />
            We&#8217;ll share additional wedding details soon.
          </p>
          <p className="footer-sub">
            Ashley &amp; Jared &nbsp;&middot;&nbsp; November 13-14, 2026 &nbsp;&middot;&nbsp; Atlanta, GA
          </p>
<img className="footer-logo" src={LOGO_NO_DATE} alt="AJ" />
          <p className="footer-credit">Crafted with love by Ashley &amp; Jared &nbsp;&middot;&nbsp; 2026</p>
        </div>

      </div>
    </>
  );
}