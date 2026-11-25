"use client";

import { useState } from "react";
import { ArrowLeftRight, Building2, Coins } from "lucide-react";
import type { CountryMeta, CurrencySnapshot } from "@/lib/types";

interface FxConverterCardProps {
  currency: CurrencySnapshot;
  countryMeta: CountryMeta | null;
  countryName: string;
}

const MAJOR_CURRENCIES = ["USD", "BDT", "EUR", "GBP", "JPY", "AED", "SGD", "INR", "CAD"];

export function FxConverterCard({
  currency,
  countryMeta,
  countryName,
}: FxConverterCardProps) {
  const [amountInput, setAmountInput] = useState("100");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toOverride, setToOverride] = useState<string | null>(null);

  const toCurrency =
    toOverride ?? (currency.localCurrency === "USD" ? "BDT" : currency.localCurrency);

  const amount = Number.parseFloat(amountInput);
  const safeAmount = Number.isFinite(amount) && amount >= 0 ? amount : 0;

  const fromRate = currency.rates[fromCurrency] ?? (fromCurrency === "USD" ? 1 : null);
  const toRate = currency.rates[toCurrency] ?? (toCurrency === "USD" ? 1 : null);

  const converted =
    fromRate && toRate ? (safeAmount / fromRate) * toRate : null;

  const unitRate = fromRate && toRate ? toRate / fromRate : null;

  const currencyOptions = Array.from(
    new Set([currency.localCurrency, ...MAJOR_CURRENCIES])
  ).filter((code) => code === "USD" || Boolean(currency.rates[code]));

  return (
    <section className="gp-card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider gp-muted">
            FX &amp; Economy
          </p>
          <h2 className="mt-0.5 text-lg font-semibold">
            {countryMeta?.officialName ?? countryName}
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full gp-subtle px-2.5 py-1 text-xs font-medium">
          <Coins className="size-3.5 text-amber-500" aria-hidden="true" />
          {currency.localCurrency}
        </span>
      </div>

      {countryMeta && (
        <div className="gp-metrics-grid">
          <div className="gp-subtle rounded-xl p-3">
            <p className="text-[11px] uppercase tracking-wide gp-muted">Region</p>
            <p className="mt-1 text-sm font-medium">{countryMeta.region}</p>
          </div>
          <div className="gp-subtle rounded-xl p-3">
            <p className="text-[11px] uppercase tracking-wide gp-muted">Income Tier</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-medium">
              <Building2 className="size-3.5 gp-muted shrink-0" aria-hidden="true" />
              <span className="truncate">{countryMeta.incomeLevel}</span>
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border-color)] p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium gp-muted">Live Currency Converter</span>
          {unitRate !== null && (
            <span className="font-mono text-xs gp-muted">
              1 {fromCurrency} = {unitRate.toFixed(unitRate >= 10 ? 2 : 4)} {toCurrency}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="fx-amount" className="sr-only">
            Amount to convert
          </label>
          <input
            id="fx-amount"
            type="number"
            min="0"
            step="any"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="w-24 flex-1 min-w-20 rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] px-3 py-2 font-mono text-sm outline-none focus:border-[var(--accent)]"
          />

          <label htmlFor="fx-from" className="sr-only">
            From currency
          </label>
          <select
            id="fx-from"
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] px-2.5 py-2 font-mono text-sm outline-none focus:border-[var(--accent)]"
          >
            {currencyOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>

          <button
            type="button"
            aria-label="Swap currencies"
            onClick={() => {
              const prevFrom = fromCurrency;
              setFromCurrency(toCurrency);
              setToOverride(prevFrom);
            }}
            className="rounded-lg border border-[var(--border-color)] p-2 hover:border-[var(--accent)] cursor-pointer"
          >
            <ArrowLeftRight className="size-4" aria-hidden="true" />
          </button>

          <label htmlFor="fx-to" className="sr-only">
            To currency
          </label>
          <select
            id="fx-to"
            value={toCurrency}
            onChange={(e) => setToOverride(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] px-2.5 py-2 font-mono text-sm outline-none focus:border-[var(--accent)]"
          >
            {currencyOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex items-baseline justify-between rounded-lg gp-subtle px-3 py-2.5">
          <span className="text-xs gp-muted">Converted Result</span>
          <span className="font-mono text-lg font-semibold">
            {converted !== null
              ? `${converted.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} ${toCurrency}`
              : "Rate unavailable"}
          </span>
        </div>
      </div>
    </section>
  );
}
