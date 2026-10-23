import { Module, Global } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import {
  PERMISSION_SERVICE,
  PermissionService,
} from './guards/permission.service';
import { AuthzService } from './services/authz.service';
import { AllExceptionsFilter } from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    AuthzService,
    {
      provide: PERMISSION_SERVICE,
      useClass: PermissionService,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      // El registro va antes de la transformacion: asi la linea de log se
      // escribe cuando la peticion termina, con el estado ya fijado.
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [AuthzService],
})
export class CommonModule {}
