import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Search, X } from "lucide-react";
import { ConsultationField } from "@/hooks/useConsultationFields";
import { useProfile } from "@/hooks/useProfile";

interface AglomeradoFieldProps {
  field: ConsultationField;
  value: any;
  onChange: (fieldName: string, value: any) => void;
  required?: boolean;
}

const FREQUENT_SYMPTOMS = [
  "Dor de cabeça", "Febre", "Cansaço", "Tosse",
  "Tontura", "Dor no corpo", "Enjoo", "Falta de ar",
];

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const AglomeradoField = ({ field, value, onChange, required }: AglomeradoFieldProps) => {
  const { profile } = useProfile();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getOptions = (): string[] => {
    const opts = field.field_options as any;
    const profileType = profile?.profile_type || "patient";
    const raw =
      profileType === "patient"
        ? opts?.lay_terms || opts?.lay || ""
        : opts?.scientific_terms || opts?.scientific || "";
    return raw
      .split(" - ")
      .map((t: string) => t.replace(/\*/g, "").trim())
      .filter(Boolean);
  };

  const allOptions = getOptions();
  const selected: string[] = Array.isArray(value) ? value : value ? [value] : [];

  const filtered = query.trim()
    ? allOptions
        .filter((o) => normalize(o).includes(normalize(query)))
        .slice(0, 8)
    : [];

  const toggle = (item: string) => {
    const next = selected.includes(item)
      ? selected.filter((s) => s !== item)
      : [...selected, item];
    onChange(field.field_name, next);
  };

  const remove = (item: string) => {
    onChange(field.field_name, selected.filter((s) => s !== item));
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isSymptomsField = field.field_name === "symptoms";
  const frequentToShow = isSymptomsField
    ? FREQUENT_SYMPTOMS.filter((s) => allOptions.includes(s))
    : [];

  return (
    <div className="space-y-3">
      <Label htmlFor={field.field_name}>
        {field.field_label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {/* Search input */}
      <div className="relative" ref={wrapRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            id={field.field_name}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { if (query) setOpen(true); }}
            placeholder="Buscar sintoma..."
            className="w-full pl-9 pr-9 py-2.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && query.trim() && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-muted-foreground text-center">
                Nenhum resultado para "{query}"
              </p>
            ) : (
              filtered.map((opt) => {
                const isSel = selected.includes(opt);
                const q = query.trim();
                const idx = normalize(opt).indexOf(normalize(q));
                const highlighted =
                  idx >= 0
                    ? <>
                        {opt.slice(0, idx)}
                        <span className="font-semibold text-primary">{opt.slice(idx, idx + q.length)}</span>
                        {opt.slice(idx + q.length)}
                      </>
                    : opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { toggle(opt); setQuery(""); setOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-accent transition-colors ${isSel ? "bg-primary/5" : ""}`}
                  >
                    <span>{highlighted}</span>
                    {isSel && (
                      <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="2">
                          <path d="M1 4l2.5 2.5L9 1" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {selected.length} selecionado{selected.length > 1 ? "s" : ""}
            </p>
            <button
              type="button"
              onClick={() => onChange(field.field_name, [])}
              className="text-xs text-primary hover:underline"
            >
              Limpar todos
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                {s}
                <button
                  type="button"
                  onClick={() => remove(s)}
                  className="ml-0.5 opacity-60 hover:opacity-100 leading-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Frequent suggestions */}
      {frequentToShow.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Sugestões frequentes</p>
          <div className="flex flex-wrap gap-1.5">
            {frequentToShow.map((s) => {
              const isSel = selected.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(s)}
                  className={`px-3 py-1 rounded-full text-xs transition-all border ${
                    isSel
                      ? "bg-primary/10 border-primary/30 text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AglomeradoField;
