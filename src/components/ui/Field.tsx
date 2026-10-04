import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  icon?: ReactNode;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}

/** Wrapper padronizado de campos de formulário (label + ícone + controle). */
export default function Field({ label, icon, htmlFor, hint, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        {children}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-[inset_0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";

export const selectClass = `${inputClass} appearance-none bg-white pr-9`;
