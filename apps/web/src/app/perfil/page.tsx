'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { httpData } from '@/lib/api';
import { fetchConToken } from '@/lib/api-auth';
import { useAuth } from '@/context/AuthContext';
import { rutaPorRol } from '@/lib/rol';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';

interface Perfil {
  id: string;
  cui: string;
  nombres: string;
  email: string;
  telefono: string | null;
  fechaNacimiento: string | null;
  direccion: string | null;
  genero: { id: string; nombre: string } | null;
  departamento: { id: string; nombre: string } | null;
  municipio: { id: string; nombre: string } | null;
  rol: { id: string; nombre: string };
}

interface Catalogo {
  id: string;
  nombre: string;
}

export default function PerfilPage() {
  return (
    <ProtectedRoute>
      <PerfilContent />
    </ProtectedRoute>
  );
}

function PerfilContent() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [generos, setGeneros] = useState<Catalogo[]>([]);
  const [departamentos, setDepartamentos] = useState<Catalogo[]>([]);
  const [municipios, setMunicipios] = useState<Catalogo[]>([]);

  const [nombres, setNombres] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [generoId, setGeneroId] = useState('');
  const [departamentoId, setDepartamentoId] = useState('');
  const [municipioId, setMunicipioId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarMunicipios = useCallback(async (deptoId: string) => {
    const data = await httpData<Catalogo[]>(
      `/catalogos/municipios?departamentoId=${deptoId}`,
    );
    setMunicipios(data);
  }, []);

  useEffect(() => {
    let activo = true;
    const init = async () => {
      try {
        const [datosPerfil, gen, deptos] = await Promise.all([
          httpData<Perfil>('/auth/perfil', { token: getToken() }),
          httpData<Catalogo[]>('/catalogos/generos'),
          httpData<Catalogo[]>('/catalogos/departamentos'),
        ]);
        if (!activo) return;
        setPerfil(datosPerfil);
        setGeneros(gen);
        setDepartamentos(deptos);
        setNombres(datosPerfil.nombres);
        setTelefono(datosPerfil.telefono ?? '');
        setFechaNacimiento(datosPerfil.fechaNacimiento?.slice(0, 10) ?? '');
        setDireccion(datosPerfil.direccion ?? '');
        setGeneroId(datosPerfil.genero?.id ?? '');
        setDepartamentoId(datosPerfil.departamento?.id ?? '');
        setMunicipioId(datosPerfil.municipio?.id ?? '');
        if (datosPerfil.departamento?.id) {
          await cargarMunicipios(datosPerfil.departamento.id);
        }
      } catch (e) {
        if (activo) {
          setError(e instanceof Error ? e.message : 'No se pudieron cargar tus datos');
        }
      } finally {
        if (activo) setCargando(false);
      }
    };
    void init();
    return () => {
      activo = false;
    };
  }, [cargarMunicipios]);

  const cambiarDepartamento = async (deptoId: string) => {
    setDepartamentoId(deptoId);
    setMunicipioId('');
    if (deptoId) {
      try {
        await cargarMunicipios(deptoId);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudieron cargar los municipios');
      }
    } else {
      setMunicipios([]);
    }
  };

  const guardar = async () => {
    if (!perfil) return;
    setGuardando(true);
    setError(null);
    setExito(null);
    try {
      const datos = await fetchConToken<Perfil>('/auth/perfil', {
        method: 'PATCH',
        body: {
          nombres,
          telefono: telefono || undefined,
          fechaNacimiento: fechaNacimiento || undefined,
          direccion: direccion || undefined,
          generoId: generoId || undefined,
          departamentoId: departamentoId || undefined,
          municipioId: municipioId || undefined,
        },
      });
      setPerfil(datos);
      setNombres(datos.nombres);
      setTelefono(datos.telefono ?? '');
      setFechaNacimiento(datos.fechaNacimiento?.slice(0, 10) ?? '');
      setDireccion(datos.direccion ?? '');
      setGeneroId(datos.genero?.id ?? '');
      setDepartamentoId(datos.departamento?.id ?? '');
      setMunicipioId(datos.municipio?.id ?? '');
      setExito('Datos guardados correctamente.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar tus datos');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <InternalPageHeader
        title="Mis datos"
        subtitle="Completa y actualiza tu información personal. Estos datos acompañan tus solicitudes de beca."
      />

      <Container className="py-8">
        {error && (
          <p className="mb-4 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">{error}</p>
        )}
        {exito && (
          <p className="mb-4 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-lima/30 p-4 text-sm font-bold text-brutal-tinta">{exito}</p>
        )}

        <Card className="max-w-3xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-brut text-xl font-black uppercase tracking-wide text-brutal-tinta">
                Información personal
              </h2>
              <p className="font-mono text-xs text-brutal-tinta/60">
                CUI {perfil?.cui} · {perfil?.rol.nombre}
              </p>
            </div>
            <span className="brut-label rounded-brutal border-2 border-brutal-tinta bg-brutal-cyan px-3 py-1 text-xs font-bold text-brutal-tinta">
              {perfil?.email}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Nombres completos"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
              />
            </div>
            <Input
              label="Teléfono"
              placeholder="+502 5555 1234"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
            <Input
              label="Fecha de nacimiento"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
            />
            <Select
              label="Género"
              value={generoId}
              onChange={(e) => setGeneroId(e.target.value)}
              options={generos.map((g) => ({ value: g.id, label: g.nombre }))}
              placeholder="Seleccionar género"
            />
            <Select
              label="Departamento"
              value={departamentoId}
              onChange={(e) => cambiarDepartamento(e.target.value)}
              options={departamentos.map((d) => ({ value: d.id, label: d.nombre }))}
              placeholder="Seleccionar departamento"
            />
            <div className="md:col-span-2">
              <Select
                label="Municipio"
                value={municipioId}
                onChange={(e) => setMunicipioId(e.target.value)}
                options={municipios.map((m) => ({ value: m.id, label: m.nombre }))}
                placeholder={
                  departamentoId
                    ? 'Seleccionar municipio'
                    : 'Primero selecciona un departamento'
                }
                disabled={!departamentoId}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Dirección"
                placeholder="Calle, zona, ciudad"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? <Spinner /> : 'Guardar cambios'}
            </Button>
            <Button variant="ghost" onClick={() => router.push(rutaPorRol(perfil?.rol.nombre ?? ''))}>
              Volver a mi panel
            </Button>
          </div>
        </Card>
      </Container>
    </>
  );
}