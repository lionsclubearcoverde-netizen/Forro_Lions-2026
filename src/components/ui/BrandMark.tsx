interface BrandMarkProps {
  size?: number;
  /** Exibe a palavra "Lions" ao lado do símbolo. */
  withWordmark?: boolean;
}

/** Símbolo da marca — substitui o quadrado genérico com letra "L". */
export default function BrandMark({ size = 40, withWordmark = false }: BrandMarkProps) {
  return (
    <span className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 font-display font-extrabold text-white shadow-lg shadow-brand-900/25 ring-1 ring-white/20"
        style={{ width: size, height: size, fontSize: size * 0.46 }}
      >
        L
      </span>
      {withWordmark && (
        <span className="font-display text-lg font-bold tracking-tight leading-none">
          Gestão <span className="text-brand-600">Lions</span>
        </span>
      )}
    </span>
  );
}
