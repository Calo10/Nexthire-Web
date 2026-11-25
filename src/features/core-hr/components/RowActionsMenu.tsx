import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

export type RowMenuItem = {
  key: string;
  label: string;
  onClick?: () => void;
  /** Renders an anchor (e.g. mailto:). */
  href?: string;
  danger?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  dividerBefore?: boolean;
};

type Props = {
  items: RowMenuItem[];
  ariaLabel: string;
};

const MENU_WIDTH = 208;

/** Kebab menu rendered in a portal with fixed positioning so scrollable table wrappers never clip it. */
export default function RowActionsMenu({ items, ariaLabel }: Props) {
  const { t } = useTranslation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const visible = items.filter((i) => !i.hidden);

  const close = () => setPos(null);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pos) return close();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estimatedHeight = visible.length * 38 + 16;
    const openUp = rect.bottom + estimatedHeight > window.innerHeight - 8;
    setPos({
      top: openUp ? Math.max(8, rect.top - estimatedHeight - 4) : rect.bottom + 4,
      left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
    });
  };

  useEffect(() => {
    if (!pos) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [pos]);

  if (visible.length === 0) return null;

  const itemClass = (item: RowMenuItem) =>
    `block w-full px-4 py-2 text-left text-sm transition-colors ${
      item.disabled
        ? 'cursor-not-allowed text-gray-300'
        : item.danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-700 hover:bg-gray-50'
    }`;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={!!pos}
        onClick={toggle}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {pos
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={t('coreHr.employees.table.actions')}
              style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
              className="fixed z-[60] rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {visible.map((item) => (
                <div key={item.key} className={item.dividerBefore ? 'mt-1 border-t border-gray-100 pt-1' : ''}>
                  {item.href && !item.disabled ? (
                    <a role="menuitem" href={item.href} className={itemClass(item)} onClick={close}>
                      {item.label}
                    </a>
                  ) : (
                    <button
                      role="menuitem"
                      type="button"
                      disabled={item.disabled}
                      className={itemClass(item)}
                      onClick={() => {
                        close();
                        item.onClick?.();
                      }}
                    >
                      {item.label}
                    </button>
                  )}
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
