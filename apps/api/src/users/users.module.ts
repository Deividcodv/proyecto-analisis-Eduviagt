import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { RolesService } from './roles.service';
import { PermisosService } from './permisos.service';
import { UsuariosService } from './usuarios.service';
import { UsersController } from './users.controller';
import { ConfiguracionController } from './configuracion.controller';
import { ConfiguracionUsuarioService } from './configuracion.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController, ConfiguracionController],
  providers: [
    RolesService,
    PermisosService,
    UsuariosService,
    UsersService,
    ConfiguracionUsuarioService,
  ],
  exports: [
    UsersService,
    RolesService,
    PermisosService,
    UsuariosService,
    ConfiguracionUsuarioService,
  ],
})
export class UsersModule {}
