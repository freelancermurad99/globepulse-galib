"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, Star } from "lucide-react";
import { searchCities, STARTER_CITIES } from "@/lib/city-service";
import type { CitySearchResult } from "@/lib/types";

interface CitySearchBarProps {
  activeCity: CitySearchResult;
  pinnedCities: CitySearchResult[];
  onSelectCity: (city: CitySearchResult) => void;
}

export function CitySearchBar({
  activeCity,
  pinnedCities,
  onSelectCity,
}: CitySearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const matches = await searchCities(trimmed);
        setResults(matches);
        setIsOpen(true);
        setActiveIndex(matches.length > 0 ? 0 : -1);
      } catch {
        setSearchError("Could not reach geocoding service. Please retry.");
        setIsOpen(true);
      } finally {
        setIsSearching(false);
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function pickCity(city: CitySearchResult) {
    setQuery("");
    setIsOpen(false);
    setResults([]);
    onSelectCity(city);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isOpen && activeIndex >= 0 && results[activeIndex]) {
      pickCity(results[activeIndex]);
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const matches = await searchCities(trimmed);
      if (matches.length > 0) {
        pickCity(matches[0]);
      } else {
        setResults([]);
        setIsOpen(true);
      }
    } catch {
      setSearchError("Search request failed. Check your internet connection.");
      setIsOpen(true);
    } finally {
      setIsSearching(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && results.length > 0) {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => (prev + 1) % results.length);
      return;
    }
    if (e.key === "ArrowUp" && results.length > 0) {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
      return;
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (e.key === "Enter") {
      // IME-safe Enter handling for multi-language keyboards
      if (e.nativeEvent.isComposing || e.keyCode === 229) {
        e.preventDefault();
      }
    }
  }

  const quickCities = [
    ...pinnedCities,
    ...STARTER_CITIES.filter(
      (starter) =>
        !pinnedCities.some(
          (p) =>
            p.name.toLowerCase() === starter.name.toLowerCase() &&
            p.countryCode === starter.countryCode
        )
    ),
  ].slice(0, 8);

  return (
    <div className="flex flex-col gap-3" ref={containerRef}>
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-2"
        role="search"
      >
        <label htmlFor="city-search-input" className="sr-only">
          Search any city worldwide
        </label>
        <div className="relative flex-1 min-w-0">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 gp-muted"
            aria-hidden="true"
          />
          <input
            id="city-search-input"
            type="search"
            value={query}
            onChange={(e) => {
              const nextVal = e.target.value;
              setQuery(nextVal);
              if (nextVal.trim().length < 2) {
                setResults([]);
                setIsOpen(false);
                setSearchError(null);
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder="Search any city worldwide (e.g., Chittagong, Paris, Seoul, Toronto)..."
            autoComplete="off"
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-[var(--accent)]"
          />
          {isSearching && (
            <Loader2
              className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 animate-spin gp-muted"
              aria-hidden="true"
            />
          )}
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 cursor-pointer"
        >
          Explore
        </button>

        {isOpen && (
          <div className="gp-card gp-scroll-region absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 max-h-72 p-1.5 shadow-xl">
            {searchError ? (
              <p className="px-3 py-2 text-sm text-rose-500">{searchError}</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 text-sm gp-muted">
                No matching cities found for &ldquo;{query.trim()}&rdquo;.
              </p>
            ) : (
              <ul role="listbox" aria-label="Matching cities">
                {results.map((city, idx) => {
                  const isHighlighted = idx === activeIndex;
                  return (
                    <li key={`${city.id}-${city.latitude}`}>
                      <button
                        type="button"
                        onClick={() => pickCity(city)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition cursor-pointer ${
                          isHighlighted ? "gp-subtle" : "hover:bg-[var(--bg-subtle)]"
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <MapPin
                            className="size-4 shrink-0 text-[var(--accent)]"
                            aria-hidden="true"
                          />
                          <span className="truncate font-medium">{city.name}</span>
                          <span className="truncate text-xs gp-muted">
                            {[city.admin1, city.country].filter(Boolean).join(", ")}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-md gp-subtle px-2 py-0.5 font-mono text-xs gp-muted">
                          {city.countryCode}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium gp-muted">Quick switch:</span>
        {quickCities.map((city) => {
          const isCurrent =
            city.name.toLowerCase() === activeCity.name.toLowerCase() &&
            city.countryCode === activeCity.countryCode;
          const isPinned = pinnedCities.some(
            (p) =>
              p.name.toLowerCase() === city.name.toLowerCase() &&
              p.countryCode === city.countryCode
          );
          return (
            <button
              key={`${city.name}-${city.countryCode}`}
              type="button"
              onClick={() => pickCity(city)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                isCurrent
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)]"
              }`}
            >
              {isPinned && (
                <Star className="size-3 fill-amber-400 text-amber-500" aria-hidden="true" />
              )}
              <span>{city.name}</span>
              <span className="opacity-60">{city.countryCode}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
