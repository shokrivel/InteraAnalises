import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função auxiliar para determinar o tipo de profissional a partir da especialidade/diagnóstico
function determineProviderType(keyword?: string): string {
  if (!keyword) return "doctor";
  const lower = keyword.toLowerCase();

  if (lower.includes("cardio")) return "cardiologist";
  if (lower.includes("derma") || lower.includes("pele")) return "dermatologist";
  if (lower.includes("psiqu")) return "psychiatrist";
  if (lower.includes("psico")) return "psychologist";
  if (lower.includes("gineco")) return "gynecologist";
  if (lower.includes("orto")) return "orthopedist";
  if (lower.includes("pedi")) return "pediatrician";

  return "doctor"; // fallback genérico
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, lat, lng, radius = 15000, keyword } = await req.json();

    const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_KEY");
    if (!googleMapsApiKey) {
      throw new Error("Google Maps API Key not configured in Supabase secrets.");
    }

    let searchLat: number;
    let searchLng: number;

    // Se não tiver coordenadas, usa endereço para geocodificação
    if (!lat || !lng) {
      if (!address) throw new Error("Address or coordinates are required.");

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address,
      )}&key=${googleMapsApiKey}`;

      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== "OK" || !geocodeData.results.length) {
        throw new Error("Address not found.");
      }

      const location = geocodeData.results[0].geometry.location;
      searchLat = location.lat;
      searchLng = location.lng;
    } else {
      searchLat = lat;
      searchLng = lng;
    }

    // Define tipo de profissional baseado no diagnóstico/especialidade
    const providerType = determineProviderType(keyword);

    // Monta URL do Google Places
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${searchLat},${searchLng}&radius=${radius}&type=doctor&keyword=${encodeURIComponent(
      providerType,
    )}&key=${googleMapsApiKey}`;

    console.log("Searching URL:", placesUrl);

    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    if (placesData.status !== "OK") {
      throw new Error(
        `Google Places API Error: ${placesData.status} - ${
          placesData.error_message || ""
        }`,
      );
    }

    // Formata resultados para o frontend e adiciona especialidade
const formattedResults = (placesData.results || []).map((place)=>({
    name: place.name,
    address: place.vicinity,
    rating: place.rating || null,
    userRatingsTotal: place.user_ratings_total || 0,
    location: place.geometry?.location || null,
    placeId: place.place_id,
    types: place.types || [],
    specialty: providerType // <-- adiciona especialidade inferida
  }));

return new Response(JSON.stringify({
  providers: formattedResults,
  searchLocation: {
    lat: searchLat,
    lng: searchLng
  }
}), {
  status: 200,
  headers: {
    "Content-Type": "application/json",
    ...corsHeaders
  }
});
