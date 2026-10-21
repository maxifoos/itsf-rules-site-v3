import React, {useCallback, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import styles from './styles.module.css';

const GAP = 10;
const EDGE_MARGIN = 12;
// Keeps the tooltip open while the pointer travels from the trigger into the
// (portaled) tooltip itself, e.g. to hover a nested term inside it.
const HIDE_DELAY = 120;

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
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{top: number; left: number} | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setCoords({top: rect.top - GAP, left: rect.left + rect.width / 2});
    }
    setVisible(true);
  }, []);

  const scheduleHide = useCallback(() => {
    hideTimer.current = setTimeout(() => setVisible(false), HIDE_DELAY);
  }, []);

  // Nudge the tooltip back on-screen if centering it on the trigger would
  // otherwise push it past the left/right edge of the viewport.
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
  }, [visible, coords]);

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
              {tooltip}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
