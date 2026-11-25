import type {
  AirQualityMetrics,
  CityIntelligence,
  CitySearchResult,
  CountryMeta,
  CurrencySnapshot,
  DailyForecast,
  HourlyPoint,
  WeatherCurrent,
  WikiSummary,
} from "./types";

export const STARTER_CITIES: CitySearchResult[] = [
  {
    id: 1185241,
    name: "Dhaka",
    country: "Bangladesh",
    countryCode: "BD",
    admin1: "Dhaka Division",
    latitude: 23.7104,
    longitude: 90.4074,
    population: 10356500,
    timezone: "Asia/Dhaka",
  },
  {
    id: 1850147,
    name: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    admin1: "Tokyo",
    latitude: 35.6895,
    longitude: 139.6917,
    population: 9733276,
    timezone: "Asia/Tokyo",
  },
  {
    id: 2643743,
    name: "London",
    country: "United Kingdom",
    countryCode: "GB",
    admin1: "England",
    latitude: 51.5085,
    longitude: -0.1257,
    population: 8961989,
    timezone: "Europe/London",
  },
  {
    id: 5128581,
    name: "New York",
    country: "United States",
    countryCode: "US",
    admin1: "New York",
    latitude: 40.7143,
    longitude: -74.006,
    population: 8804190,
    timezone: "America/New_York",
  },
  {
    id: 1880252,
    name: "Singapore",
    country: "Singapore",
    countryCode: "SG",
    admin1: "Central Singapore",
    latitude: 1.2897,
    longitude: 103.8501,
    population: 5638700,
    timezone: "Asia/Singapore",
  },
  {
    id: 292223,
    name: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    admin1: "Dubai",
    latitude: 25.0772,
    longitude: 55.3093,
    population: 3478300,
    timezone: "Asia/Dubai",
  },
];

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  BD: "BDT",
  US: "USD",
  GB: "GBP",
  JP: "JPY",
  SG: "SGD",
  AE: "AED",
  SA: "SAR",
  QA: "QAR",
  IN: "INR",
  PK: "PKR",
  CN: "CNY",
  KR: "KRW",
  MY: "MYR",
  TH: "THB",
  ID: "IDR",
  VN: "VND",
  AU: "AUD",
  CA: "CAD",
  CH: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  TR: "TRY",
  BR: "BRL",
  MX: "MXN",
  ZA: "ZAR",
  EG: "EGP",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  PT: "EUR",
  BE: "EUR",
  AT: "EUR",
  IE: "EUR",
  FI: "EUR",
  GR: "EUR",
};

export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] ?? "USD";
}

export function describeWeatherCode(code: number, isDay = true): {
  label: string;
  category: "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";
  tip: string;
} {
  if (code === 0) {
    return {
      label: isDay ? "Clear Sky" : "Clear Night",
      category: "clear",
      tip: isDay
        ? "Great visibility outdoors; keep UV protection handy."
        : "Calm, clear conditions with steady overnight cooling.",
    };
  }
  if (code >= 1 && code <= 3) {
    const labels: Record<number, string> = {
      1: "Mainly Clear",
      2: "Partly Cloudy",
      3: "Overcast",
    };
    return {
      label: labels[code] ?? "Cloudy",
      category: "cloudy",
      tip: "Mild cloud cover — comfortable for walking or commuting.",
    };
  }
  if (code === 45 || code === 48) {
    return {
      label: "Fog / Mist",
      category: "fog",
      tip: "Reduced visibility on roads; allow extra commute buffer.",
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      label: code >= 63 || code >= 81 ? "Moderate to Heavy Rain" : "Light Rain / Drizzle",
      category: "rain",
      tip: "Carry an umbrella and watch for slower evening traffic.",
    };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return {
      label: "Snowfall",
      category: "snow",
      tip: "Dress in insulated layers and check local transit updates.",
    };
  }
  if (code >= 95) {
    return {
      label: "Thunderstorm",
      category: "storm",
      tip: "Avoid exposed outdoor areas until storm cells pass.",
    };
  }
  return {
    label: "Variable Sky",
    category: "cloudy",
    tip: "Conditions are shifting; review the 12-hour trend below.",
  };
}

export function describeAqi(aqi: number | null): {
  label: string;
  tone: "good" | "moderate" | "sensitive" | "unhealthy" | "unknown";
  advice: string;
} {
  if (aqi === null || Number.isNaN(aqi)) {
    return {
      label: "Unavailable",
      tone: "unknown",
      advice: "Live air monitoring station data is temporarily unavailable.",
    };
  }
  if (aqi <= 50) {
    return {
      label: "Good",
      tone: "good",
      advice: "Clean air quality — ideal for outdoor exercise and open windows.",
    };
  }
  if (aqi <= 100) {
    return {
      label: "Moderate",
      tone: "moderate",
      advice: "Acceptable air quality; unusually sensitive people should pace exertion.",
    };
  }
  if (aqi <= 150) {
    return {
      label: "Sensitive Groups",
      tone: "sensitive",
      advice: "Children and people with asthma should reduce prolonged outdoor effort.",
    };
  }
  return {
    label: aqi <= 200 ? "Unhealthy" : "Very Unhealthy",
    tone: "unhealthy",
    advice: "Prefer indoor ventilation and consider a N95 mask for long commutes.",
  };
}

// Lightweight client/build-time TTL cache so switching back to pinned cities feels instant
const intelligenceCache = new Map<string, { expiresAt: number; data: CityIntelligence }>();
const searchCache = new Map<string, { expiresAt: number; data: CitySearchResult[] }>();
let fxCache: { expiresAt: number; rates: Record<string, number>; updatedAtUtc: string | null } | null = null;

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 6500): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const clean = query.trim();
  if (clean.length < 2) {
    return [];
  }

  const cacheKey = clean.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  interface GeoApiResponse {
    results?: Array<{
      id: number;
      name: string;
      country?: string;
      country_code?: string;
      admin1?: string;
      latitude: number;
      longitude: number;
      population?: number;
      timezone?: string;
    }>;
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    clean
  )}&count=8&language=en&format=json`;
  const data = await fetchJsonWithTimeout<GeoApiResponse>(url);

  const seen = new Set<string>();
  const results: CitySearchResult[] = [];
  for (const item of data.results ?? []) {
    const cc = (item.country_code ?? "US").toUpperCase();
    const dedupeKey = `${item.name.toLowerCase()}|${cc}|${(item.admin1 ?? "").toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    results.push({
      id: item.id,
      name: item.name,
      country: item.country ?? cc,
      countryCode: cc,
      admin1: item.admin1,
      latitude: item.latitude,
      longitude: item.longitude,
      population: item.population,
      timezone: item.timezone,
    });
  }

  searchCache.set(cacheKey, { expiresAt: Date.now() + 10 * 60 * 1000, data: results });
  return results;
}

async function getLiveFxRates(): Promise<{
  rates: Record<string, number>;
  updatedAtUtc: string | null;
  ok: boolean;
}> {
  if (fxCache && fxCache.expiresAt > Date.now()) {
    return { rates: fxCache.rates, updatedAtUtc: fxCache.updatedAtUtc, ok: true };
  }

  interface FxResponse {
    result: string;
    time_last_update_utc?: string;
    rates?: Record<string, number>;
  }

  try {
    const data = await fetchJsonWithTimeout<FxResponse>("https://open.er-api.com/v6/latest/USD");
    if (data.result === "success" && data.rates) {
      fxCache = {
        expiresAt: Date.now() + 30 * 60 * 1000,
        rates: data.rates,
        updatedAtUtc: data.time_last_update_utc ?? null,
      };
      return { rates: data.rates, updatedAtUtc: fxCache.updatedAtUtc, ok: true };
    }
  } catch {
    // Graceful fallback handled below
  }

  return { rates: fxCache?.rates ?? {}, updatedAtUtc: fxCache?.updatedAtUtc ?? null, ok: false };
}

export async function getCityIntelligence(
  city: CitySearchResult,
  options?: { bypassCache?: boolean }
): Promise<CityIntelligence> {
  const cacheKey = `${city.name.toLowerCase()}:${city.latitude.toFixed(2)}:${city.longitude.toFixed(2)}`;
  const cached = intelligenceCache.get(cacheKey);
  if (!options?.bypassCache && cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  const lat = city.latitude.toFixed(4);
  const lon = city.longitude.toFixed(4);
  const cc = city.countryCode.toUpperCase();

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover,is_day` +
    `&hourly=temperature_2m,precipitation_probability,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset` +
    `&timezone=auto&forecast_days=7`;

  const aqiUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
    `&current=us_aqi,european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,carbon_monoxide`;

  const worldBankUrl = `https://api.worldbank.org/v2/country/${encodeURIComponent(cc)}?format=json`;
  const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    city.name.replace(/\s+/g, "_")
  )}`;

  interface WeatherApi {
    timezone?: string;
    utc_offset_seconds?: number;
    current?: {
      temperature_2m: number;
      apparent_temperature: number;
      relative_humidity_2m: number;
      wind_speed_10m: number;
      wind_direction_10m: number;
      surface_pressure: number;
      cloud_cover: number;
      weather_code: number;
      is_day: number;
      time: string;
    };
    hourly?: {
      time: string[];
      temperature_2m: number[];
      precipitation_probability: number[];
      weather_code: number[];
    };
    daily?: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_probability_max: number[];
      uv_index_max: number[];
      sunrise: string[];
      sunset: string[];
    };
  }

  interface AqiApi {
    current?: {
      us_aqi?: number;
      european_aqi?: number;
      pm2_5?: number;
      pm10?: number;
      nitrogen_dioxide?: number;
      ozone?: number;
      carbon_monoxide?: number;
    };
  }

  type WorldBankApi = [
    unknown,
    Array<{
      name?: string;
      region?: { value?: string };
      incomeLevel?: { value?: string };
      capitalCity?: string;
    }>?
  ];

  interface WikiApi {
    type?: string;
    title?: string;
    extract?: string;
    thumbnail?: { source?: string };
    content_urls?: { desktop?: { page?: string } };
  }

  const [weatherRes, aqiRes, fxRes, wbRes, wikiRes] = await Promise.allSettled([
    fetchJsonWithTimeout<WeatherApi>(weatherUrl),
    fetchJsonWithTimeout<AqiApi>(aqiUrl),
    getLiveFxRates(),
    fetchJsonWithTimeout<WorldBankApi>(worldBankUrl),
    fetchJsonWithTimeout<WikiApi>(wikiUrl),
  ]);

  let weather: WeatherCurrent | null = null;
  let hourly: HourlyPoint[] = [];
  let daily: DailyForecast[] = [];
  let timezone = city.timezone ?? "UTC";
  let utcOffsetSeconds = 0;

  if (weatherRes.status === "fulfilled") {
    const w = weatherRes.value;
    timezone = w.timezone ?? timezone;
    utcOffsetSeconds = w.utc_offset_seconds ?? 0;

    if (w.current) {
      weather = {
        temperature: w.current.temperature_2m,
        apparentTemperature: w.current.apparent_temperature,
        humidity: w.current.relative_humidity_2m,
        windSpeed: w.current.wind_speed_10m,
        windDirection: w.current.wind_direction_10m,
        pressure: w.current.surface_pressure,
        cloudCover: w.current.cloud_cover,
        weatherCode: w.current.weather_code,
        isDay: w.current.is_day === 1,
        time: w.current.time,
      };
    }

    if (w.hourly?.time?.length) {
      const currentIso = w.current?.time ?? w.hourly.time[0];
      const startIndex = Math.max(
        0,
        w.hourly.time.findIndex((t) => t >= currentIso)
      );
      hourly = w.hourly.time.slice(startIndex, startIndex + 12).map((time, idx) => {
        const i = startIndex + idx;
        return {
          time,
          temperature: w.hourly!.temperature_2m[i] ?? 0,
          precipitationProbability: w.hourly!.precipitation_probability[i] ?? 0,
          weatherCode: w.hourly!.weather_code[i] ?? 0,
        };
      });
    }

    if (w.daily?.time?.length) {
      daily = w.daily.time.map((date, i) => ({
        date,
        weatherCode: w.daily!.weather_code[i] ?? 0,
        tempMax: w.daily!.temperature_2m_max[i] ?? 0,
        tempMin: w.daily!.temperature_2m_min[i] ?? 0,
        precipitationProbabilityMax: w.daily!.precipitation_probability_max[i] ?? 0,
        uvIndexMax: w.daily!.uv_index_max[i] ?? 0,
        sunrise: w.daily!.sunrise[i] ?? "",
        sunset: w.daily!.sunset[i] ?? "",
      }));
    }
  }

  let airQuality: AirQualityMetrics | null = null;
  if (aqiRes.status === "fulfilled" && aqiRes.value.current) {
    const a = aqiRes.value.current;
    airQuality = {
      usAqi: a.us_aqi ?? null,
      europeanAqi: a.european_aqi ?? null,
      pm25: a.pm2_5 ?? null,
      pm10: a.pm10 ?? null,
      no2: a.nitrogen_dioxide ?? null,
      ozone: a.ozone ?? null,
      co: a.carbon_monoxide ?? null,
    };
  }

  const localCurrency = getCurrencyForCountry(cc);
  const fxData =
    fxRes.status === "fulfilled" ? fxRes.value : { rates: {}, updatedAtUtc: null, ok: false };
  const currency: CurrencySnapshot = {
    localCurrency,
    usdToLocal: fxData.rates[localCurrency] ?? null,
    usdToBdt: fxData.rates.BDT ?? null,
    usdToEur: fxData.rates.EUR ?? null,
    usdToGbp: fxData.rates.GBP ?? null,
    rates: fxData.rates,
    updatedAtUtc: fxData.updatedAtUtc,
  };

  let countryMeta: CountryMeta | null = null;
  if (wbRes.status === "fulfilled" && Array.isArray(wbRes.value) && wbRes.value[1]?.[0]) {
    const row = wbRes.value[1][0];
    countryMeta = {
      officialName: row.name ?? city.country,
      region: row.region?.value ?? "Global",
      incomeLevel: row.incomeLevel?.value ?? "Not classified",
      capitalCity: row.capitalCity ?? "",
    };
  }

  let wiki: WikiSummary | null = null;
  if (
    wikiRes.status === "fulfilled" &&
    wikiRes.value.type !== "disambiguation" &&
    wikiRes.value.extract
  ) {
    wiki = {
      title: wikiRes.value.title ?? city.name,
      extract: wikiRes.value.extract,
      thumbnailUrl: wikiRes.value.thumbnail?.source ?? null,
      pageUrl: wikiRes.value.content_urls?.desktop?.page ?? null,
    };
  }

  const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  const payload: CityIntelligence = {
    city,
    timezone,
    utcOffsetSeconds,
    weather,
    hourly,
    daily,
    airQuality,
    currency,
    countryMeta,
    wiki,
    sources: {
      weather: weather !== null,
      airQuality: airQuality !== null,
      fx: fxData.ok && Object.keys(fxData.rates).length > 0,
      worldBank: countryMeta !== null,
      wikipedia: wiki !== null,
    },
    fetchDurationMs: Math.max(1, Math.round(endedAt - startedAt)),
    fetchedAt: new Date().toISOString(),
  };

  intelligenceCache.set(cacheKey, {
    expiresAt: Date.now() + 5 * 60 * 1000,
    data: payload,
  });

  return payload;
}
