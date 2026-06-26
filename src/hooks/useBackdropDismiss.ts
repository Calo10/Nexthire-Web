import { useCallback, useRef } from 'react';
import type { PointerEventHandler } from 'react';

/**
 * Close overlays only when the pointer down AND up occur on the backdrop itself.
 * Prevents accidental dismiss when the user presses inside the panel and releases outside.
 */
export function useBackdropDismiss(onDismiss: () => void) {
  const pointerDownOnBackdrop = useRef(false);

  const onPointerDown: PointerEventHandler<HTMLElement> = useCallback((event) => {
    pointerDownOnBackdrop.current = event.target === event.currentTarget;
  }, []);

  const onPointerUp: PointerEventHandler<HTMLElement> = useCallback(
    (event) => {
      if (pointerDownOnBackdrop.current && event.target === event.currentTarget) {
        onDismiss();
      }
      pointerDownOnBackdrop.current = false;
    },
    [onDismiss]
  );

  const onPointerCancel: PointerEventHandler<HTMLElement> = useCallback(() => {
    pointerDownOnBackdrop.current = false;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
}
