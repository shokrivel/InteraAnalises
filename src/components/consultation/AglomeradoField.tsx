import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  
  // Ensure value is always an array
  const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);

  const handleOptionChange = (optionValue: string, checked: boolean) => {
    let newValues: string[];
    
    if (checked) {
      newValues = [...selectedValues, optionValue];
    } else {
      newValues = selectedValues.filter(v => v !== optionValue);
    }
    
    onChange(field.field_name, newValues);
  };

  if (aglomeradoOptions.length === 0) {
    return (
      <div className="space-y-2">
        <Label htmlFor={field.field_name}>
          {field.field_label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Nenhuma opção disponível para este campo. Verifique a configuração no painel administrativo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.field_name}>
        {field.field_label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aglomeradoOptions.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.field_name}_${index}`}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => handleOptionChange(option.value, checked as boolean)}
                />
                <Label 
                  htmlFor={`${field.field_name}_${index}`} 
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
          {selectedValues.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Selecionados:</p>
              <div className="flex flex-wrap gap-1">
                {selectedValues.map((selectedValue, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary"
                  >
                    {selectedValue}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AglomeradoField;