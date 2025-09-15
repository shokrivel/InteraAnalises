import React, { useEffect, useState } from "react";

function NearbyDoctors({ specialty = "clinica medica" }) {
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");
  const [map, setMap] = useState(null);

  useEffect(() => {
    // inicializa o mapa
    const initMap = () => {
      const mapInstance = new window.google.maps.Map(
        document.getElementById("map"),
        {
          center: { lat: -23.5505, lng: -46.6333 },
          zoom: 12,
        }
      );
      setMap(mapInstance);
    };

    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}&libraries=places`;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  const fetchDoctors = async () => {
    if (!map) return;
    try {
      const service = new window.google.maps.places.PlacesService(map);
      const request = {
        location: map.getCenter(),
        radius: 5000,
        keyword: specialty, // usa o prognóstico como filtro
        type: "doctor",
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setDoctors(results);
          results.forEach((place) => {
            const marker = new window.google.maps.Marker({
              map,
              position: place.geometry.location,
              title: place.name,
            });

            marker.addListener("click", () => {
              map.setCenter(place.geometry.location);
              map.setZoom(16); // zoom no profissional
            });
          });
        } else {
          setError(`Erro da API: ${status}`);
        }
      });
    } catch (err) {
      setError("Erro ao buscar os profissionais de saúde");
    }
  };

  return (
    <div>
      <h2>Médicos próximos ({specialty})</h2>
      <button onClick={fetchDoctors}>Buscar</button>
      <div id="map" style={{ width: "100%", height: "400px" }}></div>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default NearbyDoctors;
