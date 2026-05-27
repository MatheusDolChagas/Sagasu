import { useCallback, useEffect, useRef, useState } from 'react';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import api from '../services/api';
import { cn } from '@/lib/utils';

export type AddressSuggestion = {
  latitude: number;
  longitude: number;
  label: string;
};

type AddressSuggestFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (s: AddressSuggestion) => void;
  cityHint?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  id?: string;
};

export default function AddressSuggestField({
  value,
  onChange,
  onSelect,
  cityHint = 'Belo Horizonte',
  placeholder = 'Ex.: Rua Progresso, 1389 — Belo Horizonte',
  className,
  inputClassName,
  id,
}: AddressSuggestFieldProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const pick = useCallback(
    (s: AddressSuggestion) => {
      onChange(s.label);
      onSelect?.(s);
      setSuggestions([]);
      setOpen(false);
    },
    [onChange, onSelect],
  );

  useEffect(() => {
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      void (async () => {
        try {
          const res = await api.get('/map/geocode/suggest', {
            params: { q, ...(cityHint ? { city: cityHint } : {}) },
            signal: ac.signal,
            timeout: 20_000,
          });
          if (res.data.success && Array.isArray(res.data.data?.suggestions)) {
            setSuggestions(res.data.data.suggestions as AddressSuggestion[]);
            setOpen(true);
          }
        } catch (e: unknown) {
          if (
            e &&
            typeof e === 'object' &&
            'code' in e &&
            (e as { code?: string }).code === 'ERR_CANCELED'
          )
            return;
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 380);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, cityHint]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current) return;
      const target = event.target as Node | null;
      if (target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        className={cn(
          'w-full rounded-lg border border-border bg-card px-3 py-2 pr-9 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-ring',
          inputClassName,
        )}
      />
      <span
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center"
        aria-hidden
      >
        <HiMagnifyingGlass className="h-4 w-4 text-muted" />
      </span>
      {open && (suggestions.length > 0 || loading) && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          {loading && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted">Buscando…</li>
          )}
          {suggestions.map((s, i) => (
            <li key={`${s.latitude}-${s.longitude}-${i}`}>
              <button
                type="button"
                role="option"
                className="w-full px-3 py-2 text-left text-sm text-dark hover:bg-muted-bg/80"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => pick(s)}
              >
                <span className="line-clamp-2">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 text-xs text-dark/55">
        Sugestões no Brasil{cityHint ? ` (prioriza ${cityHint})` : ''}. Inclua número e bairro se não aparecer.
      </p>
    </div>
  );
}
