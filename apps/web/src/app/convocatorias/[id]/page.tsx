import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BotonPostular } from '@/components/convocatorias/BotonPostular';
import { CuentaRegresiva } from '@/components/convocatorias/CuentaRegresiva';
import {
  httpData,
  formatearFecha,
  ETIQUETA_COBERTURA,
  type ConvocatoriaDetalle,
} from '@/lib/api';

interface Props {
  params: { id: string };
}

function codigoConvocatoria(convocatoria: ConvocatoriaDetalle): string {
  const anio = convocatoria.fechaApertura
    ? new Date(convocatoria.fechaApertura).getFullYear()
    : new Date().getFullYear();
  const hex = convocatoria.id.replace(/[^0-9a-f]/gi, '').slice(0, 4) || '0000';
  const numero = parseInt(hex, 16) % 10000;
  return `CONV-${anio}-${String(numero).padStart(4, '0')}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let convocatoria: ConvocatoriaDetalle | null = null;
  try {
    convocatoria = await httpData<ConvocatoriaDetalle>(`/convocatorias/${params.id}`);
  } catch {
    return { title: 'Convocatoria | EDUVIAGT' };
  }
  return {
    title: `${convocatoria.nombre} | EDUVIAGT`,
    description: convocatoria.descripcion ?? undefined,
  };
}

export default async function ConvocatoriaDetallePage({ params }: Props) {
  let convocatoria: ConvocatoriaDetalle;
  try {
    convocatoria = await httpData<ConvocatoriaDetalle>(
      `/convocatorias/${params.id}`,
    );
  } catch {
    return notFound();
  }

  const abierta = convocatoria.estado === 'ABIERTA';
  const codigo = codigoConvocatoria(convocatoria);
  const docs = convocatoria.documentosRequeridos ?? [];
  const criterios = convocatoria.beca?.criteriosEvaluacion ?? [];
  const campos = convocatoria.formulario ?? [];

  return (
    <main>
      <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-sigeb-blue-dark py-12 text-brutal-papel">
        <Container>
          <Link
            href="/convocatorias"
            className="mb-6 inline-block rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco px-3 py-1 font-mono text-xs font-bold text-brutal-tinta"
          >
            ← Volver a convocatorias
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="tabular font-mono text-xs font-bold uppercase tracking-[0.15em] text-brutal-gold">
              {codigo}
            </span>
            <Badge estado={convocatoria.estado} />
            <span className="brut-label font-mono text-xs font-bold uppercase text-brutal-gold">
              {convocatoria.beca.nombre}
            </span>
          </div>
          <h1 className="text-mega mt-3 max-w-4xl text-3xl font-black md:text-5xl">
            {convocatoria.nombre}
          </h1>
          {abierta && (
            <div className="mt-5">
              <CuentaRegresiva fecha={convocatoria.fechaCierre} />
            </div>
          )}
        </Container>
      </section>

      <section className="bg-brutal-papel py-10">
        <Container>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-6 shadow-brutal-sm">
                <h2 className="mb-3 font-brut text-xl font-black uppercase tracking-wide text-brutal-tinta">
                  Descripción
                </h2>
                <p className="whitespace-pre-line text-brutal-tinta/80">
                  {convocatoria.descripcion ||
                    'No se ha proporcionado una descripción para esta convocatoria.'}
                </p>
              </div>

              {criterios.length > 0 && (
                <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-6 shadow-brutal-sm">
                  <h2 className="mb-3 font-brut text-xl font-black uppercase tracking-wide text-brutal-tinta">
                    Criterios de evaluación
                  </h2>
                  <table className="w-full text-left font-mono text-sm">
                    <thead>
                      <tr className="border-b-[3px] border-brutal-tinta text-brutal-tinta">
                        <th className="py-2 pr-4 font-bold">Criterio</th>
                        <th className="py-2 font-bold">Peso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criterios.map((criterio) => (
                        <tr key={criterio.id} className="border-b border-brutal-tinta/20">
                          <td className="py-2 pr-4 text-brutal-tinta">{criterio.nombre}</td>
                          <td className="py-2 font-bold text-brutal-tinta">
                            {(criterio.peso * 100).toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {campos.length > 0 && (
                <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-6 shadow-brutal-sm">
                  <h2 className="mb-3 font-brut text-xl font-black uppercase tracking-wide text-brutal-tinta">
                    Información a completar
                  </h2>
                  <ul className="space-y-2 font-mono text-sm text-brutal-tinta/80">
                    {campos.map((campo) => (
                      <li key={campo.id} className="flex items-start justify-between gap-2">
                        <span>
                          {campo.etiqueta}
                          {campo.ayuda ? (
                            <span className="block text-xs text-brutal-tinta/50">
                              {campo.ayuda}
                            </span>
                          ) : null}
                        </span>
                        {campo.requerido ? (
                          <span className="shrink-0 rounded-brutal border-2 border-brutal-rojo bg-brutal-rojo/15 px-2 py-0.5 text-xs font-bold text-brutal-rojo">
                            Obligatorio
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-brutal border-2 border-brutal-tinta bg-brutal-tinta/10 px-2 py-0.5 text-xs font-bold text-brutal-tinta">
                            Opcional
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-6 shadow-brutal-sm">
                <h2 className="mb-3 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
                  Datos de la convocatoria
                </h2>
                <dl className="space-y-2 font-mono text-sm text-brutal-tinta/70">
                  <div className="flex justify-between">
                    <dt>Código</dt>
                    <dd className="tabular font-bold text-brutal-tinta">{codigo}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Apertura</dt>
                    <dd className="font-bold text-brutal-tinta">
                      {formatearFecha(convocatoria.fechaApertura)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Cierre</dt>
                    <dd className="font-bold text-brutal-tinta">
                      {formatearFecha(convocatoria.fechaCierre)}
                    </dd>
                  </div>
                  {convocatoria.cobertura && (
                    <div className="flex justify-between">
                      <dt>Cobertura</dt>
                      <dd className="font-bold text-brutal-tinta">
                        {ETIQUETA_COBERTURA[convocatoria.cobertura]}
                      </dd>
                    </div>
                  )}
                  {convocatoria.nivelAcademico && (
                    <div className="flex justify-between">
                      <dt>Nivel</dt>
                      <dd className="font-bold text-brutal-tinta">
                        {convocatoria.nivelAcademico.nombre}
                      </dd>
                    </div>
                  )}
                  {abierta && (
                    <div className="flex items-center justify-between gap-3 border-t-2 border-brutal-tinta/20 pt-3">
                      <dt className="font-bold uppercase text-brutal-tinta">Cierra en</dt>
                      <dd>
                        <CuentaRegresiva fecha={convocatoria.fechaCierre} />
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {docs.length > 0 && (
                <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-6 shadow-brutal-sm">
                  <h2 className="mb-3 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
                    Documentos requeridos
                  </h2>
                  <ul className="space-y-2 font-mono text-sm text-brutal-tinta/80">
                    {docs.map((doc) => (
                      <li key={doc.id} className="flex items-start justify-between gap-2">
                        <span>{doc.documentoTipo.nombre}</span>
                        <span
                          className={`shrink-0 rounded-brutal border-2 px-2 py-0.5 text-xs font-bold ${
                            doc.obligatorio
                              ? 'border-brutal-rojo bg-brutal-rojo/15 text-brutal-rojo'
                              : 'border-brutal-tinta bg-brutal-tinta/10 text-brutal-tinta'
                          }`}
                        >
                          {doc.obligatorio ? 'Obligatorio' : 'Opcional'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <BotonPostular convocatoriaId={convocatoria.id} abierta={abierta} />

              <Button href="/consulta" variant="ghost" className="w-full text-center">
                Consultar mi solicitud
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}