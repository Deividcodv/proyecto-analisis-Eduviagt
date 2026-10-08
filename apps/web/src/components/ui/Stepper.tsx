import { Icon } from '@/components/ui/Icon';

interface StepperProps {
  pasos: string[];
  actual: number;
  completados?: boolean[];
  className?: string;
}

export function Stepper({ pasos, actual, completados, className = '' }: StepperProps) {
  return (
    <ol className={`flex flex-wrap items-center gap-2 ${className}`}>
      {pasos.map((paso, index) => {
        const numero = index + 1;
        const activo = numero === actual;
        const completado = completados ? (completados[index] ?? false) : numero < actual;
        return (
          <li key={paso} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center border-2 border-brutal-tinta font-brut text-sm font-black ${
                  completado
                    ? 'bg-brutal-lima text-brutal-tinta'
                    : activo
                      ? 'bg-sigeb-blue text-white'
                      : 'bg-brutal-papel text-brutal-tinta'
                }`}
              >
                {completado ? <Icon name="check" className="h-4 w-4" /> : numero}
              </span>
              <span
                className={`font-brut text-sm font-bold uppercase ${activo ? 'text-brutal-tinta' : 'text-brutal-tinta/80'}`}
              >
                {paso}
              </span>
            </div>
            {index < pasos.length - 1 && (
              <span className="mx-1 h-[3px] w-8 bg-brutal-tinta" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
