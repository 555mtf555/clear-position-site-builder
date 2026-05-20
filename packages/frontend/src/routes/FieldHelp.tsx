import { useId, useRef, useCallback } from "react";

interface FieldHelpProps {
  label: string;
  children: string;
}

export function FieldHelp({ label, children }: FieldHelpProps) {
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);

  // Repositions the bubble to stay within the viewport on hover/focus.
  // Prefers right-aligned (extends left from button), falls back to left-aligned.
  const reposition = useCallback(() => {
    const button = buttonRef.current;
    const bubble = bubbleRef.current;
    if (!button || !bubble) return;

    const btnRect = button.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const maxW = Math.min(260, vw - 32);

    bubble.style.maxWidth = `${maxW}px`;

    const spaceLeft = btnRect.right - 8;        // room available to the left of button
    const spaceRight = vw - btnRect.left - 8;   // room available to the right of button

    if (spaceLeft >= maxW) {
      // Right-aligned: tooltip extends leftward from the button edge.
      bubble.style.right = "0";
      bubble.style.left = "auto";
    } else if (spaceRight >= maxW) {
      // Left-aligned: tooltip extends rightward from the button edge.
      bubble.style.left = "0";
      bubble.style.right = "auto";
    } else {
      // Neither side has enough room; anchor to whichever side has more space.
      if (spaceLeft >= spaceRight) {
        bubble.style.right = "0";
        bubble.style.left = "auto";
        bubble.style.maxWidth = `${spaceLeft}px`;
      } else {
        bubble.style.left = "0";
        bubble.style.right = "auto";
        bubble.style.maxWidth = `${spaceRight}px`;
      }
    }
  }, []);

  return (
    <span className="field-help">
      <button
        ref={buttonRef}
        type="button"
        className="field-help__button"
        aria-label={`More information about ${label}`}
        aria-describedby={id}
        onMouseEnter={reposition}
        onFocus={reposition}
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
