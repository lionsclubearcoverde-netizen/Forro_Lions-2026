import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/** Estado de erro visível na UI com opção de nova tentativa. */
export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 h-64 bg-red-50 border border-red-100 rounded-3xl p-6 text-center"
    >
      <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
        <AlertTriangle size={28} />
      </div>
      <div>
        <p className="font-bold text-red-700">Não foi possível carregar os dados</p>
        <p className="text-sm text-red-600 mt-1 break-words max-w-md">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <RotateCcw size={16} />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
