'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { fetchConToken } from '@/lib/api-auth';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';

interface AuditItem {
  id: string;
  usuarioId: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  ip: string | null;
  createdAt: string;
  usuario: { nombres: string; email: string; rol: { nombre: string } };
}

interface AuditResponse {
  total: number;
  page: number;
  limit: number;
  items: AuditItem[];
}

export default function AuditoriaPage() {
  return (
    <ProtectedRoute roles={['ADMIN']}>
      <AuditoriaContent />
    </ProtectedRoute>
  );
}

function AuditoriaContent() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [entidad, setEntidad] = useState('');
  const [accion, setAccion] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const cargar = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (entidad) params.set('entidad', entidad);
      if (accion) params.set('accion', accion);
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);

      const result = await fetchConToken<AuditResponse>(`/audit?${params.toString()}`);
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando auditoría');
    }
  }, [page, entidad, accion, desde, hasta]);

  useEffect(() => { cargar(); }, [cargar]);

  const totalPaginas = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <>
      <InternalPageHeader
        title="Auditoría"
        subtitle="Historial de mutaciones del sistema"
      />

      <Container className="py-10">
        {error && (
          <p className="mb-6 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">{error}</p>
        )}

        <Card className="mb-6 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              placeholder="Entidad (ej. solicitud)"
              value={entidad}
              onChange={(e) => { setEntidad(e.target.value); setPage(1); }}
            />
            <Input
              placeholder="Acción (ej. create)"
              value={accion}
              onChange={(e) => { setAccion(e.target.value); setPage(1); }}
            />
            <Input
              type="date"
              placeholder="Desde"
              value={desde}
              onChange={(e) => { setDesde(e.target.value); setPage(1); }}
            />
            <Input
              type="date"
              placeholder="Hasta"
              value={hasta}
              onChange={(e) => { setHasta(e.target.value); setPage(1); }}
            />
          </div>
        </Card>

        {!data ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
          <>
            <p className="brut-label mb-4 text-xs font-bold text-brutal-tinta/60">
              {data.total} registros · Página {data.page}/{totalPaginas}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-[3px] border-brutal-tinta bg-brutal-tinta text-brutal-papel">
                    <th className="px-3 py-2 text-left font-brut text-xs font-black uppercase">Fecha</th>
                    <th className="px-3 py-2 text-left font-brut text-xs font-black uppercase">Usuario</th>
                    <th className="px-3 py-2 text-left font-brut text-xs font-black uppercase">Rol</th>
                    <th className="px-3 py-2 text-left font-brut text-xs font-black uppercase">Acción</th>
                    <th className="px-3 py-2 text-left font-brut text-xs font-black uppercase">Entidad</th>
                    <th className="px-3 py-2 text-left font-brut text-xs font-black uppercase">ID</th>
                    <th className="px-3 py-2 text-left font-brut text-xs font-black uppercase">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id} className="border-b border-brutal-tinta/10 hover:bg-brutal-cyan/5">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                        {new Date(item.createdAt).toLocaleString('es-GT')}
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-bold text-brutal-tinta">{item.usuario.nombres}</p>
                        <p className="text-xs text-brutal-tinta/60">{item.usuario.email}</p>
                      </td>
                      <td className="px-3 py-2 text-xs font-bold uppercase">{item.usuario.rol.nombre}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-brutal border border-brutal-tinta/20 bg-brutal-gold/20 px-2 py-0.5 font-mono text-xs font-bold">
                          {item.accion}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{item.entidad}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-brutal-tinta/50">
                        {item.entidadId ? `${item.entidadId.slice(0, 8)}…` : '—'}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-brutal-tinta/50">{item.ip ?? '—'}</td>
                    </tr>
                  ))}
                  {data.items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-brutal-tinta/50">
                        No se encontraron registros de auditoría
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Anterior
              </Button>
              <span className="font-mono text-xs text-brutal-tinta/60">
                Página {page} de {totalPaginas || 1}
              </span>
              <Button
                variant="ghost"
                disabled={page >= totalPaginas}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente →
              </Button>
            </div>
          </>
        )}
      </Container>
    </>
  );
}
