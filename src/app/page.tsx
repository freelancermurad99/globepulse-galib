import { GlobePulseDashboard } from "@/components/GlobePulseDashboard";
import { getCityIntelligence, STARTER_CITIES } from "@/lib/city-service";

export default async function HomePage() {
  // Pre-render Dhaka snapshot at build time so exported out/index.html ships full SEO & instant first paint
  const initialData = await getCityIntelligence(STARTER_CITIES[0]);

  return <GlobePulseDashboard initialData={initialData} />;
}
