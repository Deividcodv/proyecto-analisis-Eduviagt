import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Segunda aprobación por monto (Sprint 8 - US-802/803) y perfil por rol.
 *
 * El flujo se Monta por API porque requiere evaluadores, documentos y
 * formularios; lo que se comprueba con el navegador es el efecto final en la
 * interfaz.
 */
const API = `http://localhost:${process.env.E2E_API_PORT ?? '3000'}/api`;
/** Beca del seed que tiene criterios de evaluación. */
const BECA_CON_CRITERIOS = '00000000-0000-4000-8000-000000000002';
const CLAVE = 'Admin123!';

async function login(
  request: APIRequestContext,
  email: string,
): Promise<string> {
  const res = await request.post(`${API}/auth/login`, {
    data: { email, password: CLAVE },
  });
  expect(res.ok(), `login de ${email}`).toBeTruthy();
  return ((await res.json()).data as { accessToken: string }).accessToken;
}

async function api(
  request: APIRequestContext,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  token: string,
  data?: unknown,
) {
  const res = await request[method](`${API}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    ...(data !== undefined ? { data } : {}),
  });
  return res;
}

test.describe('Segunda aprobación por monto', () => {
  test('una postulación sobre Q10,000 exige la firma de otra persona', async ({
    request,
    page,
  }) => {
    // 0. Se crea una convocatoria propia sobre Q10,000 (la que exige
    //    segunda firma por monto): así la prueba no depende de los datos
    //    que dejó una corrida anterior.
    const admin = await login(request, 'admin@sigeb.gov.gt');
    const creadaConv = await api(request, 'post', '/convocatorias', admin, {
      nombre: `Convocatoria E2E 2ª firma ${Date.now()}`,
      becaId: BECA_CON_CRITERIOS,
      montoBase: 12000,
      evaluadoresMinimos: 2,
      fechaApertura: new Date(Date.now() - 86_400_000).toISOString(),
      fechaCierre: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    });
    expect(creadaConv.ok(), `crear la convocatoria: ${await creadaConv.text()}`).toBeTruthy();
    const convocatoria = (await creadaConv.json()).data as { id: string; nombre: string };
    const publicar = await api(
      request,
      'post',
      `/convocatorias/${convocatoria.id}/transicion`,
      admin,
      { accion: 'publicar' },
    );
    expect(publicar.ok(), 'publicar la convocatoria').toBeTruthy();

    // 1. El postulante presenta su solicitud a esa convocatoria (es nueva,
    //    así que no tiene ninguna postulación previa).
    const postulante = await login(request, 'postulante@demo.gt');

    const solicitudId = ((await (
      await api(request, 'post', '/solicitudes', postulante, {
        convocatoriaId: convocatoria!.id,
      })
    ).json()).data as { id: string }).id;
    expect(solicitudId).toBeTruthy();

    // 2. Se completa el expediente: perfiles, documentos y formulario.
    const niveles = (
      await (await request.get(`${API}/catalogos/niveles-academicos`)).json()
    ).data as Array<{ id: string; nombre: string }>;
    const generos = (
      await (await request.get(`${API}/catalogos/generos`)).json()
    ).data as Array<{ id: string; nombre: string }>;

    await api(request, 'put', `/solicitudes/${solicitudId}/perfil-academico`, postulante, {
      generoId: generos[0].id,
      nivelAcademicoId: niveles.find((n) => n.nombre === 'Universitario')!.id,
      institucion: 'Universidad de San Carlos de Guatemala',
      carrera: 'Ingeniería en Sistemas',
      promedio: 93,
    });
    await api(request, 'put', `/solicitudes/${solicitudId}/perfil-financiero`, postulante, {
      ingresoFamiliar: 2500,
      numeroDependientes: 3,
    });

    const detalle = (
      await (
        await request.get(`${API}/convocatorias/${convocatoria!.id}`)
      ).json()
    ).data as {
      documentosRequeridos: Array<{ documentoTipoId: string; obligatorio: boolean }>;
      formulario: Array<{ id: string; seccion: string; tipo: string; requerido: boolean; opciones?: string[] }>;
    };
    for (const doc of (detalle.documentosRequeridos ?? []).filter((d) => d.obligatorio)) {
      await request.post(
        `${API}/solicitudes/${solicitudId}/documentos/${doc.documentoTipoId}`,
        {
          headers: { authorization: `Bearer ${postulante}` },
          multipart: {
            file: {
              name: 'certificado.pdf',
              mimeType: 'application/pdf',
              buffer: Buffer.from('%PDF-1.4 prueba'),
            },
          },
        },
      );
    }
    const secciones: Record<string, Record<string, unknown>> = {};
    for (const campo of (detalle.formulario ?? []).filter((c) => c.requerido)) {
      const valor =
        campo.tipo === 'numero'
          ? 90
          : campo.tipo === 'booleano'
            ? true
            : campo.tipo === 'seleccion'
              ? (campo.opciones ?? ['Si'])[0]
              : 'Contenido de prueba';
      (secciones[campo.seccion] ||= {})[campo.id] = valor;
    }
    for (const [seccion, valores] of Object.entries(secciones)) {
      await api(request, 'put', `/solicitudes/${solicitudId}/respuestas`, postulante, {
        seccion,
        valores,
      });
    }

    // 3. Se envía y el comité la revisa hasta evaluarla.
    await api(request, 'post', `/solicitudes/${solicitudId}/transicion`, postulante, {
      accion: 'enviar',
    });
    await api(request, 'post', `/solicitudes/${solicitudId}/transicion`, admin, {
      accion: 'iniciar_revision',
    });

    // Solo evaluadores activos: un evaluador dado de baja no puede iniciar
    // sesión ni evaluar.
    const evaluadores = (
      await (
        await request.get(`${API}/seguridad/personal?rol=EVALUADOR`, {
          headers: { authorization: `Bearer ${admin}` },
        })
      ).json()
    ).data as Array<{ id: string; email: string }>;
    expect(evaluadores.length).toBeGreaterThanOrEqual(3);
    await api(request, 'post', `/solicitudes/${solicitudId}/evaluadores`, admin, {
      evaluadorIds: evaluadores.slice(0, 3).map((e) => e.id),
    });

    for (const evaluador of evaluadores.slice(0, 3)) {
      const tokenEvaluador = await login(request, evaluador.email);
      await api(request, 'patch', `/solicitudes/${solicitudId}/imparcialidad`, tokenEvaluador, {
        confirma: true,
      });
      const mias = (
        await (
          await request.get(`${API}/evaluaciones/mias`, {
            headers: { authorization: `Bearer ${tokenEvaluador}` },
          })
        ).json()
      ).data as Array<{
        solicitudId: string;
        criterios: Array<{ id: string }>;
      }>;
      const grupo = mias.find((g) => g.solicitudId === solicitudId);
      for (const criterio of grupo?.criterios ?? []) {
        await api(
          request,
          'put',
          `/solicitudes/${solicitudId}/criterios/${criterio.id}`,
          tokenEvaluador,
          { puntaje: 90 },
        );
      }
    }

    await api(request, 'post', `/solicitudes/${solicitudId}/transicion`, admin, {
      accion: 'evaluar',
    });

    const evaluada = (
      await (
        await request.get(`${API}/solicitudes/${solicitudId}`, {
          headers: { authorization: `Bearer ${admin}` },
        })
      ).json()
    ).data as { estado: string; montoOtorgable?: string };
    expect(Number(evaluada.montoOtorgable)).toBeGreaterThan(10000);

    // 4. La primera aprobación deja la solicitud pendiente de una segunda.
    const primera = await api(
      request,
      'post',
      `/solicitudes/${solicitudId}/transicion`,
      admin,
      { accion: 'aprobar' },
    );
    expect(primera.ok(), 'la primera aprobación debe aceptarse').toBeTruthy();

    const pendiente = (
      await (
        await request.get(`${API}/solicitudes/${solicitudId}`, {
          headers: { authorization: `Bearer ${admin}` },
        })
      ).json()
    ).data as { estado: string };
    expect(pendiente.estado).toBe('PENDIENTE_SEGUNDA_APROBACION');

    // 5. La misma persona no puede firmar la segunda.
    const misma = await api(
      request,
      'post',
      `/solicitudes/${solicitudId}/transicion`,
      admin,
      { accion: 'aprobar_segunda' },
    );
    expect(misma.status(), 'la 2ª firma debe rechazarse').toBe(403);

    // 6. Otra persona sí puede.
    const jefe = await login(request, 'jefebecas@demo.gt');
    const segunda = await api(
      request,
      'post',
      `/solicitudes/${solicitudId}/transicion`,
      jefe,
      { accion: 'aprobar_segunda' },
    );
    expect(segunda.ok(), 'otra persona debe poder firmar la 2ª').toBeTruthy();

    const final = (
      await (
        await request.get(`${API}/solicitudes/${solicitudId}`, {
          headers: { authorization: `Bearer ${admin}` },
        })
      ).json()
    ).data as { estado: string };
    expect(final.estado).toBe('APROBADA');

    // 7. Y el postulante fue notificado.
    const notificaciones = (
      await (
        await request.get(`${API}/notificaciones`, {
          headers: { authorization: `Bearer ${postulante}` },
        })
      ).json()
    ).data as { items: Array<{ tipo: string; cuerpo: string }> };
    const tipos = notificaciones.items.map((n) => n.tipo);
    expect(tipos).toContain('SOLICITUD_ENVIADA_CONFIRMACION');
    expect(tipos).toContain('SOLICITUD_SEGUNDA_APROBACION');
    expect(tipos).toContain('SOLICITUD_APROBADA');

    // 8. La interfaz muestra el estado final.
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('postulante@demo.gt');
    await page.getByLabel('Contraseña').fill(CLAVE);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    // Se espera a que la sesión quede iniciada: si se navega antes, la
    // página de la postulación devuelve al login.
    await expect(page).not.toHaveURL(/\/login$/);
    await page.goto(`/solicitudes/${solicitudId}`);
    await expect(
      page.getByText('Aprobada').first(),
      'la postulación debe verse aprobada',
    ).toBeVisible({ timeout: 20000 });
  });
});

test.describe('Perfil para todos los roles', () => {
  const ROLES = [
    { email: 'admin@sigeb.gov.gt', nombre: 'Admin' },
    { email: 'evaluador@demo.gt', nombre: 'Evaluador' },
    { email: 'coordinador@demo.gt', nombre: 'Coordinador' },
    { email: 'miembro@demo.gt', nombre: 'Miembro' },
  ];

  for (const rol of ROLES) {
    test(`${rol.nombre} puede editar su nombre desde su perfil`, async ({
      page,
    }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(rol.email);
      await page.getByLabel('Contraseña').fill(CLAVE);
      await page.getByRole('button', { name: 'Ingresar' }).click();
      // Se espera a que el envío termine: si no, la navegación a /perfil
      // compite con la redirección al panel del rol.
      await expect(page).not.toHaveURL(/\/login$/);

      await page.goto('/perfil');
      await expect(
        page.getByRole('heading', { name: 'Datos de la cuenta' }),
      ).toBeVisible();

      const campo = page.getByLabel('Nombres completos');
      await expect(campo).toBeVisible();
      await campo.fill(`Nombre Prueba ${rol.nombre}`);
      await page.getByRole('button', { name: 'Guardar cambios' }).click();
      await expect(page.getByText('Datos guardados correctamente.')).toBeVisible();
    });
  }

  test('el menú del equipo incluye el enlace a Mi perfil', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('evaluador@demo.gt');
    await page.getByLabel('Contraseña').fill(CLAVE);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).not.toHaveURL(/\/login$/);

    await page.getByRole('button', { name: 'Abrir menú de navegación' }).click();
    await expect(
      page.getByRole('link', { name: 'Mi perfil' }),
    ).toBeVisible();
  });
});
