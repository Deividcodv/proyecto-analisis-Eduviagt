import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Panel del evaluador: dos colas ("Por evaluar" y "Ya evaluadas"), ventana
 * de detalle con la información completa de la postulación (incluidos los
 * documentos que el postulante adjuntó) y el cierre de la evaluación.
 *
 * El flujo se monta por API porque requiere evaluadores, documentos y
 * formularios; lo que se comprueba con el navegador es el efecto en la
 * interfaz.
 */
const API = `http://localhost:${process.env.E2E_API_PORT ?? '3000'}/api`;
const CLAVE = 'Admin123!';

async function login(request: APIRequestContext, email: string): Promise<string> {
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
  return request[method](`${API}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    ...(data !== undefined ? { data } : {}),
  });
}

async function entrarComoEvaluador(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('evaluador@demo.gt');
  await page.getByLabel('Contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

/** Deja una solicitud en revisión con el evaluador@demo.gt asignado. */
async function solicitudEnRevision(
  request: APIRequestContext,
): Promise<{ id: string; evaluador: string }> {
  const admin = await login(request, 'admin@sigeb.gov.gt');
  const solicitudes = (
    (await (await request.get(`${API}/solicitudes`, { headers: { authorization: `Bearer ${admin}` } })).json())
  ).data as Array<{
    id: string;
    estado: string;
    convocatoria?: { evaluadorPorDefectoId?: string | null };
  }>;
  // Una convocatoria con evaluador por defecto (al iniciar la revisión se
  // le asigna sola) y con documentos ya cargados.
  let enviada: (typeof solicitudes)[number] | undefined;
  for (const s of solicitudes.filter(
    (x) => x.estado === 'ENVIADA' && x.convocatoria?.evaluadorPorDefectoId,
  )) {
    const chk = (
      (await (
        await request.get(`${API}/solicitudes/${s.id}/checklist`, {
          headers: { authorization: `Bearer ${admin}` },
        })
      ).json())
    ).data as { documentos?: Array<{ cargado: boolean }> };
    if ((chk.documentos ?? []).some((d) => d.cargado)) {
      enviada = s;
      break;
    }
  }
  expect(enviada, 'debe haber una solicitud ENVIADA con documentos').toBeTruthy();

  const inicio = await api(request, 'post', `/solicitudes/${enviada!.id}/transicion`, admin, {
    accion: 'iniciar_revision',
  });
  expect(inicio.ok(), 'iniciar revisión').toBeTruthy();

  const evaluador = await login(request, 'evaluador@demo.gt');
  const mias = (
    (await (await request.get(`${API}/evaluaciones/mias`, { headers: { authorization: `Bearer ${evaluador}` } })).json())
  ).data as Array<{ solicitudId: string }>;
  const asignada = mias.find((m) => m.solicitudId === enviada!.id);
  expect(asignada, 'el evaluador por defecto debe quedar asignado').toBeTruthy();

  return { id: enviada!.id, evaluador };
}

test.describe('Panel del evaluador', () => {
  test('muestra dos colas: por evaluar y ya evaluadas', async ({ page }) => {
    await entrarComoEvaluador(page);
    await page.goto('/evaluador');

    await expect(page.getByTestId('cola-por-evaluar')).toBeVisible();
    await expect(page.getByTestId('cola-evaluadas')).toBeVisible();
  });

  test('la ventana de detalle muestra la postulación y sus documentos', async ({
    page,
    request,
  }) => {
    const { id } = await solicitudEnRevision(request);
    await entrarComoEvaluador(page);
    await page.goto('/evaluador');

    await page.locator(`[data-solicitud-id="${id}"]`).getByRole('button', { name: /Abrir detalle/i }).click();

    const ventana = page.getByRole('dialog');
    await expect(ventana).toBeVisible();
    // La postulación: identificación del postulante y de la convocatoria.
    await expect(ventana.getByText(/CUI/i)).toBeVisible();
    // Los documentos que el postulante adjuntó, con su descarga.
    await expect(ventana.getByRole('heading', { name: /Documentos/i })).toBeVisible();
    await expect(ventana.getByRole('button', { name: /Descargar/i }).first()).toBeVisible();
  });

  test('al confirmar la imparcialidad el formulario se habilita al instante', async ({
    page,
    request,
  }) => {
    const { id } = await solicitudEnRevision(request);

    await entrarComoEvaluador(page);
    await page.goto('/evaluador');

    await page
      .locator(`[data-solicitud-id="${id}"]`)
      .getByRole('button', { name: /Abrir detalle/i })
      .click();

    const ventana = page.getByRole('dialog');
    await expect(ventana).toBeVisible();

    // Antes de confirmar, guardar está bloqueado.
    const guardar = ventana.getByRole('button', { name: 'Guardar' }).first();
    await expect(guardar).toBeDisabled();

    await ventana.getByRole('button', { name: /Confirmar imparcialidad/i }).click();

    // Y se habilita sin cerrar y volver a abrir el detalle.
    await expect(guardar).toBeEnabled();
  });

  test('al terminar la evaluación la solicitud sale de la cola de pendientes', async ({
    page,
    request,
  }) => {
    const { id, evaluador } = await solicitudEnRevision(request);

    // El evaluador declara su imparcialidad y califica todos los criterios.
    await api(request, 'patch', `/solicitudes/${id}/imparcialidad`, evaluador, {
      confirma: true,
    });
    const mias = (
      (await (await request.get(`${API}/evaluaciones/mias`, { headers: { authorization: `Bearer ${evaluador}` } })).json())
    ).data as Array<{
      solicitudId: string;
      criterios: Array<{ id: string }>;
    }>;
    const grupo = mias.find((m) => m.solicitudId === id);
    for (const criterio of grupo?.criterios ?? []) {
      await api(request, 'put', `/solicitudes/${id}/criterios/${criterio.id}`, evaluador, {
        puntaje: 88,
        observaciones: 'Perfil académico sólido',
      });
    }

    await entrarComoEvaluador(page);
    await page.goto('/evaluador');

    const pendiente = page.locator(`[data-testid="cola-por-evaluar"] [data-solicitud-id="${id}"]`);
    const terminada = page.locator(`[data-testid="cola-evaluadas"] [data-solicitud-id="${id}"]`);
    await expect(pendiente).toHaveCount(0);
    await expect(terminada).toHaveCount(1);
    // Y se muestra como evaluada, no como "en revisión".
    await expect(terminada.getByText('Evaluada').first()).toBeVisible();
  });

  test('al calificar el último criterio la evaluación queda cerrada sola', async ({
    page,
    request,
  }) => {
    const { id, evaluador } = await solicitudEnRevision(request);

    await api(request, 'patch', `/solicitudes/${id}/imparcialidad`, evaluador, {
      confirma: true,
    });
    const mias = (
      (await (await request.get(`${API}/evaluaciones/mias`, { headers: { authorization: `Bearer ${evaluador}` } })).json())
    ).data as Array<{
      solicitudId: string;
      criterios: Array<{ id: string }>;
    }>;
    const grupo = mias.find((m) => m.solicitudId === id);

    // Se califica el último criterio: no hace falta pulsar "Finalizar
    // evaluación" para que la evaluación quede cerrada.
    const criterios = grupo?.criterios ?? [];
    for (const [i, criterio] of criterios.entries()) {
      const res = await api(
        request,
        'put',
        `/solicitudes/${id}/criterios/${criterio.id}`,
        evaluador,
        { puntaje: 88, observaciones: 'Perfil académico sólido' },
      );
      expect(res.ok(), `puntaje del criterio ${i + 1}`).toBeTruthy();
    }

    await entrarComoEvaluador(page);
    await page.goto('/evaluador');

    const pendiente = page.locator(`[data-testid="cola-por-evaluar"] [data-solicitud-id="${id}"]`);
    const terminada = page.locator(`[data-testid="cola-evaluadas"] [data-solicitud-id="${id}"]`);
    await expect(pendiente).toHaveCount(0);
    await expect(terminada).toHaveCount(1);
    await expect(terminada.getByText('Evaluada').first()).toBeVisible();
  });
});
