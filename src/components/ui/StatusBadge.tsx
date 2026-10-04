import { STATUS_STYLES } from "../../constants";
import type { MesaStatus } from "../../types";

interface StatusBadgeProps {
  status: MesaStatus;
  size?: "sm" | "md";
}

/** Chip de status padronizado (cores unificadas com o mapa de mesas). */
export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="chip"
      style={{ backgroundColor: s.chipBg, color: s.chipText }}
    >
      <span
        aria-hidden="true"
        className={`inline-block rounded-full ${size === "md" ? "h-2.5 w-2.5" : "h-2 w-2"}`}
        style={{ backgroundColor: s.solid }}
      />
      {s.label}
    </span>
  );
}
