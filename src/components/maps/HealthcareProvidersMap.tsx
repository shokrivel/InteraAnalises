import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Clock, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    google: any;
  }
}

interface HealthcareProvider {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating: number;
  reviewCount: number;
  isOpen?: boolean;
  type: string;
  photos: string[];
}

interface HealthcareProvidersMapProps {
  userAddress?: string;
  userLocation?: { lat: number; lng: number };
  onClose?: () => void;
}

const HealthcareProvidersMap: React.FC<HealthcareProvidersMapProps> = ({
  userAddress,
  userLocation,
  onClose
}) => {
  const [providers, setProviders] = useState<HealthcareProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyA3bueZoc_bo0sPHrhxcJed1AHJTmDnVYo&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));
      document.head.appendChild(script);
    });
  };

  const searchProviders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('find-healthcare-providers', {
        body: {
          address: userAddress,
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          radius: 5000,
          type: 'all'
        }
      });

      if (error) throw error;

      setProviders(data.providers || []);
      setSearchLocation(data.searchLocation);
      
      toast({
        title: "Sucesso",
        description: `Encontrados ${data.providers?.length || 0} profissionais de saúde próximos.`,
      });
    } catch (error) {
      console.error('Error searching providers:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar profissionais de saúde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    if (!mapRef.current || !searchLocation) return;

    try {
      await loadGoogleMapsScript();

      const map = new window.google.maps.Map(mapRef.current, {
        center: searchLocation,
        zoom: 14,
        styles: [
          {
            featureType: 'poi.medical',
            elementType: 'geometry',
            stylers: [{ color: '#ff6b6b' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Add user location marker
      new window.google.maps.Marker({
        position: searchLocation,
        map: map,
        title: 'Sua localização',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff'
        }
      });

      // Add provider markers
      providers.forEach((provider) => {
        const marker = new window.google.maps.Marker({
          position: provider.location,
          map: map,
          title: provider.name,
          icon: {
            url: getProviderIcon(provider.type),
            scaledSize: new window.google.maps.Size(28, 28)
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="max-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${provider.name}</h3>
              <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${provider.address}</p>
              <div style="display: flex; align-items: center; gap: 4px; margin: 4px 0;">
                <span style="color: #ffd700;">★</span>
                <span style="font-size: 14px;">${provider.rating}</span>
                <span style="color: #666; font-size: 12px;">(${provider.reviewCount} avaliações)</span>
              </div>
              <span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${provider.type}</span>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar o mapa.",
        variant: "destructive",
      });
    }
  };

  const getProviderIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      'Hospital': '🏥',
      'Farmácia': '💊',
      'Médico': '👨‍⚕️',
      'Dentista': '🦷',
      'Fisioterapeuta': '🤲',
      'Profissional de Saúde': '⚕️',
      'Serviço de Saúde': '🏥'
    };
    
    const emoji = icons[type] || '⚕️';
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="12" fill="white" stroke="#3b82f6" stroke-width="2"/>
        <text x="14" y="18" text-anchor="middle" font-size="12">${emoji}</text>
      </svg>
    `)}`;
  };

  useEffect(() => {
    if (userAddress || userLocation) {
      searchProviders();
    }
  }, [userAddress, userLocation]);

  useEffect(() => {
    if (providers.length > 0 && searchLocation) {
      initializeMap();
    }
  }, [providers, searchLocation]);

  const openInGoogleMaps = (provider: HealthcareProvider) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${provider.location.lat},${provider.location.lng}&destination_place_id=${provider.id}`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Profissionais de Saúde Próximos</h3>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Buscando profissionais...</span>
        </div>
      )}

      {!loading && providers.length > 0 && (
        <>
          <div 
            ref={mapRef} 
            className="w-full h-64 rounded-lg border"
            style={{ minHeight: '300px' }}
          />

          <div className="grid gap-4 md:grid-cols-2">
            {providers.slice(0, 6).map((provider) => (
              <Card key={provider.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                    <Badge variant="secondary">{provider.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {provider.address}
                  </div>
                  
                  {provider.rating > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{provider.rating}</span>
                      <span className="text-muted-foreground">({provider.reviewCount} avaliações)</span>
                    </div>
                  )}

                  {provider.isOpen !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4" />
                      <span className={provider.isOpen ? "text-green-600" : "text-red-600"}>
                        {provider.isOpen ? "Aberto agora" : "Fechado"}
                      </span>
                    </div>
                  )}

                  <Button
                    size="sm"
                    onClick={() => openInGoogleMaps(provider)}
                    className="w-full"
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Ver direções
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!loading && providers.length === 0 && (userAddress || userLocation) && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum profissional de saúde encontrado na região.
        </div>
      )}
    </div>
  );
};

export default HealthcareProvidersMap;