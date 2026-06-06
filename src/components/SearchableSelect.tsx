import { useEffect, useMemo, useRef, useState } from 'react';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string, option: SearchableSelectOption) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  error?: string;
  emptyText?: string;
  loadingText?: string;
  onSearchQueryChange?: (query: string) => void;
  disabled?: boolean;
}

export default function SearchableSelect({
  label,
  required,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  loading = false,
  error,
  emptyText,
  loadingText = 'Loading…',
  onSearchQueryChange,
  disabled = false,
}: SearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabel = useMemo(() => {
    const match = options.find((o) => o.value === value);
    return match?.label ?? '';
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => {
      onSearchQueryChange?.(query.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [open, query, onSearchQueryChange]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const id = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  const pickOption = (option: SearchableSelectOption) => {
    onChange(option.value, option);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="w-full" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required ? <span className="text-red-500 ml-1">*</span> : null}
      </label>

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={`w-full px-4 py-3 border rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white disabled:bg-gray-50 disabled:cursor-not-allowed ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
        >
          <span className={selectedLabel ? 'text-dark-text' : 'text-gray-400'}>
            {selectedLabel || placeholder}
          </span>
        </button>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {open && (
          <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-2 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder ?? placeholder}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto py-1">
              {loading ? (
                <div className="px-4 py-3 text-sm text-gray-600">{loadingText}</div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-600">{emptyText}</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      option.value === value ? 'bg-primary/5 text-primary font-medium' : 'text-dark-text'
                    }`}
                    onClick={() => pickOption(option)}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
