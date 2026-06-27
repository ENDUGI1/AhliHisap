import { useId } from "react";
import "./LiquidLevel.css";

type Tone = "aqua" | "amber" | "coral";

const TONE: Record<Tone, { top: string; bottom: string; crest: string }> = {
  aqua: { top: "#4FD6C1", bottom: "#2FA894", crest: "#7BE6D5" },
  amber: { top: "#F2A93C", bottom: "#C4811F", crest: "#FFCB73" },
  coral: { top: "#E8917E", bottom: "#C46D59", crest: "#F4B3A4" },
};

interface Props {
  /** 0..1 — how full. Animates via CSS transition on height. */
  level: number;
  tone?: Tone;
  /** visual height of the vessel in px */
  height?: number;
  className?: string;
  children?: React.ReactNode;
  /** quieter wave for backgrounded/secondary uses */
  calm?: boolean;
}

/**
 * The signature: a real liquid surface that moves with state.
 * In onboarding it responds to the baseline; in the app it reads as stock/momentum.
 */
export function LiquidLevel({
  level,
  tone = "aqua",
  height = 160,
  className = "",
  children,
  calm = false,
}: Props) {
  const id = useId().replace(/:/g, "");
  const c = TONE[tone];
  const fill = Math.max(0, Math.min(1, level));
  const fillPct = `${(fill * 100).toFixed(1)}%`;

  return (
    <div
      className={`liquid ${calm ? "liquid--calm" : ""} ${className}`}
      style={{ height }}
      role="img"
      aria-label={`Level ${Math.round(fill * 100)} persen`}
    >
      <div className="liquid__body" style={{ height: fillPct }}>
        <svg
          className="liquid__wave"
          viewBox="0 0 240 24"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={c.top} />
              <stop offset="1" stopColor={c.bottom} />
            </linearGradient>
          </defs>
          {/* two crests, offset & different speeds for parallax depth */}
          <path
            className="liquid__crest liquid__crest--back"
            fill={c.crest}
            opacity="0.35"
            d="M0 10 C 30 2, 60 18, 120 10 C 180 2, 210 18, 240 10 L 240 24 L 0 24 Z"
          />
          <path
            className="liquid__crest"
            fill={`url(#g${id})`}
            d="M0 12 C 40 4, 80 20, 120 12 C 160 4, 200 20, 240 12 L 240 24 L 0 24 Z"
          />
        </svg>
        <div className="liquid__fill" style={{ background: `linear-gradient(${c.top}, ${c.bottom})` }} />
      </div>
      {children && <div className="liquid__overlay">{children}</div>}
    </div>
  );
}
