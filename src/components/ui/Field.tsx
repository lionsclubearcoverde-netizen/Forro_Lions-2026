import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  icon?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}

/** Wrapper padronizado de campos de formulário (label + ícone + controle). */
export default function Field({ label, icon, htmlFor, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-bold text-gray-400 uppercase mb-1"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

export const inputClass =
  "w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm";

export const selectClass = `${inputClass} appearance-none bg-white`;
