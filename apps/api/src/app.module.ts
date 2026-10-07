import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StorageModule } from './storage/storage.module';
import { CatalogosModule } from './catalogos/catalogos.module';
import { ConvocatoriasModule } from './convocatorias/convocatorias.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { EvaluacionesModule } from './evaluaciones/evaluaciones.module';
import { ComitesModule } from './comites/comites.module';
import { SesionesModule } from './sesiones/sesiones.module';
import { ReportesModule } from './reportes/reportes.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { AuditModule } from './audit/audit.module';
import { AsistenteModule } from './asistente/asistente.module';

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
    ConvocatoriasModule,
    SolicitudesModule,
    EvaluacionesModule,
    ComitesModule,
    SesionesModule,
    ReportesModule,
    NotificacionesModule,
    AuditModule,
    AsistenteModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
