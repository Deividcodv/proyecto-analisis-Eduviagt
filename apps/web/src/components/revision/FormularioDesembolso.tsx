'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Desembolso } from '@/lib/api';

interface Props {
  solicitudId: string;
  desembolso: Desembolso | null;
  montoAprobado?: string | null;
  onGuardar: (datos: Record<string, unknown>) => Promise<void>;
  onCerrar: () => void;
  guardando?: boolean;
}

/**
 * Registro del pago de una beca aprobada.
 *
 * Lo usa la autoridad competente (jefe de becas o administrador): deja el
 * estado del pago, la forma de entrega, los datos bancarios y la fecha.
 */
export function FormularioDesembolso({
  solicitudId,
  desembolso,
  montoAprobado,
  onGuardar,
  onCerrar,
  guardando = false,
}: Props) {
  const [estado, setEstado] = useState<string>(desembolso?.estado ?? 'PENDIENTE');
  const [metodo, setMetodo] = useState<string>(desembolso?.metodo ?? 'TRANSFERENCIA');
  const [banco, setBanco] = useState(desembolso?.banco ?? '');
  const [numeroCuenta, setNumeroCuenta] = useState(
    desembolso?.numeroCuenta ?? '',
  );
  const [titular, setTitular] = useState(desembolso?.titular ?? '');
  const [fechaPago, setFechaPago] = useState(
    desembolso?.fechaPago ? desembolso.fechaPago.slice(0, 10) : '',
  );
  const [notas, setNotas] = useState(desembolso?.notas ?? '');

  const guardar = async () => {
    await onGuardar({
      estado,
      metodo,
      banco: banco || undefined,
      numeroCuenta: numeroCuenta || undefined,
      titular: titular || undefined,
      fechaPago: fechaPago || undefined,
      notas: notas || undefined,
    });
  };

  return (
    <Dialog
      open
      titulo="Registrar el pago de la beca"
      descripcion={`Solicitud ${solicitudId.slice(0, 8)}${
        montoAprobado ? ` · monto aprobado Q${montoAprobado}` : ''
      }`}
      onCerrar={onCerrar}
      ancho="lg"
      pie={
        <>
          <Button variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar el pago'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Estado del pago"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          options={[
            { value: 'PENDIENTE', label: 'Pendiente de gestionar' },
            { value: 'EN_TRAMITE', label: 'En trámite' },
            { value: 'PAGADO', label: 'Pagado' },
            { value: 'ANULADO', label: 'Anulado' },
          ]}
        />
        <Select
          label="Forma de entrega"
          value={metodo}
          onChange={(e) => setMetodo(e.target.value)}
          options={[
            { value: 'TRANSFERENCIA', label: 'Transferencia' },
            { value: 'CHEQUE', label: 'Cheque' },
            { value: 'EFECTIVO', label: 'Efectivo' },
          ]}
        />
        <Input
          label="Banco"
          value={banco}
          onChange={(e) => setBanco(e.target.value)}
        />
        <Input
          label="Número de cuenta"
          value={numeroCuenta}
          onChange={(e) => setNumeroCuenta(e.target.value)}
        />
        <Input
          label="Titular de la cuenta"
          value={titular}
          onChange={(e) => setTitular(e.target.value)}
        />
        <Input
          label="Fecha del pago"
          type="date"
          value={fechaPago}
          onChange={(e) => setFechaPago(e.target.value)}
        />
      </div>
      <div className="mt-4">
        <Input
          label="Notas (opcional)"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>
    </Dialog>
  );
}
