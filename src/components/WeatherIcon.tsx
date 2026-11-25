import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Moon,
  Sun,
} from "lucide-react";

interface WeatherIconProps {
  category: "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";
  isDay?: boolean;
  className?: string;
}

export function WeatherIcon({
  category,
  isDay = true,
  className = "size-6",
}: WeatherIconProps) {
  switch (category) {
    case "clear":
      return isDay ? (
        <Sun className={`${className} text-amber-500`} aria-hidden="true" />
      ) : (
        <Moon className={`${className} text-indigo-400`} aria-hidden="true" />
      );
    case "fog":
      return <CloudFog className={`${className} text-slate-400`} aria-hidden="true" />;
    case "rain":
      return <CloudRain className={`${className} text-sky-500`} aria-hidden="true" />;
    case "snow":
      return <CloudSnow className={`${className} text-cyan-400`} aria-hidden="true" />;
    case "storm":
      return (
        <CloudLightning className={`${className} text-violet-500`} aria-hidden="true" />
      );
    default:
      return <Cloud className={`${className} text-slate-400`} aria-hidden="true" />;
  }
}
