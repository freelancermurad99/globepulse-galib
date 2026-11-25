"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Activity,
  Droplets,
  ExternalLink,
  GitCompareArrows,
  Globe2,
  RefreshCw,
  Share2,
  Star,
  Sunrise,
  Sunset,
  Wind,
} from "lucide-react";
import {
  describeAqi,
  describeWeatherCode,
  getCityIntelligence,
  STARTER_CITIES,
} from "@/lib/city-service";
import type { CityIntelligence, CitySearchResult } from "@/lib/types";
import { CitySearchBar } from "./CitySearchBar";
import { CompareDialog } from "./CompareDialog";
import { FxConverterCard } from "./FxConverterCard";
import { WeatherIcon } from "./WeatherIcon";
import { WorkflowDialog } from "./WorkflowDialog";

interface GlobePulseDashboardProps {
  initialData: CityIntelligence;
}

const PINNED_STORAGE_KEY = "globepulse_pinned_cities_v1";
const PINNED_EVENT = "globepulse-pinned-change";
const EMPTY_PINNED: CitySearchResult[] = [];

let cachedPinnedRaw: string | null = null;
let cachedPinnedParsed: CitySearchResult[] = EMPTY_PINNED;

function readPinnedSnapshot(): CitySearchResult[] {
  if (typeof window === "undefined") return EMPTY_PINNED;
  try {
    const raw = localStorage.getItem(PINNED_STORAGE_KEY);
    if (raw === cachedPinnedRaw) return cachedPinnedParsed;
    cachedPinnedRaw = raw;
    if (!raw) {
      cachedPinnedParsed = EMPTY_PINNED;
      return EMPTY_PINNED;
    }
    const parsed = JSON.parse(raw) as CitySearchResult[];
    cachedPinnedParsed = Array.isArray(parsed) ? parsed : EMPTY_PINNED;
    return cachedPinnedParsed;
  } catch {
    return EMPTY_PINNED;
  }
}

function subscribePinned(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(PINNED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PINNED_EVENT, callback);
  };
}

function formatLocalClock(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
  } catch {
    return "Local time";
  }
}

function formatHourLabel(iso: string): string {
  const part = iso.split("T")[1];
  return part ? part.slice(0, 5) : iso;
}

function formatDayLabel(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  try {
    return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
      new Date(`${dateStr}T12:00:00Z`)
    );
  } catch {
    return dateStr;
  }
}

export function GlobePulseDashboard({ initialData }: GlobePulseDashboardProps) {
  const [data, setData] = useState<CityIntelligence>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pinnedCities = useSyncExternalStore(
    subscribePinned,
    readPinnedSnapshot,
    () => EMPTY_PINNED
  );
  const [compareOpen, setCompareOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Hydrate deep-linked URL query or refresh live telemetry on mount
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const qCity = params.get("city");
    const qLat = Number.parseFloat(params.get("lat") ?? "");
    const qLon = Number.parseFloat(params.get("lon") ?? "");
    const qCc = params.get("cc");

    const targetCity: CitySearchResult =
      qCity && Number.isFinite(qLat) && Number.isFinite(qLon) && qCc
        ? {
            id: 0,
            name: qCity,
            country: params.get("country") ?? qCc,
            countryCode: qCc.toUpperCase(),
            latitude: qLat,
            longitude: qLon,
          }
        : STARTER_CITIES[0];

    getCityIntelligence(targetCity)
      .then((fresh) => {
        if (!cancelled) setData(fresh);
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMsg("Live telemetry could not be refreshed. Showing baked snapshot.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadCity(
    city: CitySearchResult,
    options?: { bypassCache?: boolean; syncUrl?: boolean }
  ) {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const fresh = await getCityIntelligence(city, {
        bypassCache: options?.bypassCache,
      });
      setData(fresh);

      if (options?.syncUrl !== false && typeof window !== "undefined") {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("city", city.name);
        nextUrl.searchParams.set("lat", city.latitude.toFixed(4));
        nextUrl.searchParams.set("lon", city.longitude.toFixed(4));
        nextUrl.searchParams.set("cc", city.countryCode);
        nextUrl.searchParams.set("country", city.country);
        window.history.replaceState({}, "", nextUrl.toString());
      }
    } catch {
      setErrorMsg("Live telemetry could not be refreshed. Showing last available snapshot.");
    } finally {
      setIsLoading(false);
    }
  }

  function togglePinCity(city: CitySearchResult) {
    const exists = pinnedCities.some(
      (p) =>
        p.name.toLowerCase() === city.name.toLowerCase() &&
        p.countryCode === city.countryCode
    );
    const updated = exists
      ? pinnedCities.filter(
          (p) =>
            !(
              p.name.toLowerCase() === city.name.toLowerCase() &&
              p.countryCode === city.countryCode
            )
        )
      : [city, ...pinnedCities].slice(0, 6);

    try {
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(PINNED_EVENT));
    } catch {
      // Ignore storage quota errors
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      // Fallback ignored if clipboard denied
    }
  }

  const activeSources = Object.values(data.sources).filter(Boolean).length;
  const isPinned = pinnedCities.some(
    (p) =>
      p.name.toLowerCase() === data.city.name.toLowerCase() &&
      p.countryCode === data.city.countryCode
  );
  const weatherInfo = data.weather
    ? describeWeatherCode(data.weather.weatherCode, data.weather.isDay)
    : null;
  const aqiInfo = describeAqi(data.airQuality?.usAqi ?? null);

  const hourlyTemps = data.hourly.map((h) => h.temperature);
  const minHourly = hourlyTemps.length ? Math.min(...hourlyTemps) : 0;
  const maxHourly = hourlyTemps.length ? Math.max(...hourlyTemps) : 1;
  const hourlySpan = Math.max(1, maxHourly - minHourly);

  const weekMins = data.daily.map((d) => d.tempMin);
  const weekMaxs = data.daily.map((d) => d.tempMax);
  const weekLow = weekMins.length ? Math.min(...weekMins) : 0;
  const weekHigh = weekMaxs.length ? Math.max(...weekMaxs) : 1;
  const weekSpan = Math.max(1, weekHigh - weekLow);

  const aqiBadgeClass =
    aqiInfo.tone === "good"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : aqiInfo.tone === "moderate"
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : aqiInfo.tone === "sensitive"
      ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
      : aqiInfo.tone === "unhealthy"
      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
      : "gp-subtle gp-muted";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Navbar */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-sm">
            <Globe2 className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">GlobePulse</h1>
            <p className="text-xs gp-muted">
              Live City Weather, Air Quality &amp; FX Intelligence
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWorkflowOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--accent)] cursor-pointer"
          >
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>{activeSources}/5 Live APIs</span>
            <span className="font-mono gp-muted">{data.fetchDurationMs}ms</span>
          </button>

          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-xs font-medium transition hover:border-[var(--accent)] cursor-pointer"
          >
            <GitCompareArrows className="size-3.5" aria-hidden="true" />
            Compare Cities
          </button>

          <button
            type="button"
            onClick={() => loadCity(data.city, { bypassCache: true })}
            disabled={isLoading}
            aria-label="Refresh live city data"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--accent)] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
      </header>

      {/* Search & Watchlist */}
      <CitySearchBar
        activeCity={data.city}
        pinnedCities={pinnedCities}
        onSelectCity={(city) => loadCity(city)}
      />

      {errorMsg && (
        <div
          role="status"
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300"
        >
          {errorMsg}
        </div>
      )}

      {/* Hero City Banner */}
      <section className="gp-card overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            {data.wiki?.thumbnailUrl && (
              <Image
                src={data.wiki.thumbnailUrl}
                alt={`${data.city.name} skyline or landmark`}
                width={80}
                height={80}
                className="hidden sm:block size-20 shrink-0 rounded-xl object-cover border border-[var(--border-color)]"
              />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {data.city.name}
                </h2>
                <span className="rounded-md gp-subtle px-2 py-0.5 text-xs font-medium">
                  {[data.city.admin1, data.city.country].filter(Boolean).join(", ")}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs gp-muted">
                <span>Local time: {formatLocalClock(data.timezone)}</span>
                <span className="font-mono">
                  {data.city.latitude.toFixed(2)}°, {data.city.longitude.toFixed(2)}°
                </span>
                {data.city.population ? (
                  <span>Pop. {data.city.population.toLocaleString()}</span>
                ) : null}
              </div>

              {data.wiki?.extract && (
                <p className="mt-2.5 line-clamp-2 max-w-2xl text-sm leading-relaxed gp-muted">
                  {data.wiki.extract}{" "}
                  {data.wiki.pageUrl && (
                    <a
                      href={data.wiki.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-medium text-[var(--accent)] hover:underline"
                    >
                      Wiki <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => togglePinCity(data.city)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition cursor-pointer ${
                isPinned
                  ? "border-amber-400/60 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                  : "border-[var(--border-color)] hover:border-[var(--accent)]"
              }`}
            >
              <Star
                className={`size-3.5 ${isPinned ? "fill-amber-400 text-amber-500" : ""}`}
                aria-hidden="true"
              />
              {isPinned ? "Pinned" : "Pin City"}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-3.5 py-2 text-xs font-medium transition hover:border-[var(--accent)] cursor-pointer"
            >
              <Share2 className="size-3.5" aria-hidden="true" />
              {copiedShare ? "Link Copied!" : "Share Link"}
            </button>
          </div>
        </div>
      </section>

      {/* Main Intelligence Bento Grid */}
      <main className="gp-bento-grid">
        {/* Card 1: Live Weather + 12h Curve */}
        <section className="gp-card flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider gp-muted">
                Live Weather
              </p>
              <div className="mt-1 flex items-baseline gap-2.5">
                <span className="font-mono text-4xl font-bold tracking-tight">
                  {data.weather ? `${Math.round(data.weather.temperature)}°C` : "—"}
                </span>
                {data.weather && (
                  <span className="text-sm gp-muted">
                    Feels {Math.round(data.weather.apparentTemperature)}°C
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-medium">
                {weatherInfo?.label ?? "Weather unavailable"}
              </p>
            </div>
            {weatherInfo && (
              <div className="gp-subtle rounded-2xl p-3">
                <WeatherIcon
                  category={weatherInfo.category}
                  isDay={data.weather?.isDay}
                  className="size-8"
                />
              </div>
            )}
          </div>

          {weatherInfo && (
            <p className="gp-subtle rounded-xl px-3 py-2 text-xs gp-muted">
              {weatherInfo.tip}
            </p>
          )}

          {data.weather && (
            <div className="gp-metrics-grid">
              <div className="gp-subtle rounded-xl p-3">
                <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide gp-muted">
                  <Droplets className="size-3" aria-hidden="true" /> Humidity
                </p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {data.weather.humidity}%
                </p>
              </div>
              <div className="gp-subtle rounded-xl p-3">
                <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide gp-muted">
                  <Wind className="size-3" aria-hidden="true" /> Wind
                </p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {Math.round(data.weather.windSpeed)} km/h
                </p>
              </div>
            </div>
          )}

          {data.hourly.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium gp-muted">Next 12h Temperature</p>
              <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
                {data.hourly.map((pt) => {
                  const pct = ((pt.temperature - minHourly) / hourlySpan) * 100;
                  return (
                    <div
                      key={pt.time}
                      className="flex flex-col items-center gap-1 rounded-lg gp-subtle px-1 py-2"
                    >
                      <span className="font-mono text-[10px] font-semibold">
                        {Math.round(pt.temperature)}°
                      </span>
                      <div className="flex h-10 w-1.5 items-end rounded-full bg-black/10 dark:bg-white/10">
                        <div
                          className="w-full rounded-full bg-[var(--accent)]"
                          style={{ height: `${Math.max(18, Math.round(pct))}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] gp-muted">
                        {formatHourLabel(pt.time).slice(0, 2)}h
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Card 2: Air Quality & Health */}
        <section className="gp-card flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider gp-muted">
                Air Quality Index
              </p>
              <div className="mt-1 flex items-baseline gap-2.5">
                <span className="font-mono text-4xl font-bold tracking-tight">
                  {data.airQuality?.usAqi ?? "—"}
                </span>
                <span className="text-xs font-medium gp-muted">US AQI</span>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${aqiBadgeClass}`}
            >
              <Activity className="size-3.5" aria-hidden="true" />
              {aqiInfo.label}
            </span>
          </div>

          <p className="gp-subtle rounded-xl px-3 py-2 text-xs leading-relaxed gp-muted">
            {aqiInfo.advice}
          </p>

          <div className="gp-metrics-grid">
            <div className="gp-subtle rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-wide gp-muted">PM2.5</p>
              <p className="mt-1 font-mono text-base font-semibold">
                {data.airQuality?.pm25 !== null && data.airQuality?.pm25 !== undefined
                  ? `${data.airQuality.pm25.toFixed(1)}`
                  : "—"}
                <span className="ml-1 text-xs font-normal gp-muted">µg/m³</span>
              </p>
            </div>
            <div className="gp-subtle rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-wide gp-muted">PM10</p>
              <p className="mt-1 font-mono text-base font-semibold">
                {data.airQuality?.pm10 !== null && data.airQuality?.pm10 !== undefined
                  ? `${data.airQuality.pm10.toFixed(1)}`
                  : "—"}
                <span className="ml-1 text-xs font-normal gp-muted">µg/m³</span>
              </p>
            </div>
            <div className="gp-subtle rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-wide gp-muted">NO₂</p>
              <p className="mt-1 font-mono text-base font-semibold">
                {data.airQuality?.no2 !== null && data.airQuality?.no2 !== undefined
                  ? `${data.airQuality.no2.toFixed(1)}`
                  : "—"}
                <span className="ml-1 text-xs font-normal gp-muted">µg/m³</span>
              </p>
            </div>
            <div className="gp-subtle rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-wide gp-muted">Ozone (O₃)</p>
              <p className="mt-1 font-mono text-base font-semibold">
                {data.airQuality?.ozone !== null && data.airQuality?.ozone !== undefined
                  ? `${data.airQuality.ozone.toFixed(1)}`
                  : "—"}
                <span className="ml-1 text-xs font-normal gp-muted">µg/m³</span>
              </p>
            </div>
          </div>

          {data.daily[0] && (
            <div className="mt-auto flex items-center justify-between rounded-xl border border-[var(--border-color)] px-3.5 py-2.5 text-xs">
              <span className="inline-flex items-center gap-1.5 gp-muted">
                <Sunrise className="size-3.5 text-amber-500" aria-hidden="true" />
                {formatHourLabel(data.daily[0].sunrise)}
              </span>
              <span className="font-mono gp-muted">
                UV Max {data.daily[0].uvIndexMax.toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1.5 gp-muted">
                <Sunset className="size-3.5 text-orange-500" aria-hidden="true" />
                {formatHourLabel(data.daily[0].sunset)}
              </span>
            </div>
          )}
        </section>

        {/* Card 3: Live FX & Country Economy */}
        <FxConverterCard
          currency={data.currency}
          countryMeta={data.countryMeta}
          countryName={data.city.country}
        />
      </main>

      {/* 7-Day Forecast Matrix */}
      {data.daily.length > 0 && (
        <section className="gp-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">7-Day Extended Forecast</h2>
              <p className="text-xs gp-muted">
                Daily temperature range, rain probability, and UV peak for {data.city.name}
              </p>
            </div>
            <span className="font-mono text-xs gp-muted">Timezone: {data.timezone}</span>
          </div>

          <div className="flex flex-col divide-y divide-[var(--border-color)]">
            {data.daily.map((day, idx) => {
              const info = describeWeatherCode(day.weatherCode, true);
              const leftPct = ((day.tempMin - weekLow) / weekSpan) * 100;
              const widthPct = ((day.tempMax - day.tempMin) / weekSpan) * 100;
              return (
                <div
                  key={day.date}
                  className="grid grid-cols-[4.5rem_2rem_1fr_5.5rem] items-center gap-3 py-2.5 text-sm sm:grid-cols-[5.5rem_10rem_1fr_7rem]"
                >
                  <span className="font-medium">{formatDayLabel(day.date, idx)}</span>

                  <div className="flex items-center gap-2 min-w-0">
                    <WeatherIcon category={info.category} className="size-4 shrink-0" />
                    <span className="hidden truncate text-xs gp-muted sm:inline">
                      {info.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 text-right font-mono text-xs gp-muted">
                      {Math.round(day.tempMin)}°
                    </span>
                    <div className="relative h-2 flex-1 rounded-full gp-subtle">
                      <div
                        className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-500 to-amber-500"
                        style={{
                          left: `${Math.max(0, Math.min(92, leftPct))}%`,
                          width: `${Math.max(8, Math.min(100 - leftPct, widthPct))}%`,
                        }}
                      />
                    </div>
                    <span className="w-9 font-mono text-xs font-semibold">
                      {Math.round(day.tempMax)}°
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 font-mono text-xs gp-muted">
                    <span>{day.precipitationProbabilityMax}% rain</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <footer className="pb-4 text-center text-xs gp-muted">
        GlobePulse · Static-Export Ready for cPanel Shared Hosting · Live data from
        Open-Meteo, ExchangeRate-API, World Bank &amp; Wikipedia
      </footer>

      <CompareDialog
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        activeCity={data.city}
        pinnedCities={pinnedCities}
      />

      <WorkflowDialog
        open={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
        sources={data.sources}
        fetchDurationMs={data.fetchDurationMs}
        fetchedAt={data.fetchedAt}
      />
    </div>
  );
}
