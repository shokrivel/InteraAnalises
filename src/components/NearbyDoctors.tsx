import React, { useState } from "react";

interface Doctor {
  place_id: string;
  name: string;
  vicinity: string;
}

function NearbyDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState<string>("");

  const fetchDoctors = async () => {
    try {
      const location = "-23.5505,-46.6333";
      const radius = 5000;

      const response = await fetch(
        `/api/nearby-doctors?location=${location}&radius=${radius}`
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
