import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModule } from '../modules/ModuleContext';
import type { AppModule } from '../modules/types';

const MODULES: { id: AppModule; labelKey: string; descriptionKey: string }[] = [
  {
    id: 'recruitment',
    labelKey: 'modules.recruitment',
    descriptionKey: 'modules.recruitmentDescription',
  },
  {
    id: 'core-hr',
    labelKey: 'modules.coreHr',
    descriptionKey: 'modules.coreHrDescription',
  },
];

type ModuleSwitcherProps = {
  className?: string;
  onSwitched?: () => void;
};

export default function ModuleSwitcher({ className = '', onSwitched }: ModuleSwitcherProps) {
  const { t } = useTranslation();
  const { activeModule, setModule } = useModule();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = MODULES.find((m) => m.id === activeModule) ?? MODULES[0];

  useEffect(() => {
    const handlePointerDownOutside = (event: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('pointerdown', handlePointerDownOutside);
    }
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside);
  }, [isOpen]);

  const selectModule = (module: AppModule) => {
    setIsOpen(false);
    if (module === activeModule) return;
    setModule(module);
    onSwitched?.();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('modules.switcherLabel')}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
            activeModule === 'core-hr'
              ? 'bg-teal-600 text-white'
              : 'bg-primary text-white'
          }`}
        >
          {activeModule === 'core-hr' ? 'HR' : 'R'}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-gray-500">
            {t('modules.product')}
          </span>
          <span className="block text-sm font-semibold text-dark-text truncate">
            {t(current.labelKey)}
          </span>
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] overflow-hidden">
          <div className="py-1" role="menu">
            {MODULES.map((mod) => {
              const selected = mod.id === activeModule;
              return (
                <button
                  key={mod.id}
                  type="button"
                  role="menuitem"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    selectModule(mod.id);
                  }}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                    selected ? 'bg-primary/10' : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                      mod.id === 'core-hr' ? 'bg-teal-600 text-white' : 'bg-primary text-white'
                    }`}
                  >
                    {mod.id === 'core-hr' ? 'HR' : 'R'}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={`block text-sm font-semibold ${
                        selected ? 'text-primary' : 'text-dark-text'
                      }`}
                    >
                      {t(mod.labelKey)}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {t(mod.descriptionKey)}
                    </span>
                  </span>
                  {selected && (
                    <svg
                      className="w-4 h-4 mt-1 shrink-0 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
