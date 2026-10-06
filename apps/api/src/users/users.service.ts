import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { RolesService } from './roles.service';
import { PermisosService } from './permisos.service';
import { UsuariosService } from './usuarios.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { AssignPermisoDto } from './dto/assign-permiso.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AssignUsuarioPermisosDto } from './dto/assign-usuario-permisos.dto';

/**
 * Fachada de seguridad: delega cada responsabilidad a un servicio de dominio
 * enfocado (RolesService, PermisosService, UsuariosService).
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly roles: RolesService,
    private readonly permisos: PermisosService,
    private readonly usuarios: UsuariosService,
  ) {}

  findAllRoles() {
    return this.roles.findAll();
  }

  findRolById(id: string) {
    return this.roles.findById(id);
  }

  createRol(dto: CreateRolDto, usuario: AuthenticatedUser) {
    return this.roles.create(dto, usuario);
  }

  updateRol(id: string, dto: UpdateRolDto, usuario: AuthenticatedUser) {
    return this.roles.update(id, dto, usuario);
  }

  deleteRol(id: string, usuario: AuthenticatedUser) {
    return this.roles.remove(id, usuario);
  }

  assignPermisoToRol(
    rolId: string,
    dto: AssignPermisoDto,
    usuario: AuthenticatedUser,
  ) {
    return this.roles.assignPermisos(rolId, dto, usuario);
  }

  findAllPermisos() {
    return this.permisos.findAll();
  }

  findAllUsuarios(rol?: string) {
    return this.usuarios.findAll(rol);
  }

  findUsuarioById(id: string) {
    return this.usuarios.findById(id);
  }

  createUsuario(dto: CreateUsuarioDto, usuario: AuthenticatedUser) {
    return this.usuarios.create(dto, usuario);
  }

  updateUsuario(id: string, dto: UpdateUsuarioDto, usuario: AuthenticatedUser) {
    return this.usuarios.update(id, dto, usuario);
  }

  assignUsuarioPermisos(
    id: string,
    dto: AssignUsuarioPermisosDto,
    usuario: AuthenticatedUser,
  ) {
    return this.usuarios.assignPermisos(id, dto, usuario);
  }
}
