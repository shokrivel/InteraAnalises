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
  type?: string;
}

interface GoogleMapsPlace {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
  };
  photos?: Array<{
    photo_reference: string;
  }>;
  types: string[];
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { address, lat, lng, radius = 5000, type = 'all' }: FindProvidersRequest = await req.json();

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleMapsApiKey) {
      return new Response(JSON.stringify({ error: 'Google Maps API não configurado' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let searchLat: number;
    let searchLng: number;

    // If coordinates not provided, geocode the address
    if (!lat || !lng) {
      if (!address) {
        return new Response(JSON.stringify({ error: 'Endereço ou coordenadas são obrigatórios' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== 'OK' || !geocodeData.results.length) {
        return new Response(JSON.stringify({ error: 'Endereço não encontrado' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const location = geocodeData.results[0].geometry.location;
      searchLat = location.lat;
      searchLng = location.lng;
    } else {
      searchLat = lat;
      searchLng = lng;
    }

    // Define search types based on request
    const searchTypes = type === 'all' 
      ? ['hospital', 'pharmacy', 'doctor', 'health']
      : [type];

    const allResults: GoogleMapsPlace[] = [];

    // Search for each type
    for (const searchType of searchTypes) {
      const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${searchLat},${searchLng}&radius=${radius}&type=${searchType}&key=${googleMapsApiKey}`;
      
      const placesResponse = await fetch(placesUrl);
      const placesData = await placesResponse.json();

      if (placesData.status === 'OK' && placesData.results) {
        allResults.push(...placesData.results);
      }
    }

    // Remove duplicates based on place_id
    const uniqueResults = allResults.filter((place, index, self) => 
      index === self.findIndex(p => p.place_id === place.place_id)
    );

    // Format results
    const formattedResults = uniqueResults.map((place: GoogleMapsPlace) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      rating: place.rating || 0,
      reviewCount: place.user_ratings_total || 0,
      isOpen: place.opening_hours?.open_now,
      type: determineProviderType(place.types),
      photos: place.photos?.slice(0, 1).map(photo => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${googleMapsApiKey}`
      ) || [],
    }));

    // Sort by rating and proximity
    const sortedResults = formattedResults.sort((a, b) => {
      return (b.rating || 0) - (a.rating || 0);
    });

    return new Response(JSON.stringify({
      providers: sortedResults.slice(0, 20), // Limit to 20 results
      searchLocation: { lat: searchLat, lng: searchLng },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error finding healthcare providers:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

function determineProviderType(types: string[]): string {
  if (types.includes('hospital')) return 'Hospital';
  if (types.includes('pharmacy')) return 'Farmácia';
  if (types.includes('doctor')) return 'Médico';
  if (types.includes('dentist')) return 'Dentista';
  if (types.includes('physiotherapist')) return 'Fisioterapeuta';
  if (types.includes('health')) return 'Profissional de Saúde';
  return 'Serviço de Saúde';
}