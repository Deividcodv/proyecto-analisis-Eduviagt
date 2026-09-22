'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registrar } from '@/lib/auth';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

const schema = z
  .object({
    cui: z
      .string()
      .regex(/^\d{13}$/, 'El CUI debe tener exactamente 13 dígitos'),
    nombres: z.string().min(2, 'Ingresa tus nombres completos'),
    email: z.string().email('El correo electrónico no es válido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegistroPage() {
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
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
      await registrar({
        cui: values.cui,
        nombres: values.nombres,
        email: values.email,
        password: values.password,
      });
      setExito(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar el registro');
    } finally {
      setEnviando(false);
    }
  };

  if (exito) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-4xl">✓</div>
          <h1 className="mb-2 text-2xl font-bold text-sigeb-blue-dark">
            ¡Cuenta creada!
          </h1>
          <p className="mb-6 text-gray-600">
            Tu registro fue exitoso. Ahora puedes iniciar sesión para comenzar a
            postularte.
          </p>
          <Button href="/login" className="w-full">
            Iniciar sesión
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-sigeb-blue-dark">
          Crear una cuenta
        </h1>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="CUI"
            placeholder="1234567890123"
            maxLength={13}
            inputMode="numeric"
            {...register('cui')}
            error={errors.cui?.message}
          />
          <Input
            label="Nombres completos"
            placeholder="Juan Pérez"
            autoComplete="name"
            {...register('nombres')}
            error={errors.nombres?.message}
          />
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
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" disabled={enviando} className="w-full">
            {enviando ? <Spinner /> : 'Registrarse'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-sigeb-blue hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </Container>
  );
}
