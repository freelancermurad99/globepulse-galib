"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  describeAqi,
  describeWeatherCode,
  getCityIntelligence,
  STARTER_CITIES,
} from "@/lib/city-service";
import type { CityIntelligence, CitySearchResult } from "@/lib/types";
import { useModalDialog } from "@/lib/use-modal-dialog";

interface CompareDialogProps {
  open: boolean;
  onClose: () => void;
  activeCity: CitySearchResult;
  pinnedCities: CitySearchResult[];
}

export function CompareDialog({
  open,
  onClose,
  activeCity,
  pinnedCities,
}: CompareDialogProps) {
  const dialogRef = useModalDialog(open, onClose);
  const [rows, setRows] = useState<CityIntelligence[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const citiesToCompare = useMemo(() => {
    const candidates = [activeCity, ...pinnedCities, ...STARTER_CITIES];
    const unique: CitySearchResult[] = [];
    for (const item of candidates) {
      if (
        !unique.some(
          (u) =>
            u.name.toLowerCase() === item.name.toLowerCase() &&
            u.countryCode === item.countryCode
        )
      ) {
        unique.push(item);
      }
      if (unique.length >= 4) break;
    }
    return unique;
  }, [activeCity, pinnedCities]);

  const requestKey = useMemo(
    () => citiesToCompare.map((c) => `${c.name}:${c.countryCode}`).join("|"),
    [citiesToCompare]
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    Promise.all(citiesToCompare.map((city) => getCityIntelligence(city))).then(
      (data) => {
        if (!cancelled) {
          setRows(data);
          setLoadedKey(requestKey);
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [open, citiesToCompare, requestKey]);

  const loading = open && loadedKey !== requestKey;

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as Record<string, string>)}
      aria-labelledby="compare-dialog-title"
    >
      <div className="flex flex-col max-h-[88dvh]">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-color)] px-5 py-4">
          <div>
            <h1 id="compare-dialog-title" className="text-lg font-semibold">
              Side-by-Side Live City Comparison
            </h1>
            <p className="text-xs gp-muted">
              Parallel live telemetry across your active and pinned/starter cities.
            </p>
          </div>
          <form method="dialog">
            <button
              type="submit"
              aria-label="Close comparison dialog"
              className="rounded-lg border border-[var(--border-color)] p-1.5 hover:border-[var(--accent)] cursor-pointer"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </form>
        </div>

        <div className="gp-scroll-region p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm gp-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Fetching live weather, AQI, and FX for 4 cities in parallel...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wider gp-muted">
                    <th className="py-2.5 pr-4 font-semibold">City</th>
                    <th className="py-2.5 px-3 font-semibold">Temp</th>
                    <th className="py-2.5 px-3 font-semibold">Condition</th>
                    <th className="py-2.5 px-3 font-semibold">US AQI</th>
                    <th className="py-2.5 px-3 font-semibold">PM2.5</th>
                    <th className="py-2.5 pl-3 font-semibold">1 USD Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {rows.map((item) => {
                    const cond = item.weather
                      ? describeWeatherCode(item.weather.weatherCode, item.weather.isDay)
                      : null;
                    const aqiInfo = describeAqi(item.airQuality?.usAqi ?? null);
                    return (
                      <tr key={`${item.city.name}-${item.city.countryCode}`}>
                        <td className="py-3 pr-4 font-medium">
                          {item.city.name}
                          <span className="ml-1.5 text-xs gp-muted">
                            {item.city.countryCode}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold">
                          {item.weather ? `${Math.round(item.weather.temperature)}°C` : "—"}
                        </td>
                        <td className="py-3 px-3">{cond?.label ?? "—"}</td>
                        <td className="py-3 px-3 font-mono">
                          {item.airQuality?.usAqi ?? "—"} ({aqiInfo.label})
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {item.airQuality?.pm25 !== null && item.airQuality?.pm25 !== undefined
                            ? `${item.airQuality.pm25.toFixed(1)} µg/m³`
                            : "—"}
                        </td>
                        <td className="py-3 pl-3 font-mono">
                          {item.currency.usdToLocal !== null
                            ? `${item.currency.usdToLocal.toFixed(2)} ${item.currency.localCurrency}`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
