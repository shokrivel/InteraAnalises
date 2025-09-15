import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FindProvidersRequest {
  address?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  keyword?: string; // <-- PARÂMETRO ADICIONADO
}

// ... (interface GoogleMapsPlace não muda)

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, lat, lng, radius = 15000, keyword }: FindProvidersRequest = await req.json();

    // CORREÇÃO: O nome da variável de ambiente no Deno não usa "VITE_"
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_KEY');
    if (!googleMapsApiKey) {
      throw new Error('Google Maps API Key not configured in Supabase secrets.');
    }

    let searchLat: number;
    let searchLng: number;

    if (!lat || !lng) {
      if (!address) {
        throw new Error('Address or coordinates are required.');
      }
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();
      if (geocodeData.status !== 'OK' || !geocodeData.results.length) {
        throw new Error('Address not found.');
      }
      const location = geocodeData.results[0].geometry.location;
      searchLat = location.lat;
      searchLng = location.lng;
    } else {
      searchLat = lat;
      searchLng = lng;
    }

    // LÓGICA MELHORADA: Usa a keyword se ela for fornecida
    const searchQuery = keyword ? `&keyword=${encodeURIComponent(keyword)}` : '';
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${searchLat},${searchLng}&radius=${radius}&type=doctor${searchQuery}&key=${googleMapsApiKey}`;
    
    console.log("Searching URL:", placesUrl); // Para depuração

    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    if (placesData.status !== 'OK') {
        throw new Error(`Google Places API Error: ${placesData.status} - ${placesData.error_message || ''}`);
    }

    const formattedResults = (placesData.results || []).map((place: any) => ({
        // ... (lógica de formatação não muda)
    }));

    return new Response(JSON.stringify({
      providers: formattedResults,
      searchLocation: { lat: searchLat, lng: searchLng },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in find-healthcare-providers:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// ... (função determineProviderType não muda)