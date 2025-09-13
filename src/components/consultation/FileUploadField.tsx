import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, File, Image, FileText } from 'lucide-react';
import { ConsultationField } from '@/hooks/useConsultationFields';

interface FileUploadFieldProps {
  field: ConsultationField;
  value: any[];
  onChange: (fieldName: string, value: any[]) => void;
  required?: boolean;
  disabled?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  path?: string;
  preview?: string;
  uploading?: boolean;
  progress?: number;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  field,
  value = [],
  onChange,
  required,
  disabled
}) => {
  const [files, setFiles] = useState<UploadedFile[]>(value || []);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const options = field.field_options || {};
  const maxFiles = options.max_files || 10;
  const maxSizeMB = options.max_size_mb || 5;
  const allowedTypes = options.allowed_types || ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de arquivo não permitido. Aceitos: ${allowedTypes.join(', ')}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxSizeMB}MB`;
    }
    if (files.length >= maxFiles) {
      return `Máximo de ${maxFiles} arquivos permitidos`;
    }
    return null;
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const uploadFile = async (file: File, tempId: string) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('consultation-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('consultation-attachments')
        .getPublicUrl(fileName);

      return {
        id: tempId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        path: fileName
      };
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  };

  const handleFiles = async (fileList: FileList) => {
    const newFiles: File[] = Array.from(fileList);
    
    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: "Erro no arquivo",
          description: `${file.name}: ${error}`,
          variant: "destructive"
        });
        continue;
      }

      const tempId = Math.random().toString(36).substring(2);
      const preview = await createFilePreview(file);

      const tempFile: UploadedFile = {
        id: tempId,
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        uploading: true,
        progress: 0
      };

      setFiles(prev => [...prev, tempFile]);

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => 
            f.id === tempId 
              ? { ...f, progress: Math.min((f.progress || 0) + 10, 90) }
              : f
          ));
        }, 200);

        const uploadedFile = await uploadFile(file, tempId);
        
        clearInterval(progressInterval);
        
        setFiles(prev => {
          const updated = prev.map(f => 
            f.id === tempId 
              ? { ...uploadedFile, uploading: false, progress: 100 }
              : f
          );
          onChange(field.field_name, updated);
          return updated;
        });

        toast({
          title: "Upload concluído",
          description: `${file.name} foi enviado com sucesso`
        });

      } catch (error) {
        setFiles(prev => prev.filter(f => f.id !== tempId));
        toast({
          title: "Erro no upload",
          description: `Falha ao enviar ${file.name}`,
          variant: "destructive"
        });
      }
    }
  };

  const removeFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    if (file.url && file.path) {
      try {
        await supabase.storage
          .from('consultation-attachments')
          .remove([file.path]);
      } catch (error) {
        console.error('Erro ao remover arquivo do storage:', error);
      }
    }

    const updated = files.filter(f => f.id !== fileId);
    setFiles(updated);
    onChange(field.field_name, updated);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Label htmlFor={field.field_name}>
        {field.field_label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Arraste e solte seus arquivos aqui ou clique para selecionar
        </p>
        <p className="text-xs text-muted-foreground">
          Máximo {maxFiles} arquivos, {maxSizeMB}MB cada • JPEG, PNG, PDF
        </p>
        <Button 
          type="button" 
          variant="outline" 
          className="mt-4"
          disabled={disabled || files.length >= maxFiles}
        >
          Selecionar Arquivos
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Arquivos ({files.length}/{maxFiles})
          </Label>
          {files.map((file) => (
            <Card key={file.id} className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-3">
                  {file.preview ? (
                    <img 
                      src={file.preview} 
                      alt={file.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {file.uploading && (
                      <div className="mt-1">
                        <Progress value={file.progress || 0} className="h-1" />
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    disabled={disabled || file.uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadField;