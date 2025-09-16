import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Phone, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HealthcareProvider {
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal: number;
  location: {
    lat: number;
    lng: number;
  };
  placeId: string;
  types: string[];
}

interface NearbyDoctorsProps {
  prognosis?: string;
  userAddress?: string;
}

const NearbyDoctors: React.FC<NearbyDoctorsProps> = ({ prognosis, userAddress }) => {
  const [providers, setProviders] = useState<HealthcareProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNearbyProviders = async () => {
      if (!userAddress) {
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('find-healthcare-providers', {
          body: {
            address: userAddress,
            keyword: prognosis || '',
            radius: 15000
          }
        });

        if (error) {
          throw error;
        }

        if (data?.providers) {
          setProviders(data.providers);
          setSearchLocation(data.searchLocation);
        }
      } catch (error: any) {
        console.error('Error fetching nearby providers:', error);
        toast({
          title: "Erro ao buscar profissionais",
          description: "Não foi possível encontrar profissionais próximos.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyProviders();
  }, [userAddress, prognosis, toast]);

  const openInGoogleMaps = (provider: HealthcareProvider) => {
    const url = `https://www.google.com/maps/place/?q=place_id:${provider.placeId}`;
    window.open(url, '_blank');
  };

  if (!userAddress) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Complete seu endereço no perfil para ver profissionais próximos.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-muted-foreground">Buscando profissionais próximos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (providers.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum profissional encontrado na região.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {searchLocation && (
        <div className="text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 inline mr-1" />
          Encontrados {providers.length} profissionais próximos ao seu endereço
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2">
        {providers.map((provider, index) => (
          <Card key={provider.placeId || index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg font-medium line-clamp-2">
                    {provider.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {provider.address}
                  </p>
                </div>
                {provider.rating && (
                  <div className="flex items-center space-x-1 ml-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">{provider.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({provider.userRatingsTotal})
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1 mb-3">
                {provider.types.slice(0, 3).map((type, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {type.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openInGoogleMaps(provider)}
                  className="flex-1"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Ver no Maps
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NearbyDoctors;