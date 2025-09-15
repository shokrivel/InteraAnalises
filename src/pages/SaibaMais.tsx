import React, { useState } from "react";

function SaibaMais() {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Saiba Mais</h1>
      <textarea
        rows={6}
        style={{ width: "100%" }}
        placeholder="Digite o conteúdo aqui..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div>
        <input type="file" onChange={handleImageUpload} />
        {image && <img src={image} alt="preview" style={{ maxWidth: "200px" }} />}
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>Pré-visualização</h2>
        <p>{content}</p>
        {image && <img src={image} alt="preview" style={{ maxWidth: "400px" }} />}
      </div>
    </div>
  );
}

export default SaibaMais;
