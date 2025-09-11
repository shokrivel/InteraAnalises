import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ConsultationField } from "@/hooks/useConsultationFields";
import { useProfile } from "@/hooks/useProfile";

interface AglomeradoFieldProps {
  field: ConsultationField;
  value: any;
  onChange: (fieldName: string, value: any) => void;
  required?: boolean;
}

const AglomeradoField = ({ field, value, onChange, required }: AglomeradoFieldProps) => {
  const { profile } = useProfile();
  
  const getAglomeradoOptions = () => {
    const scientificTerms = (field.field_options as any)?.scientific_terms || '';
    const layTerms = (field.field_options as any)?.lay_terms || '';
    
    const scientificArray = scientificTerms.split(' - ').filter((term: string) => term.trim());
    const layArray = layTerms.split(' - ').filter((term: string) => term.trim());
    
    const userProfileType = profile?.profile_type || 'patient';
    
    // Show lay terms for patients, scientific terms for others
    const termsToShow = userProfileType === 'patient' ? layArray : scientificArray;
    
    return termsToShow.map((term: string) => ({
      value: term.trim(),
      label: term.trim()
    }));
  };

  const aglomeradoOptions = getAglomeradoOptions();

  const handleChange = (newValue: string) => {
    onChange(field.field_name, newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.field_name}>
        {field.field_label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select value={value || ''} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Selecione ${field.field_label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {aglomeradoOptions.map((option, index) => (
            <SelectItem key={index} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AglomeradoField;