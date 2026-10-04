interface LoadingStateProps {
  label?: string;
}

export default function LoadingState({ label = "Carregando..." }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center h-64 gap-3 text-gray-500"
    >
      <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
