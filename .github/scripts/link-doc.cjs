const { PrismaClient } = require('@prisma/client');
(async () => {
  const [convId, nombre] = process.argv.slice(2);
  const p = new PrismaClient();
  const tipo = await p.documentoTipo.findUnique({ where: { nombre } });
  if (!tipo) {
    console.error('Tipo de documento no existe:', nombre);
    process.exit(1);
  }
  await p.convocatoriaDocRequerido.upsert({
    where: {
      convocatoriaId_documentoTipoId: {
        convocatoriaId: convId,
        documentoTipoId: tipo.id,
      },
    },
    update: {},
    create: { convocatoriaId: convId, documentoTipoId: tipo.id, obligatorio: true },
  });
  console.log('Documento vinculado:', nombre);
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});