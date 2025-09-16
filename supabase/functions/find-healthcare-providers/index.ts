import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Tipagem básica para os resultados do Google Places
interface GoogleMapsPlace {
  place_id: string;
  name: string;
  vicinity: string;
  formatted_address?: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  photos?: { photo_reference: string }[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, lat, lng, radius = 15000, keyword } = await req.json();

    // Corrigir nome da variável de ambiente (sem VITE_)
    const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_KEY");
    if (!googleMapsApiKey) {
      throw new Error("Google Maps API Key not configured in Supabase secrets.");
    }

    let searchLat: number;
    let searchLng: number;

    if (!lat || !lng) {
      if (!address) {
        throw new Error("Address or coordinates are required.");
      }

      // Buscar coordenadas via geocoding API
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
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

    // Se tiver especialidade/prognóstico, usar no filtro
    const searchQuery = keyword ? `&keyword=${encodeURIComponent(keyword)}` : "";

    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${searchLat},${searchLng}&radius=${radius}&type=doctor${searchQuery}&key=${googleMapsApiKey}`;
    console.log("Searching URL:", placesUrl);

    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    if (placesData.status !== "OK") {
      throw new Error(`Google Places API Error: ${placesData.status} - ${placesData.error_message || ""}`);
    }

    // Aqui agora formatamos de verdade os médicos
    const formattedResults = (placesData.results || []).map((place: GoogleMapsPlace) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity || place.formatted_address,
      location: place.geometry.location,
      rating: place.rating || null,
      totalReviews: place.user_ratings_total || 0,
      types: place.types || [],
      photoUrl: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${googleMapsApiKey}`
        : null,
    }));

    return new Response(
      JSON.stringify({
        providers: formattedResults,
        searchLocation: { lat: searchLat, lng: searchLng },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in find-healthcare-providers:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
