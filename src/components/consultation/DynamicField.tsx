import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConsultationField } from "@/hooks/useConsultationFields";

interface DynamicFieldProps {
  field: ConsultationField;
  value: any;
  onChange: (fieldName: string, value: any) => void;
  required?: boolean;
}

const DynamicField = ({ field, value, onChange, required }: DynamicFieldProps) => {
  const handleChange = (newValue: any) => {
    onChange(field.field_name, newValue);
  };

  const renderField = () => {
    switch (field.field_type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Digite ${field.field_label.toLowerCase()}`}
            required={required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Descreva ${field.field_label.toLowerCase()}`}
            rows={4}
            required={required}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(parseInt(e.target.value) || null)}
            placeholder="0"
            required={required}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={required}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={!!value}
              onCheckedChange={(checked) => handleChange(checked)}
              required={required}
            />
            <Label htmlFor={field.field_name} className="text-sm font-normal">
              {field.field_label}
            </Label>
          </div>
        );

      case 'select':
        // For select fields, options should be stored in field_options
        const options = field.field_options?.options || [];
        return (
          <Select value={value || ''} onValueChange={handleChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${field.field_label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: any, index: number) => (
                <SelectItem key={index} value={option.value || option}>
                  {option.label || option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'aglomerado':
        // For aglomerado fields, show different options based on user profile
        const getAglomeradoOptions = () => {
          const scientificTerms = field.field_options?.scientific_terms || '';
          const layTerms = field.field_options?.lay_terms || '';
          
          const scientificArray = scientificTerms.split(' - ').filter(term => term.trim());
          const layArray = layTerms.split(' - ').filter(term => term.trim());
          
          // Import the hook to get user profile type
          const { useProfile } = require('@/hooks/useProfile');
          const { profile } = useProfile();
          const userProfileType = profile?.profile_type || 'patient';
          
          // Show lay terms for patients, scientific terms for others
          const termsToShow = userProfileType === 'patient' ? layArray : scientificArray;
          
          return termsToShow.map((term, index) => ({
            value: term.trim(),
            label: term.trim()
          }));
        };

        const aglomeradoOptions = getAglomeradoOptions();
        
        return (
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
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Digite ${field.field_label.toLowerCase()}`}
            required={required}
          />
        );
    }
  };

  // For checkbox fields, don't render a separate label
  if (field.field_type === 'checkbox') {
    return (
      <div className="space-y-2">
        {renderField()}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.field_name}>
        {field.field_label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderField()}
    </div>
  );
};

export default DynamicField;