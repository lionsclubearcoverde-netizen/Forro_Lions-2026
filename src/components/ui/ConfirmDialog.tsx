import { useEffect, useRef, useState, type ReactNode } from "react";
import Modal, { ModalCloseButton } from "./Modal";
import Spinner from "./Spinner";

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" para ações destrutivas (exclusão/liberação). */
  tone?: "default" | "danger";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Substituto acessível de window.confirm — funciona igual no desktop e no celular
 * (diálogos nativos do navegador têm visual inconsistente em Android/iOS).
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onCancel} labelledBy="confirm-dialog-title">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="confirm-dialog-title" className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          <ModalCloseButton onClose={onCancel} />
        </div>
        <div className="mt-2 text-sm leading-relaxed text-slate-600">{message}</div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            disabled={busy}
            className="btn btn-outline min-h-11 sm:min-h-10"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={handleConfirm}
            disabled={busy}
            className={`btn min-h-11 sm:min-h-10 ${
              tone === "danger" ? "btn-danger" : "btn-primary"
            }`}
          >
            {busy && <Spinner size={16} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
