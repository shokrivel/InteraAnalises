-- Inserir/Atualizar campo de Exames Laboratoriais Anteriores
INSERT INTO consultation_fields (
  field_name,
  field_label,
  field_type,
  field_options,
  required_for_levels,
  visible_for_levels,
  field_order,
  is_active
) VALUES (
  'exames_laboratoriais',
  'Exames Laboratoriais Anteriores',
  'select',
  '{
    "conditional": true,
    "subfield": "exames_selecionados",
    "options": [
      {"value": "", "label": "Selecione uma opção"},
      {"value": "yes", "label": "Sim, realizei exames recentemente"},
      {"value": "no", "label": "Não realizei exames recentemente"}
    ],
    "conditionalOptions": [
      {"value": "hemograma", "label": "Hemograma completo"},
      {"value": "glicemia", "label": "Glicemia"},
      {"value": "colesterol", "label": "Colesterol e triglicerídeos"},
      {"value": "ureia_creatinina", "label": "Ureia e creatinina"},
      {"value": "tsh_t4", "label": "TSH e T4 (tireoide)"},
      {"value": "hepatograma", "label": "Hepatograma (TGO, TGP)"},
      {"value": "raio_x", "label": "Raio-X"},
      {"value": "tomografia", "label": "Tomografia"},
      {"value": "ressonancia", "label": "Ressonância magnética"},
      {"value": "ultrassom", "label": "Ultrassom"},
      {"value": "outros_exames", "label": "Outros exames"}
    ]
  }'::jsonb,
  ARRAY['patient', 'academic', 'health_professional']::text[],
  ARRAY['patient', 'academic', 'health_professional']::text[],
  50,
  true
)
ON CONFLICT (field_name) 
DO UPDATE SET
  field_label = EXCLUDED.field_label,
  field_type = EXCLUDED.field_type,
  field_options = EXCLUDED.field_options,
  visible_for_levels = EXCLUDED.visible_for_levels,
  field_order = EXCLUDED.field_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Inserir/Atualizar campo de Histórico Familiar Relevante
INSERT INTO consultation_fields (
  field_name,
  field_label,
  field_type,
  field_options,
  required_for_levels,
  visible_for_levels,
  field_order,
  is_active
) VALUES (
  'historico_familiar',
  'Histórico Familiar Relevante',
  'select',
  '{
    "conditional": true,
    "subfield": "historico_familiar_selecionado",
    "options": [
      {"value": "", "label": "Selecione uma opção"},
      {"value": "yes", "label": "Sim, tenho histórico familiar"},
      {"value": "no", "label": "Não tenho histórico familiar"}
    ],
    "conditionalOptions": [
      {"value": "diabetes", "label": "Diabetes"},
      {"value": "hipertensao", "label": "Hipertensão arterial"},
      {"value": "cancer", "label": "Câncer"},
      {"value": "doenca_cardiaca", "label": "Doença cardíaca"},
      {"value": "avc", "label": "AVC (derrame)"},
      {"value": "doenca_renal", "label": "Doença renal"},
      {"value": "asma_bronquite", "label": "Asma ou bronquite"},
      {"value": "doenca_mental", "label": "Doenças mentais"},
      {"value": "doenca_autoimune", "label": "Doenças autoimunes"},
      {"value": "outros_historico", "label": "Outros"}
    ]
  }'::jsonb,
  ARRAY['patient', 'academic', 'health_professional']::text[],
  ARRAY['patient', 'academic', 'health_professional']::text[],
  51,
  true
)
ON CONFLICT (field_name) 
DO UPDATE SET
  field_label = EXCLUDED.field_label,
  field_type = EXCLUDED.field_type,
  field_options = EXCLUDED.field_options,
  visible_for_levels = EXCLUDED.visible_for_levels,
  field_order = EXCLUDED.field_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();