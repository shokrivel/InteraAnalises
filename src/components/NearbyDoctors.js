import React, { useState } from "react";

function NearbyDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");

  const fetchDoctors = async () => {
    try {
      const location = "-23.5505,-46.6333";
      const radius = 5000;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=doctor&key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}`
      );

      const data = await response.json();

      if (data.status === "OK") {
        setDoctors(data.results);
      } else {
        setError(`Erro da API: ${data.status}`);
      }
    } catch (err) {
      setError("Erro ao buscar os profissionais de saúde");
    }
  };

  return (
    <div>
      <h2>Médicos próximos</h2>
      <button onClick={fetchDoctors}>Buscar</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {doctors.map((doc) => (
          <li key={doc.place_id}>
            <strong>{doc.name}</strong> - {doc.vicinity}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NearbyDoctors;
