import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { groupVariables } from '../lib/workflowVariables';
import type { WorkflowVariableDescriptor } from '../models/variableCatalog';

type Props = {
  variables: WorkflowVariableDescriptor[];
  disabled?: boolean;
  /** Button label */
  label?: string;
  onSelect: (variable: WorkflowVariableDescriptor) => void;
};

type PopoverPosition = {
  top: number;
  left: number;
  maxHeight: number;
};

const POPOVER_WIDTH = 320;
const VIEWPORT_PAD = 8;

function computePosition(anchor: DOMRect): PopoverPosition {
  const spaceBelow = window.innerHeight - anchor.bottom - VIEWPORT_PAD;
  const spaceAbove = anchor.top - VIEWPORT_PAD;
  const preferBelow = spaceBelow >= 240 || spaceBelow >= spaceAbove;

  const maxHeight = Math.min(320, Math.max(160, preferBelow ? spaceBelow : spaceAbove));
  const top = preferBelow
    ? anchor.bottom + 4
    : Math.max(VIEWPORT_PAD, anchor.top - 4 - maxHeight);

  let left = anchor.right - POPOVER_WIDTH;
  left = Math.min(left, window.innerWidth - POPOVER_WIDTH - VIEWPORT_PAD);
  left = Math.max(VIEWPORT_PAD, left);

  return { top, left, maxHeight };
}

export default function WorkflowVariablePicker({
  variables,
  disabled = false,
  label = 'Insert Variable',
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setPosition(null);
      return;
    }

    const update = () => {
      if (!buttonRef.current) return;
      setPosition(computePosition(buttonRef.current.getBoundingClientRect()));
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return variables;
    return variables.filter(
      (v) =>
        v.path.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.group.toLowerCase().includes(q) ||
        v.source.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q),
    );
  }, [variables, query]);

  const groups = useMemo(() => groupVariables(filtered), [filtered]);

  const popover =
    open && position
      ? createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              width: POPOVER_WIDTH,
              maxHeight: position.maxHeight,
            }}
            className="z-[80] flex flex-col rounded-xl border border-gray-200 bg-white shadow-lg"
          >
            <div className="px-3 pt-3 pb-2 border-b border-gray-100 shrink-0">
              <p className="text-xs font-semibold text-dark-text mb-2">Variables</p>
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search variables…"
                className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0077E6]/20 focus:border-[#0077E6]"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle p-2">
              {groups.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-gray-500">
                  No variables match your search.
                </p>
              ) : (
                groups.map(({ group, variables: items }) => (
                  <div key={group} className="mb-2 last:mb-0">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      {group}
                    </p>
                    <ul className="space-y-0.5">
                      {items.map((variable) => (
                        <li
                          key={`${variable.path}-${variable.source}-${variable.producedByStepId ?? ''}`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelect(variable);
                              setOpen(false);
                              setQuery('');
                            }}
                            className="w-full text-left rounded-lg px-2 py-1.5 hover:bg-sky-50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-dark-text truncate">
                                {variable.name}
                              </span>
                              <span className="text-[10px] text-gray-400 shrink-0">
                                {variable.type}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-gray-500 truncate">
                                {variable.path}
                              </span>
                              <span className="text-[10px] text-gray-400 shrink-0 truncate max-w-[40%]">
                                {variable.source}
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="inline-block">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-medium text-[#0077E6] hover:underline disabled:opacity-50 disabled:no-underline"
      >
        {label}
      </button>
      {popover}
    </div>
  );
}
