interface SpinnerProps {
  className?: string;
}

export function Spinner({ className = '' }: SpinnerProps) {
  return (
    <div
      className={`inline-block h-8 w-8 animate-spin rounded-brutal border-4 border-brutal-tinta border-t-sigeb-blue ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
}