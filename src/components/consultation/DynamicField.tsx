import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ConsultationField } from "@/hooks/useConsultationFields";
import AglomeradoField from "./AglomeradoField";
import FileUploadField from "./FileUploadField";
import ImcField from "./ImcField";
import { ChevronDown } from "lucide-react";

interface DynamicFieldProps {
  field: ConsultationField;
  value: any;
  onChange: (fieldName: string, value: any) => void;
  required?: boolean;
}

const DynamicField = ({ field, value, onChange, required }: DynamicFieldProps) => {
  const [showConditionalList, setShowConditionalList] = useState(false);

  const handleChange = (newValue: any) => {
    onChange(field.field_name, newValue);
  };

  // Handle conditional dropdown (for family history and lab tests)
  const handleConditionalDropdownChange = (selectedValue: string) => {
    handleChange(selectedValue);
    if (selectedValue === 'yes') {
      setShowConditionalList(true);
    } else if (selectedValue === 'no') {
      setShowConditionalList(false);
      // Clear any previously selected items when user selects "No"
      if (field.field_options?.subfield) {
        onChange(field.field_options.subfield, []);
      }
    } else {
      setShowConditionalList(false);
    }
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
        // Check if this is a pain scale field (0-10)
        const isPainScale = field.field_name.toLowerCase().includes('dor') || 
                           field.field_name.toLowerCase().includes('pain');
        
        if (isPainScale) {
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">0 (sem dor)</span>
                <span className="text-2xl font-bold text-primary">{value || 0}</span>
                <span className="text-sm text-muted-foreground">10 (dor máxima)</span>
              </div>
              <Slider
                value={[value || 0]}
                onValueChange={(values) => handleChange(values[0])}
                min={0}
                max={10}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-center text-muted-foreground">
                De 0 (sem dor) até 10 (dor máxima suportável)
              </p>
            </div>
          );
        }
        
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
        // Check if this is a conditional dropdown (family history or lab tests)
        const isConditional = field.field_options?.conditional === true;
        const options = field.field_options?.options || [];
        const conditionalOptions = field.field_options?.conditionalOptions || [];
        
        if (isConditional) {
          return (
            <div className="space-y-4">
              <Select value={value || ''} onValueChange={handleConditionalDropdownChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option: any, index: number) => (
                    <SelectItem key={index} value={option.value || option}>
                      {option.label || option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {showConditionalList && value === 'yes' && conditionalOptions.length > 0 && (
                <Collapsible open={showConditionalList} className="space-y-2">
                  <CollapsibleContent className="space-y-2 animate-accordion-down">
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <p className="text-sm font-medium">Selecione os itens relevantes:</p>
                      {conditionalOptions.map((option: any, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${field.field_name}-${index}`}
                            checked={
                              Array.isArray(field.field_options?.selectedItems) &&
                              field.field_options.selectedItems.includes(option.value || option)
                            }
                            onCheckedChange={(checked) => {
                              const currentSelected = field.field_options?.selectedItems || [];
                              const optionValue = option.value || option;
                              const newSelected = checked
                                ? [...currentSelected, optionValue]
                                : currentSelected.filter((item: any) => item !== optionValue);
                              
                              if (field.field_options?.subfield) {
                                onChange(field.field_options.subfield, newSelected);
                              }
                            }}
                          />
                          <Label
                            htmlFor={`${field.field_name}-${index}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {option.label || option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          );
        }
        
        // Regular select without conditional logic
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