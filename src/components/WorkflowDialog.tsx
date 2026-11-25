"use client";

import { CheckCircle2, Globe2, ServerCrash, X } from "lucide-react";
import type { SourceHealth } from "@/lib/types";
import { useModalDialog } from "@/lib/use-modal-dialog";

interface WorkflowDialogProps {
  open: boolean;
  onClose: () => void;
  sources: SourceHealth;
  fetchDurationMs: number;
  fetchedAt: string;
}

const API_ITEMS: Array<{
  key: keyof SourceHealth;
  name: string;
  endpoint: string;
  role: string;
}> = [
  {
    key: "weather",
    name: "Open-Meteo Forecast API",
    endpoint: "api.open-meteo.com/v1/forecast",
    role: "Current weather, 12h hourly curve, 7-day forecast & UV",
  },
  {
    key: "airQuality",
    name: "Open-Meteo Air Quality API",
    endpoint: "air-quality-api.open-meteo.com",
    role: "Live US AQI, PM2.5, PM10, NO₂ & Ozone",
  },
  {
    key: "fx",
    name: "ExchangeRate Open API",
    endpoint: "open.er-api.com/v6/latest/USD",
    role: "Real-time global currency rates (BDT, USD, EUR, GBP...)",
  },
  {
    key: "worldBank",
    name: "World Bank Country API",
    endpoint: "api.worldbank.org/v2/country",
    role: "Official country name, region & income classification",
  },
  {
    key: "wikipedia",
    name: "Wikipedia REST Summary API",
    endpoint: "en.wikipedia.org/api/rest_v1",
    role: "City summary brief & featured thumbnail",
  },
];

export function WorkflowDialog({
  open,
  onClose,
  sources,
  fetchDurationMs,
  fetchedAt,
}: WorkflowDialogProps) {
  const dialogRef = useModalDialog(open, onClose);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as Record<string, string>)}
      aria-labelledby="workflow-dialog-title"
    >
      <div className="flex flex-col max-h-[88dvh]">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-color)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Globe2 className="size-5 text-[var(--accent)]" aria-hidden="true" />
            <div>
              <h1 id="workflow-dialog-title" className="text-lg font-semibold">
                Live API Pipeline &amp; cPanel Export Status
              </h1>
              <p className="text-xs gp-muted">
                Aggregated in {fetchDurationMs} ms · Updated{" "}
                {new Date(fetchedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <form method="dialog">
            <button
              type="submit"
              aria-label="Close pipeline dialog"
              className="rounded-lg border border-[var(--border-color)] p-1.5 hover:border-[var(--accent)] cursor-pointer"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </form>
        </div>

        <div className="gp-scroll-region flex flex-col gap-4 p-5 text-sm">
          <div className="flex flex-col gap-2">
            {API_ITEMS.map((api) => {
              const ok = sources[api.key];
              return (
                <div
                  key={api.key}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border-color)] p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{api.name}</p>
                    <p className="text-xs gp-muted">{api.role}</p>
                    <p className="mt-1 truncate font-mono text-[11px] gp-muted">
                      {api.endpoint}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ok
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {ok ? (
                      <>
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        Live
                      </>
                    ) : (
                      <>
                        <ServerCrash className="size-3.5" aria-hidden="true" />
                        Fallback
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="gp-subtle rounded-xl p-4 text-xs leading-relaxed">
            <p className="font-semibold text-sm">How this runs on cPanel Shared Hosting</p>
            <p className="mt-1 gp-muted">
              Built with Next.js <code>output: &quot;export&quot;</code> so{" "}
              <code>npm run build</code> compiles a pre-rendered HTML/CSS/JS{" "}
              <code>out/</code> folder plus an Apache <code>.htaccess</code>. Zero Node.js
              server or API keys needed on cPanel — initial city data is baked at build
              time, and live searches, FX conversion, and city refreshes aggregate all 5
              CORS-enabled APIs in parallel with in-memory TTL caching.
            </p>
          </div>
        </div>
      </div>
    </dialog>
  );
}
