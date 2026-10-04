import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

interface ModalProps {
  onClose: () => void;
  labelledBy?: string;
  children: ReactNode;
}

/**
 * Modal acessível: fecha com ESC, bloqueia scroll do body,
 * focus trap simples e aria-modal. No celular comporta-se como
 * "bottom sheet" (desliza de baixo, cantos superiores arredondados).
 */
export default function Modal({ onClose, labelledBy, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 48 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.05 }}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl outline-none sm:max-w-lg sm:rounded-3xl"
      >
        {/* Alça visual de bottom sheet no celular */}
        <div className="sticky top-0 z-10 flex justify-center bg-white pt-3 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-slate-300" aria-hidden="true" />
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Fechar"
      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
    >
      <X size={20} className="text-gray-400" />
    </button>
  );
}
