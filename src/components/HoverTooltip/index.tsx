import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {createPortal} from 'react-dom';
import styles from './styles.module.css';

const ROOT_GAP = 10;
// Stacked tooltips overlap their ancestor by a couple of pixels rather than
// leaving a gap above it. Any gap at all is dead space the pointer has to
// cross in a straight line within HIDE_DELAY, and missing it even slightly
// (the usual case with a real, not perfectly vertical, mouse movement)
// closes the ancestor — which unmounts every tooltip stacked on top of it.
// Overlapping removes that dead space entirely: the pointer is always over
// one tooltip or the other.
const STACK_OVERLAP = 4;
const EDGE_MARGIN = 12;
// Keeps a tooltip open while the pointer travels from its trigger into the
// (portaled) tooltip itself, e.g. to hover a nested term inside it.
const HIDE_DELAY = 200;

// The top edge (viewport px) of the nearest currently-open ancestor tooltip.
// A tooltip opened from a term inside another tooltip reads this and stacks
// above that box instead of above its own trigger word, which would often
// be the same line as, or lower than, the ancestor's own top edge and so
// overlap it. Each tooltip provides its own measured top edge to whatever
// opens inside it, so a chain of nested tooltips stacks upward, one above
// the next, however deep it goes.
const TooltipStackContext = createContext<number | null>(null);

export default function HoverTooltip({
  triggerClassName,
  tooltipClassName,
  children,
  tooltip,
}: {
  triggerClassName: string;
  tooltipClassName: string;
  children: ReactNode;
  tooltip: ReactNode;
}): ReactNode {
  const stackTop = useContext(TooltipStackContext);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{top: number; left: number} | null>(null);
  const [ownTop, setOwnTop] = useState<number | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const top = stackTop !== null ? stackTop + STACK_OVERLAP : rect.top - ROOT_GAP;
      setCoords({top, left: rect.left + rect.width / 2});
    }
    setVisible(true);
  }, [stackTop]);

  const scheduleHide = useCallback(() => {
    hideTimer.current = setTimeout(() => setVisible(false), HIDE_DELAY);
  }, []);

  // Nudge the tooltip back on-screen if centering it on the trigger would
  // otherwise push it past the left/right edge of the viewport, and record
  // its own top edge for any tooltip nested inside it to stack above.
  useLayoutEffect(() => {
    if (!visible || !coords || !tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    const halfWidth = rect.width / 2;
    let left = coords.left;
    if (left - halfWidth < EDGE_MARGIN) {
      left = EDGE_MARGIN + halfWidth;
    } else if (left + halfWidth > window.innerWidth - EDGE_MARGIN) {
      left = window.innerWidth - EDGE_MARGIN - halfWidth;
    }
    if (left !== coords.left) {
      tooltipRef.current.style.left = `${left}px`;
    }
    if (rect.top !== ownTop) {
      setOwnTop(rect.top);
    }
  }, [visible, coords, ownTop]);

  return (
    <span
      ref={triggerRef}
      className={triggerClassName}
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      onFocus={show}
      onBlur={scheduleHide}
    >
      {children}
      {visible && coords && typeof document !== 'undefined'
        ? createPortal(
            <span
              ref={tooltipRef}
              className={`${styles.portalTooltip} ${tooltipClassName}`}
              role="tooltip"
              style={{top: coords.top, left: coords.left}}
              onMouseEnter={show}
              onMouseLeave={scheduleHide}
            >
              <TooltipStackContext.Provider value={ownTop ?? coords.top}>
                {tooltip}
              </TooltipStackContext.Provider>
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
