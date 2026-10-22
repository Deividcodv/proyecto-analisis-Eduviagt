# README — Colaboradores Sprint 2 (Portal Público)

Guía paso a paso para Héctor, José, Yemerson y Hamilton. Contiene los comandos y
los cambios de código exactos que deben hacer cada uno, con base en la fuente
`986fc89` (remote `sigeb-prod`) y `develop` del repo de trabajo
`proyecto-analisis-Sigeb`.

---

## §0 Precondiciones comunes (todos)

Si el remote `sigeb-prod` no existe aún en tu clon (cuando no lo configuraste en S1):

```bash
cd /c/proyectos/proyecto-analisis-Sigeb
git remote add sigeb-prod https://github.com/Deividcodv/sigeb-prod.git
git fetch sigeb-prod
```

Antes de **crear tu rama**, siempre:

```bash
git checkout develop
git pull origin develop
```

### Reglas de oro

- La PR va con base **`develop`**, título y commit **convencionales**, CI **verde**.
- Tu PR debe contener **solo tus archivos** (tu módulo + tu línea de import en `app.module.ts`).
- **NO** copies imports/archivos de otros módulos: cada integración la hace su dueño.
- **NO** pongas el `app.module.ts` de `986fc89` tal cual: importa módulos que todavía NO existen
  en `develop` (Evaluaciones, Comités, Sesiones, Reportes, Audit, Asistente) y rompería la CI.
- El `app.module.ts` en `develop` quedó **reducido** (base S1) tras el chore de David.

---

## §1 HÉCTOR — Backend convocatorias públicas (US-44 y US-45)

Entregable: módulo `apps/api/src/convocatorias/` completo desde `986fc89`
(**GET /convocatorias** con `?busqueda=` y **GET /convocatorias/:id** públicos).

```bash
git fetch sigeb-prod
git checkout develop && git pull origin develop
git checkout -b feature/convocatorias-publicas

git checkout 986fc89 -- apps/api/src/convocatorias

git status                       # deben salir SOLO apps/api/src/convocatorias + app.module.ts
git add apps/api/src/convocatorias apps/api/src/app.module.ts
git commit -m "feat(convocatorias): endpoints publicos con busqueda y detalle (US-44/45)"
git push -u origin feature/convocatorias-publicas
```

### Código a agregar en `apps/api/src/app.module.ts`

Ver el archivo completo de destino en el final de esta sección o aplica solo estas
**2 líneas marcadas como "HÉCTOR"**:

```ts
import { ConvocatoriasModule } from './convocatorias/convocatorias.module'; // IMPORT HÉCTOR
//  ...
ConvocatoriasModule,   // MÓDULO HÉCTOR (dentro de imports[])
```

### Abrir la PR

```bash
gh pr create --base develop --title "feat(convocatorias): S2" --body "módulo convocatorias desde 986fc89 (US-44/45); solo convocatorias/ + 1 import en app.module; CI verde"
```

### Verificación antes de avisar a David

```bash
git diff 986fc89 -- apps/api/src/convocatorias   # debe quedar VACÍO
git log --oneline -3
```

---

## §2 JOSÉ — Backend consulta pública (US-46, módulo completo)

Entregable: módulo `apps/api/src/solicitudes/` **completo** desde `986fc89`
(incluye la consulta pública **GET /solicitudes/consulta/:codigo** + 2 tests).

> Nota: la fuente trae el módulo completo (controller con 11 endpoints, máquina de
> estados, service, DTOs). En S2 se entrega **todo** para mantener la fidelidad con
> `986fc89` (`git diff` vacío). El saldo funcional del módulo se completa en S6.

```bash
git fetch sigeb-prod
git checkout develop && git pull origin develop
git checkout -b feature/consulta-publica

git checkout 986fc89 -- apps/api/src/solicitudes

git status                       # solo apps/api/src/solicitudes + app.module.ts
git add apps/api/src/solicitudes apps/api/src/app.module.ts
git commit -m "feat(solicitudes): modulo completo con consulta publica por codigo (US-46)"
git push -u origin feature/consulta-publica
```

### Código a agregar en `apps/api/src/app.module.ts`

Solo estas **2 líneas marcadas como "JOSÉ"**:

```ts
import { SolicitudesModule } from './solicitudes/solicitudes.module'; // IMPORT JOSÉ
//  ...
SolicitudesModule,   // MÓDULO JOSÉ (dentro de imports[])
```

### Abrir la PR

```bash
gh pr create --base develop --title "feat(solicitudes): S2" --body "módulo solicitudes completo desde 986fc89; endpoint público US-46 + 2 tests (solicitudes.service.spec.ts, solicitud-state-machine.spec.ts); CI verde"
```

### Verificación

```bash
git diff 986fc89 -- apps/api/src/solicitudes   # debe quedar VACÍO
```

---

## §3 YEMERSON — Frontend portal público (US-40..48)

Entregable: **todo** `apps/web/src` desde `986fc89` (layout/design system de
`ab66393` ya integrado + home, convocatorias con filtros, detalle, consulta,
nosotros y footer). **Sin** panel admin ni login.

```bash
git fetch sigeb-prod
git checkout develop && git pull origin develop
git checkout -b feature/portal-publico

git checkout 986fc89 -- apps/web/src

git status                       # solo apps/web/src
git add apps/web/src
git commit -m "feat(portal): portal publico con layout, convocatorias y consulta (US-40..48)"
git push -u origin feature/portal-publico
```

### Abrir la PR

```bash
gh pr create --base develop --title "feat(portal): S2" --body "apps/web/src desde 986fc89 (layout base ab66393 integrado); nav home -> convocatorias -> detalle -> consulta; tests: no aplica (presentación); CI verde"
```

### Verificación

```bash
git diff 986fc89 -- apps/web/src   # debe quedar VACÍO
```

---

## §4 HAMILTON — Documentación scrum (S1→S2→S3)

Entregable: solo **`doc/scrum/`** (NO toca `apps/*`). Alinear (no crear desde cero) lo
que ya está commiteado en `develop` (commit `116b153`):

- `doc/scrum/recreacion-sprint-1-cimientos/*` → fechas, participantes y puntos reales.
- `doc/scrum/recreacion-sprint-2-portal-publico/{goal,backlog,daily-log,review,retrospective}.md`
  → puntos 40/40; convocatorias US-44/45; solicitudes **entregada completa** (US-46).
- `doc/scrum/recreacion-sprint-3-login-dashboard/` → planning S3 (US-49/50).

```bash
git checkout develop && git pull origin develop
git checkout -b docs/scrum-s2

# alinear/editar los .md de doc/scrum/ (sin apps/*)

git add doc/scrum/
git commit -m "docs(scrum): alinear artefactos S1-S2 y planning S3"
git push -u origin docs/scrum-s2
gh pr create --base develop --title "docs(scrum): S2" --body "solo doc/scrum/"
```

Tu PR no toca `apps/*`, así que no choca con nadie: puede mergearse en cualquier momento.

---

## §5 DAVID — Orden de merge y aprobación

Orden fijo: **David (chore, ya en develop) → Héctor → José → Yemerson → Hamilton**.
Héctor y José mergean en ese orden para que `app.module.ts` compile en cada paso
(ambos agregan líneas distintas, sin conflicto).

Por cada PR:

```bash
git checkout develop && git pull origin develop
gh pr list
gh pr checkout <NUM_PR>
npm run lint && npm run test
gh pr review <NUM_PR> --approve
gh pr merge <NUM_PR> --squash --delete-branch
```

Verificación de fidelidad al cierre (diferencias que deben quedar **vacías** contra `986fc89`):

```bash
git diff 986fc89 -- apps/web/src
git diff 986fc89 -- apps/api/src/convocatorias
git diff 986fc89 -- apps/api/src/solicitudes
git diff 986fc89 -- apps/api/src/app.module.ts
```

---

## §6 Apéndice A — `app.module.ts` versión final S2 (referencia)

Estado objetivo de `apps/api/src/app.module.ts` al cierre del S2. Héctor aplica solo
lo marcado "HÉCTOR"; José solo lo marcado "JOSÉ"; el resto ya está en `develop`.

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StorageModule } from './storage/storage.module';
import { CatalogosModule } from './catalogos/catalogos.module';
// -*- IMPORT DE HÉCTOR (US-44/45) -*-
import { ConvocatoriasModule } from './convocatorias/convocatorias.module';
// -*- IMPORT DE JOSÉ (US-46) -*-
import { SolicitudesModule } from './solicitudes/solicitudes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CommonModule,
    StorageModule,
    AuthModule,
    UsersModule,
    CatalogosModule,
    // -*- MÓDULO DE HÉCTOR -*-
    ConvocatoriasModule,
    // -*- MÓDULO DE JOSÉ -*-
    SolicitudesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

---

## §7 Apéndice B — `seed.ts` versión S2 (referencia)

El seed de S2 ya quedó en `develop` con el chore de David. Es el seed de S1 + el bloque
**"DEMO PORTAL PÚBLICO S2 (US-46)"** de David. Se incluye completo como referencia y
para registro en los artefactos.

```ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ==========================================
  // ROLES
  // ==========================================
  const roles = await Promise.all([
    prisma.rol.upsert({
      where: { nombre: 'ADMIN' },
      update: {},
      create: {
        nombre: 'ADMIN',
        descripcion: 'Administrador del sistema con acceso total',
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'POSTULANTE' },
      update: {},
      create: {
        nombre: 'POSTULANTE',
        descripcion: 'Estudiante que postula a becas',
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'EVALUADOR' },
      update: {},
      create: {
        nombre: 'EVALUADOR',
        descripcion: 'Persona que evalúa solicitudes',
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'COORDINADOR_COMITE' },
      update: {},
      create: {
        nombre: 'COORDINADOR_COMITE',
        descripcion: 'Coordina comités evaluadores y sesiones',
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'MIEMBRO_COMITE' },
      update: {},
      create: {
        nombre: 'MIEMBRO_COMITE',
        descripcion: 'Miembro de un comité evaluador',
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'STAFF' },
      update: {},
      create: {
        nombre: 'STAFF',
        descripcion: 'Personal administrativo del MINEDUC',
      },
    }),
  ]);
  console.log('✅ Roles creados');

  // ==========================================
  // PERMISOS
  // ==========================================
  const permisosData = [
    // Convocatorias
    { modulo: 'convocatoria', accion: 'crear' },
    { modulo: 'convocatoria', accion: 'editar' },
    { modulo: 'convocatoria', accion: 'ver' },
    // Solicitudes
    { modulo: 'solicitud', accion: 'crear' },
    { modulo: 'solicitud', accion: 'editar' },
    { modulo: 'solicitud', accion: 'ver' },
    // Documentos
    { modulo: 'documento', accion: 'crear' },
    { modulo: 'documento', accion: 'ver' },
    { modulo: 'documento', accion: 'eliminar' },
    // Evaluaciones
    { modulo: 'evaluacion', accion: 'crear' },
    { modulo: 'evaluacion', accion: 'editar' },
    { modulo: 'evaluacion', accion: 'ver' },
    // Comités
    { modulo: 'comite', accion: 'crear' },
    { modulo: 'comite', accion: 'editar' },
    { modulo: 'comite', accion: 'ver' },
    // Reportes
    { modulo: 'reporte', accion: 'ver' },
    // Seguridad
    { modulo: 'permiso', accion: 'editar' },
  ];

  const permisos = await Promise.all(
    permisosData.map((p) =>
      prisma.permiso.upsert({
        where: { modulo_accion: { modulo: p.modulo, accion: p.accion } },
        update: {},
        create: p,
      }),
    ),
  );
  console.log('✅ Permisos creados');

  // ==========================================
  // ASIGNAR PERMISOS A ROLES
  // ==========================================
  const adminRole = roles.find((r) => r.nombre === 'ADMIN');
  const allPermisos = permisos.map((p) => ({ permisoId: p.id }));

  // ADMIN tiene todos los permisos
  for (const permiso of allPermisos) {
    await prisma.rolPermiso.upsert({
      where: { rolId_permisoId: { rolId: adminRole!.id, permisoId: permiso.permisoId } },
      update: {},
      create: { rolId: adminRole!.id, permisoId: permiso.permisoId },
    });
  }
  console.log('✅ Permisos asignados a ADMIN');

  // ==========================================
  // BECAS Y CRITERIOS (demo)
  // ==========================================
  const becas = await Promise.all([
    prisma.beca.upsert({
      where: { id: '00000000-0000-4000-8000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-4000-8000-000000000001',
        nombre: 'Beca de Excelencia Académica',
        descripcion: 'Para estudiantes con alto rendimiento académico',
      },
    }),
    prisma.beca.upsert({
      where: { id: '00000000-0000-4000-8000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-4000-8000-000000000002',
        nombre: 'Beca de Permanencia Universitaria',
        descripcion: 'Para estudiantes en riesgo de deserción',
      },
    }),
  ]);
  console.log('✅ Becas creadas');

  const becaDemo = becas[0];
  await prisma.criterioEvaluacion.upsert({
    where: { id: '00000000-0000-4000-8000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000011',
      becaId: becaDemo.id,
      nombre: 'Rendimiento académico',
      peso: 0.6,
    },
  });
  console.log('✅ Criterios de evaluación creados (demo)');

  // ==========================================
  // GÉNEROS
  // ==========================================
  const generos = ['Masculino', 'Femenino', 'Otro'];
  for (const nombre of generos) {
    await prisma.genero.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log('✅ Géneros creados');

  // ==========================================
  // NIVELES ACADÉMICOS
  // ==========================================
  const niveles = ['Primaria', 'Secundaria', 'Técnico', 'Universitario', 'Posgrado'];
  for (const nombre of niveles) {
    await prisma.nivelAcademico.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log('✅ Niveles académicos creados');

  // ==========================================
  // DEPARTAMENTOS DE GUATEMALA
  // ==========================================
  const departamentos = [
    'Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 'Chiquimula',
    'El Proverbio', 'Escuintla', 'Guatemala', 'Huehuetenango',
    'Izabal', 'Jalapa', 'Jutiapa', 'Petén',
    'Quetzaltenango', 'Quiché', 'Retalhuleu', 'Sacatepéquez',
    'San Marcos', 'Santa Rosa', 'Sololá', 'Suchitepéquez',
    'Totonicapán', 'Zacapa',
  ];

  for (const nombre of departamentos) {
    await prisma.departamento.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log('✅ Departamentos creados');

  // ==========================================
  // MUNICIPIOS (muestra por departamento)
  // ==========================================
  const guatemala = await prisma.departamento.findUnique({ where: { nombre: 'Guatemala' } });
  if (guatemala) {
    const municipiosGuatemala = [
      'Guatemala', 'Mixco', 'Villa Nueva', 'Quetzaltenango',
      'San Juan Sacatepéquez', 'San José Pinula', 'Florida',
    ];
    for (const nombre of municipiosGuatemala) {
      await prisma.municipio.upsert({
        where: { nombre_departamentoId: { nombre, departamentoId: guatemala.id } },
        update: {},
        create: { nombre, departamentoId: guatemala.id },
      });
    }
  }
  console.log('✅ Municipios creados (muestra)');

  // ==========================================
  // TIPOS DE DOCUMENTO
  // ==========================================
  const documentos = [
    'Certificado académico',
    'Constancia de estudios',
    'Cédula de depletedción',
    'Fotografía',
    'Comprobante de ingresos',
    'Carta de recomendación',
  ];
  for (const nombre of documentos) {
    await prisma.documentoTipo.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log('✅ Tipos de documento creados');

  // ==========================================
  // USUARIO ADMIN POR DEFECTO
  // ==========================================
  const adminRoleData = await prisma.rol.findUnique({ where: { nombre: 'ADMIN' } });
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  await prisma.usuario.upsert({
    where: { cui: '1234567890123' },
    update: {},
    create: {
      cui: '1234567890123',
      nombres: 'Administrador SIGEB',
      email: 'admin@sigeb.gov.gt',
      passwordHash: hashedPassword,
      rolId: adminRoleData!.id,
      estado: 'ACTIVO',
    },
  });
  console.log('✅ Usuario admin creado (admin@sigeb.gov.gt / Admin123!)');

  // ==========================================
  // DEMO PORTAL PÚBLICO S2 (US-46) — cambios de David
  // Postulante demo + convocatoria ABIERTA + solicitud de ejemplo
  // ==========================================
  const postulanteRoleS2 = await prisma.rol.findUnique({
    where: { nombre: 'POSTULANTE' },
  });

  const demoPostulante = await prisma.usuario.upsert({
    where: { cui: '9999999999999' },
    update: { estado: 'ACTIVO' },
    create: {
      cui: '9999999999999',
      nombres: 'Postulante Demo',
      email: 'postulante@demo.gt',
      passwordHash: hashedPassword,
      rolId: postulanteRoleS2!.id,
      estado: 'ACTIVO',
    },
  });
  console.log('✅ Usuario postulante demo creado (postulante@demo.gt / Admin123!)');

  const convPortalDemo = await prisma.convocatoria.upsert({
    where: { id: '00000000-0000-4000-8000-000000000021' },
    update: { estado: 'ABIERTA' },
    create: {
      id: '00000000-0000-4000-8000-000000000021',
      nombre: 'Beca Excelencia 2026 (Demo Portal)',
      descripcion: 'Convocatoria abierta de prueba para el portal público',
      becaId: becaDemo.id,
      estado: 'ABIERTA',
      fechaApertura: new Date(),
      fechaCierre: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const solicitudDemo = await prisma.solicitud.upsert({
    where: { id: '00000000-0000-4000-8000-000000000031' },
    update: { estado: 'ENVIADA' },
    create: {
      id: '00000000-0000-4000-8000-000000000031',
      convocatoriaId: convPortalDemo.id,
      usuarioId: demoPostulante.id,
      estado: 'ENVIADA',
    },
  });
  console.log('📋 CODIGO_DEMO_PARA_CONSULTA=', solicitudDemo.id);

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## §8 Apéndice C — Código demo de la consulta (US-46)

- El endpoint público es `GET /api/solicitudes/consulta/:codigo`.
- El "código" de una solicitud es su **UUID** (`Solicitud.id`). El seed imprime en
  consola `CODIGO_DEMO_PARA_CONSULTA=<uuid>` (siempre el mismo: el del bloque demo).
- Para la demo guiada de cierre: `home → convocatorias (filtro) → detalle → consulta por
  ese UUID → nosotros/footer`. El resultado mostrará el estado `ENVIADA`.
- Credenciales de seed: `admin@sigeb.gov.gt / Admin123!`, `postulante@demo.gt / Admin123!`.