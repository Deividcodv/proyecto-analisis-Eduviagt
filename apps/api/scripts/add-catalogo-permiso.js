// Script puntual para S-013: añade el permiso `catalogo:gestionar` y lo
// concede a ADMIN en la base de desarrollo `sigeb` (idempotente).
// Uso: node scripts/add-catalogo-permiso.js
const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  try {
    const permiso = await p.permiso.upsert({
      where: { modulo_accion: { modulo: 'catalogo', accion: 'gestionar' } },
      update: {},
      create: { modulo: 'catalogo', accion: 'gestionar' },
    });
    const admin = await p.rol.findUnique({ where: { nombre: 'ADMIN' } });
    if (!admin) {
      console.log('NO_ADMIN');
      return;
    }
    await p.rolPermiso.upsert({
      where: { rolId_permisoId: { rolId: admin.id, permisoId: permiso.id } },
      update: {},
      create: { rolId: admin.id, permisoId: permiso.id },
    });
    console.log('OK catalogo:gestionar -> ADMIN');
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
