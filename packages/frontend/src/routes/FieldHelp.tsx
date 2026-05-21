import { useId, useRef, useCallback } from "react";

interface FieldHelpProps {
  label: string;
  children: string;
}

export function FieldHelp({ label, children }: FieldHelpProps) {
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);

  /**
   * Positions the tooltip using `position: fixed` so it is never clipped by
   * parent containers with overflow:hidden or by narrow parent bounds.
   * Prefers right-aligned (tooltip extends left from button), falls back to
   * left-aligned when there isn't enough room on the left.
   */
  const show = useCallback(() => {
    const button = buttonRef.current;
    const bubble = bubbleRef.current;
    if (!button || !bubble) return;

    const btnRect = button.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const maxW = Math.min(260, vw - 32);

    bubble.style.position = "fixed";
    bubble.style.top = `${btnRect.bottom + 7}px`;
    bubble.style.maxWidth = `${maxW}px`;
    bubble.style.right = "";

    // Prefer: right-align tooltip so its right edge meets the button's right edge.
    const rightAlignedLeft = btnRect.right - maxW;
    if (rightAlignedLeft >= 8) {
      bubble.style.left = `${rightAlignedLeft}px`;
    } else {
      // Fall back to left-aligned from the button, clamped to viewport edges.
      bubble.style.left = `${Math.max(8, Math.min(btnRect.left, vw - maxW - 8))}px`;
    }
  }, []);

  const hide = useCallback(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    bubble.style.position = "";
    bubble.style.top = "";
    bubble.style.left = "";
    bubble.style.maxWidth = "";
  }, []);

  return (
    <span className="field-help" onMouseLeave={hide} onBlurCapture={hide}>
      <button
        ref={buttonRef}
        type="button"
        className="field-help__button"
        aria-label={`More information about ${label}`}
        aria-describedby={id}
        onMouseEnter={show}
        onFocus={show}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        i
      </button>
      <span ref={bubbleRef} id={id} role="tooltip" className="field-help__bubble">
        {children}
      </span>
    </span>
  );
}
