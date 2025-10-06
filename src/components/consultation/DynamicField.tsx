import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConsultationField } from "@/hooks/useConsultationFields";
import AglomeradoField from "./AglomeradoField";
import FileUploadField from "./FileUploadField";
import ImcField from "./ImcField";

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
        return <AglomeradoField field={field} value={value} onChange={onChange} required={required} />;

      case 'file_upload':
        return <FileUploadField field={field} value={value || []} onChange={onChange} required={required} />;

      case 'imc':
        return <ImcField field={field} value={value} onChange={onChange} required={required} />;

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

  // For checkbox, aglomerado, file_upload and imc fields, don't render a separate wrapper
  if (field.field_type === 'checkbox' || field.field_type === 'aglomerado' || field.field_type === 'file_upload' || field.field_type === 'imc') {
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