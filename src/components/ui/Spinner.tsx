interface SpinnerProps {
  /** Diâmetro em pixels. */
  size?: number;
  className?: string;
}

/** Anel de carregamento reutilizável (cor herdada via `currentColor`). */
export default function Spinner({ size = 20, className = "" }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px] ${className}`}
    />
  );
}
