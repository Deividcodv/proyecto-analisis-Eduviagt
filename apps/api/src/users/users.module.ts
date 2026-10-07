import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { RolesService } from './roles.service';
import { PermisosService } from './permisos.service';
import { UsuariosService } from './usuarios.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [RolesService, PermisosService, UsuariosService, UsersService],
  exports: [UsersService, RolesService, PermisosService, UsuariosService],
})
export class UsersModule {}
