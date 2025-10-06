import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsultationField } from "@/hooks/useConsultationFields";

interface ImcFieldProps {
  field: ConsultationField;
  value: any;
  onChange: (fieldName: string, value: any) => void;
  required?: boolean;
}

const ImcField = ({ field, value, onChange, required }: ImcFieldProps) => {
  const [weight, setWeight] = useState(value?.weight || '');
  const [height, setHeight] = useState(value?.height || '');
  const [imc, setImc] = useState(value?.imc || '');

  useEffect(() => {
    if (weight && height) {
      const heightInMeters = parseFloat(height) / 100;
      const calculatedImc = parseFloat(weight) / (heightInMeters * heightInMeters);
      const imcValue = calculatedImc.toFixed(2);
      setImc(imcValue);
      onChange(field.field_name, {
        weight: parseFloat(weight),
        height: parseFloat(height),
        imc: parseFloat(imcValue)
      });
    } else {
      setImc('');
      onChange(field.field_name, null);
    }
  }, [weight, height]);

  const getImcClassification = (imcValue: number) => {
    if (imcValue < 18.5) return { text: 'Abaixo do peso', color: 'text-blue-600' };
    if (imcValue < 25) return { text: 'Peso normal', color: 'text-green-600' };
    if (imcValue < 30) return { text: 'Sobrepeso', color: 'text-yellow-600' };
    if (imcValue < 35) return { text: 'Obesidade Grau I', color: 'text-orange-600' };
    if (imcValue < 40) return { text: 'Obesidade Grau II', color: 'text-red-600' };
    return { text: 'Obesidade Grau III', color: 'text-red-800' };
  };

  const classification = imc ? getImcClassification(parseFloat(imc)) : null;

  return (
    <div className="space-y-4">
      <Label>
        {field.field_label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${field.field_name}_weight`} className="text-sm">
            Peso (Kg)
          </Label>
          <Input
            id={`${field.field_name}_weight`}
            type="number"
            step="0.1"
            min="0"
            max="500"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Ex: 70.5"
            required={required}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${field.field_name}_height`} className="text-sm">
            Altura (cm)
          </Label>
          <Input
            id={`${field.field_name}_height`}
            type="number"
            step="1"
            min="0"
            max="300"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Ex: 175"
            required={required}
          />
        </div>
      </div>

      {imc && (
        <div className="p-4 bg-muted rounded-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">IMC Calculado:</span>
            <span className="text-lg font-bold">{imc}</span>
          </div>
          {classification && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Classificação:</span>
              <span className={`text-sm font-semibold ${classification.color}`}>
                {classification.text}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImcField;
