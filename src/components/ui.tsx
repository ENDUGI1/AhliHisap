import { type ReactNode, type InputHTMLAttributes } from "react";
import "./ui.css";

/* ---------------- Button ---------------- */
type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "ghost" | "quiet";
  tone?: "aqua" | "amber" | "coral";
  full?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  variant = "primary",
  tone = "aqua",
  full,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant} btn--${tone} ${full ? "btn--full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------------- Segmented ---------------- */
interface SegOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          className={`seg__opt ${value === o.value ? "is-on" : ""}`}
          onClick={() => onChange(o.value)}
        >
          <span className="seg__label">{o.label}</span>
          {o.hint && <span className="seg__hint mono">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Numeric field (label above, helper below) ---------------- */
export function Field({
  label,
  helper,
  prefix,
  suffix,
  ...input
}: {
  label: string;
  helper?: string;
  prefix?: string;
  suffix?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <label className="field" htmlFor={id}>
      <span className="field__label">{label}</span>
      <span className="field__box">
        {prefix && <span className="field__affix mono">{prefix}</span>}
        <input
          id={id}
          inputMode="numeric"
          className="field__input mono"
          {...input}
        />
        {suffix && <span className="field__affix field__affix--r mono">{suffix}</span>}
      </span>
      {helper && <span className="field__helper">{helper}</span>}
    </label>
  );
}

/* ---------------- Card ---------------- */
export function Card({
  children,
  className = "",
  ...rest
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}
