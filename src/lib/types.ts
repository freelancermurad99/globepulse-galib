export interface CitySearchResult {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  population?: number;
  timezone?: string;
}

export interface WeatherCurrent {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  cloudCover: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
}

export interface HourlyPoint {
  time: string;
  temperature: number;
  precipitationProbability: number;
  weatherCode: number;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbabilityMax: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
}

export interface AirQualityMetrics {
  usAqi: number | null;
  europeanAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  ozone: number | null;
  co: number | null;
}

export interface CurrencySnapshot {
  localCurrency: string;
  usdToLocal: number | null;
  usdToBdt: number | null;
  usdToEur: number | null;
  usdToGbp: number | null;
  rates: Record<string, number>;
  updatedAtUtc: string | null;
}

export interface CountryMeta {
  officialName: string;
  region: string;
  incomeLevel: string;
  capitalCity: string;
}

export interface WikiSummary {
  title: string;
  extract: string;
  thumbnailUrl: string | null;
  pageUrl: string | null;
}

export interface SourceHealth {
  weather: boolean;
  airQuality: boolean;
  fx: boolean;
  worldBank: boolean;
  wikipedia: boolean;
}

export interface CityIntelligence {
  city: CitySearchResult;
  timezone: string;
  utcOffsetSeconds: number;
  weather: WeatherCurrent | null;
  hourly: HourlyPoint[];
  daily: DailyForecast[];
  airQuality: AirQualityMetrics | null;
  currency: CurrencySnapshot;
  countryMeta: CountryMeta | null;
  wiki: WikiSummary | null;
  sources: SourceHealth;
  fetchDurationMs: number;
  fetchedAt: string;
}
