"use client";

import {
  type RefObject,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type Point = { x: number; y: number };
type Segment = { from: Point; to: Point };

type PointerArrowProps = {
  from: RefObject<HTMLElement | null>;
  to: RefObject<HTMLElement | null>;
};

/**
 * Draws an arrow from one element to another. Render it inside the nearest
 * `relative` ancestor that contains both ends.
 *
 * Positions are measured rather than hard-coded so the arrow follows the
 * layout at every screen width, and re-measured after every render because the
 * target can move without either ref object changing.
 */
export function PointerArrow({ from, to }: PointerArrowProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const markerId = `arrow-${useId().replace(/[^\w-]/g, "")}`;
  const [segment, setSegment] = useState<Segment | null>(null);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const start = from.current;
    const end = to.current;
    if (!svg || !start || !end) {
      return;
    }
    const measure = () => {
      const next = connect(
        svg.getBoundingClientRect(),
        start.getBoundingClientRect(),
        end.getBoundingClientRect(),
      );
      setSegment((previous) =>
        previous && sameSegment(previous, next) ? previous : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    observer.observe(start);
    observer.observe(end);
    return () => observer.disconnect();
  });

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full overflow-visible text-pointer"
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>
      {segment ? (
        <line
          x1={segment.from.x}
          y1={segment.from.y}
          x2={segment.to.x}
          y2={segment.to.y}
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          markerEnd={`url(#${markerId})`}
        />
      ) : null}
    </svg>
  );
}

/** Line between the two boxes' edges, along the line joining their centres. */
function connect(frame: DOMRect, start: DOMRect, end: DOMRect): Segment {
  const a = centre(start, frame);
  const b = centre(end, frame);
  return {
    from: edgeToward(a, start, b, 2),
    to: edgeToward(b, end, a, 4),
  };
}

function centre(box: DOMRect, frame: DOMRect): Point {
  return {
    x: box.left - frame.left + box.width / 2,
    y: box.top - frame.top + box.height / 2,
  };
}

/** Where the ray from `origin` toward `target` leaves `box`, plus a small gap. */
function edgeToward(
  origin: Point,
  box: DOMRect,
  target: Point,
  gap: number,
): Point {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return origin;
  }
  const scale = Math.min(
    dx === 0 ? Infinity : box.width / 2 / Math.abs(dx),
    dy === 0 ? Infinity : box.height / 2 / Math.abs(dy),
  );
  const toEdge = Math.min(scale * length + gap, length / 2);
  return {
    x: origin.x + (dx / length) * toEdge,
    y: origin.y + (dy / length) * toEdge,
  };
}

function sameSegment(a: Segment, b: Segment): boolean {
  return (
    Math.abs(a.from.x - b.from.x) < 0.5 &&
    Math.abs(a.from.y - b.from.y) < 0.5 &&
    Math.abs(a.to.x - b.to.x) < 0.5 &&
    Math.abs(a.to.y - b.to.y) < 0.5
  );
}
