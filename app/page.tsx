"use client";

import { useState, useEffect } from "react";

const CORRECT_PASSWORD = "celebrate2026";
const PASSWORD_STORAGE_KEY = "wedding_hub_access";

interface Hotel {
  id: string;
  name: string;
  priceLevel: "$" | "$$" | "$$$";
  description: string;
  distance: string;
  amenities: string[];
  url: string;
}

const hotels: Hotel[] = [
  {
    id: "luxury",
    name: "The Forth Hotel",
    priceLevel: "$$$",
    description: "Ultra-luxury downtown hotel with impeccable service and sophisticated elegance",
    distance: "The wedding venue",
    amenities: ["Concierge Service", "Michelin-Starred Restaurant", "Spa & Pool"],
    url: "https://forthatlanta.com/hotel",
  },
  {
    id: "upscale",
    name: "Kimpton Hotel Palomar",
    priceLevel: "$$",
    description: "Boutique luxury hotel with modern design and personalized amenities",
    distance: "12 min from venue",
    amenities: ["Pet-Friendly", "Wine Hour", "Rooftop Bar"],
    url: "https://www.hotelpalomar-atlanta.com/",
  },
  {
    id: "comfort",
    name: "The Georgian Terrace",
    priceLevel: "$",
    description: "Historic charm with comfortable accommodations and great value in Midtown",
    distance: "10 min from venue",
    amenities: ["Historic Property", "Restaurant & Bar", "Accessible Rooms"],
    url: "https://www.thegeorgianterrace.com/",
  },
];

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(PASSWORD_STORAGE_KEY);
    if (stored === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem(PASSWORD_STORAGE_KEY, "true");
      setError("");
      setPassword("");
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(PASSWORD_STORAGE_KEY);
  };

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-ivory">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <h1 className="font-playfair text-5xl mb-4 text-espresso font-600">
              Ashley & Jared
            </h1>
            <p className="font-lora text-lg text-espresso mb-2">November 14th, 2026</p>
            <p className="font-lora text-sm text-espresso opacity-75">
              Atlanta, Georgia
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block font-lora text-sm mb-3 text-espresso">
                Enter password to continue
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-espresso/30 bg-white text-espresso placeholder-espresso/50 focus:outline-none focus:border-espresso transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 font-lora">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-espresso text-ivory py-3 font-lora tracking-wide hover:bg-espresso/90 transition-colors"
            >
              Unlock
            </button>
          </form>

          <p className="text-center text-xs text-espresso/60 font-lora mt-8">
            We can't wait to celebrate with you
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory text-espresso">
      {/* Header */}
      <header className="bg-ivory border-b border-espresso/10 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-6 sm:px-8">
          <div className="text-center">
            <h1 className="font-playfair text-4xl sm:text-5xl font-600 mb-2">
              Ashley & Jared
            </h1>
            <p className="font-lora text-espresso/80">November 14th, 2026</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-2xl mx-auto px-6 sm:px-8 py-16 sm:py-20 text-center border-b border-espresso/10">
        <div className="mb-12">
          <p className="font-lora text-lg mb-2 text-espresso/70">Celebrating Our Love</p>
          <h2 className="font-playfair text-3xl sm:text-4xl font-600 mb-6">
            A Wedding Weekend in Atlanta
          </h2>
          <p className="font-lora text-base sm:text-lg text-espresso/80 max-w-lg mx-auto leading-relaxed">
            Join us as we celebrate with family and friends in the heart of Georgia.
            We've curated essential information to help you plan your visit.
          </p>
        </div>

        <div className="flex justify-center gap-12 pt-8">
          <div>
            <p className="font-playfair text-3xl font-600 mb-1">Atlanta</p>
            <p className="font-lora text-sm text-espresso/70">Georgia</p>
          </div>
        </div>
      </section>

      {/* Hotels Section */}
      <section className="max-w-2xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
        <div className="mb-12">
          <h2 className="font-playfair text-3xl font-600 mb-3">Accommodation</h2>
          <p className="font-lora text-espresso/70">
            Handpicked hotels in Atlanta for your stay
          </p>
        </div>

        <div className="space-y-6">
          {hotels.map((hotel) => (
            <a
              key={hotel.id}
              href={hotel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-espresso/20 p-6 sm:p-8 hover:border-espresso/60 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-playfair text-xl sm:text-2xl font-600 mb-1 group-hover:text-espresso transition-colors">
                    {hotel.name}
                  </h3>
                  <p className="font-lora text-sm text-espresso/70 mb-2">
                    {hotel.distance}
                  </p>
                </div>
                <div className="font-playfair text-2xl font-600 text-espresso/80 ml-4 flex-shrink-0">
                  {hotel.priceLevel}
                </div>
              </div>

              <p className="font-lora text-espresso/80 mb-4 leading-relaxed">
                {hotel.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {hotel.amenities.map((amenity, idx) => (
                  <span
                    key={idx}
                    className="font-lora text-xs px-3 py-1 bg-espresso/5 text-espresso/70"
                  >
                    {amenity}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 font-lora text-sm text-espresso/60 group-hover:text-espresso transition-colors">
                <span>Learn more</span>
                <span className="text-lg">→</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-6 sm:px-8 py-12 sm:py-16 border-t border-espresso/10 text-center">
        <p className="font-lora text-sm text-espresso/60 mb-4">
          See you soon in Atlanta
        </p>
        <p className="font-playfair text-2xl font-600 text-espresso/80 mb-6">
          with love,<br />Ashley & Jared
        </p>
        <button
          onClick={handleLogout}
          className="font-lora text-xs text-espresso/40 hover:text-espresso/60 transition-colors underline"
        >
          Logout (for testing)
        </button>
      </footer>
    </div>
  );
}
