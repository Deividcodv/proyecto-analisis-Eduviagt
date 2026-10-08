'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { rutaPorRol } from '@/lib/rol';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

const schema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setEnviando(true);
    try {
      const usuario = await login(values.email, values.password);
      router.replace(rutaPorRol(usuario.rol));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-8 shadow-brutal">
        <p className="brut-label mb-2 inline-block rounded-brutal border-2 border-brutal-tinta bg-brutal-cyan px-3 py-1 text-xs font-bold text-brutal-tinta">
          Acceso seguro
        </p>
        <h1 className="mb-6 font-brut text-2xl font-black uppercase tracking-wide text-brutal-tinta">
          Iniciar sesión
        </h1>
        {error && (
          <div className="mb-4 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 px-4 py-3 text-sm font-bold text-brutal-rojo">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Button type="submit" disabled={enviando} className="w-full">
            {enviando ? <Spinner /> : 'Ingresar'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-brutal-tinta/70">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-brut font-bold text-brutal-cyan hover:bg-brutal-cyan">
            Regístrate
          </Link>
        </p>
      </div>
    </Container>
  );
}
